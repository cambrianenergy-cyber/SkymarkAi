// app/app/channel-verification/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthWorkspaceGuard } from '@/lib/useAuthWorkspaceGuard';
import { CheckCircle, AlertCircle, XCircle, Send, Copy, Check } from 'lucide-react';

interface ChannelStatus {
  name: string;
  connected: boolean;
  lastTest?: string;
  testEndpoint: string;
  credentialsValid?: boolean;
}

export default function ChannelVerificationPage() {
  const { isReady, isAuthorized, workspaceId } = useAuthWorkspaceGuard();
  const [channels, setChannels] = useState<ChannelStatus[]>([
    {
      name: 'Email',
      connected: false,
      testEndpoint: '/api/webhooks/test/email',
      credentialsValid: false,
    },
    {
      name: 'Instagram',
      connected: false,
      testEndpoint: '/api/webhooks/test/instagram',
      credentialsValid: false,
    },
    {
      name: 'Meta/Facebook',
      connected: false,
      testEndpoint: '/api/webhooks/test/meta',
      credentialsValid: false,
    },
    {
      name: 'LinkedIn',
      connected: false,
      testEndpoint: '/api/webhooks/test/linkedin',
      credentialsValid: false,
    },
    {
      name: 'CRM',
      connected: false,
      testEndpoint: '/api/webhooks/test/crm',
      credentialsValid: false,
    },
    {
      name: 'Scheduler',
      connected: false,
      testEndpoint: '/api/webhooks/test/scheduler',
      credentialsValid: false,
    },
  ]);

  const [copiedEndpoint, setCopiedEndpoint] = useState<string>('');
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  const [disabledChannels, setDisabledChannels] = useState<string[]>([]);
  useEffect(() => {
    if (!workspaceId) return;
    (async () => {
      const wsRef = doc(db, 'workspaces', workspaceId);
      const wsSnap = await getDoc(wsRef);
      if (wsSnap.exists()) {
        setDisabledChannels(wsSnap.data().disabledChannels || []);
      }
    })();
  }, [workspaceId]);

  async function toggleChannelDisabled(channelName: string) {
    if (!workspaceId) return;
    const wsRef = doc(db, 'workspaces', workspaceId);
    let next: string[];
    if (disabledChannels.includes(channelName)) {
      next = disabledChannels.filter((c) => c !== channelName);
    } else {
      next = [...disabledChannels, channelName];
    }
    setDisabledChannels(next);
    await setDoc(wsRef, { disabledChannels: next }, { merge: true });
  }

  const testChannel = async (channelName: string) => {
    setTestingChannel(channelName);
    try {
      const response = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          channel: channelName.toLowerCase(),
          testPayload: {
            event: 'verification_test',
            timestamp: new Date().toISOString(),
            correlationId: `test_${Date.now()}`,
          },
        }),
      });

      const result = await response.json();

      setChannels((prev) =>
        prev.map((ch) =>
          ch.name === channelName
            ? {
                ...ch,
                connected: result.connected,
                credentialsValid: result.credentialsValid,
                lastTest: new Date().toLocaleTimeString(),
              }
            : ch
        )
      );
    } catch (error) {
      console.error(`Failed to test ${channelName}:`, error);
    } finally {
      setTestingChannel(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(text);
    setTimeout(() => setCopiedEndpoint(''), 2000);
  };

  if (!isReady) return <div className="p-4">Loading...</div>;
  if (!isAuthorized) return <div className="p-4">Not authorized</div>;

  const connectedCount = channels.filter((ch) => ch.connected).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2"> Channel Verification</h1>
        <p className="text-gray-600">
          <b>Channels are the bridge between Uqentra and the real world.</b> Connect only <b>business-owned</b> accounts (never personal or temporary credentials).<br/>
          <b>Every channel must be verified and permissions reviewed before use.</b> Automation amplifies mistakes as easily as it amplifies success.
        </p>
      </div>

      {/* Status Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 mb-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600">Channels Connected</p>
            <p className="text-2xl font-bold text-blue-900">
              {connectedCount}/{channels.length}
            </p>
          </div>
          <div className="text-4xl">
            {connectedCount === channels.length ? '' : ''}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-amber-900 mb-2">Channel Connection Rules:</h3>
        <ul className="text-sm text-amber-800 list-disc list-inside space-y-1">
          <li><b>Only connect company-owned or shared business accounts.</b> Never use personal, temporary, or contractor credentials.</li>
          <li>When connecting, <b>review all requested permissions</b> and confirm they match intended use. Deny if excessive.</li>
          <li>Every channel must be <b>tested and verified</b> before use in live workflows.</li>
          <li>Never skip verification. A channel that appears connected but is untested is untrusted.</li>
        </ul>
      </div>

      {/* Channel Grid */}
      <div className="grid gap-4">
        {channels.map((channel) => {
          const isDisabled = disabledChannels.includes(channel.name);
          return (
            <div
              key={channel.name}
              className={`border rounded-lg p-4 ${
                isDisabled
                  ? 'bg-gray-200 border-gray-400 opacity-60'
                  : channel.connected
                  ? 'bg-green-50 border-green-200'
                  : channel.credentialsValid === false
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {channel.connected ? (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                ) : channel.credentialsValid === false ? (
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                )}
                <div>
                  <h3 className="font-semibold">{channel.name}</h3>
                  {channel.lastTest && (
                    <p className="text-xs text-gray-500">Last test: {channel.lastTest}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  // Permission review modal
                  const confirmed = window.confirm(
                    'Before connecting, confirm:\n\n- This is a business-owned account (not personal or temporary)\n- You have reviewed all requested permissions and they match intended use\n- You will verify the channel before using in live workflows\n\nProceed to test this channel?'
                  );
                  if (confirmed) testChannel(channel.name);
                }}
                disabled={testingChannel === channel.name || isDisabled}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {testingChannel === channel.name ? 'Testing...' : 'Test'}
              </button>
              <button
                onClick={() => toggleChannelDisabled(channel.name)}
                className={`ml-2 px-3 py-2 rounded text-xs font-semibold ${isDisabled ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-800'}`}
                title={isDisabled ? 'Enable Channel' : 'Disable Channel'}
              >
                {isDisabled ? 'Enable' : 'Disable'}
              </button>
            </div>

            {/* Test Endpoint Info */}
            <div className="bg-white rounded p-3 text-sm">
              <p className="text-gray-600 mb-1">Webhook endpoint:</p>
              <div className="flex items-center gap-2 bg-gray-100 rounded p-2 font-mono text-xs">
                <code className="flex-1 break-all">{channel.testEndpoint}</code>
                <button
                  onClick={() => copyToClipboard(channel.testEndpoint)}
                  className="flex-shrink-0 p-1 hover:bg-gray-200 rounded"
                  title="Copy endpoint"
                >
                  {copiedEndpoint === channel.testEndpoint ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Status Details */}
            {isDisabled && (
              <div className="mt-2 text-xs text-gray-700 bg-gray-100 rounded p-2">
                 This channel is <b>disabled</b> at the workspace level. Workflows using this channel will be paused.
              </div>
            )}
            {channel.credentialsValid === false && (
              <div className="mt-2 text-xs text-red-700 bg-red-100 rounded p-2">
                 Credentials not found or invalid. Check your API keys in Settings  Integrations.
              </div>
            )}
            {channel.connected && !isDisabled && (
              <div className="mt-2 text-xs text-green-700 bg-green-100 rounded p-2">
                 Connected! This channel can receive events from agents.
              </div>
            )}
          </div>
        );
      })}
      </div>

      {/* Next Steps */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li> Verify all channels show </li>
          <li> Go to <a href="/app/golden-workflow" className="font-semibold underline">Golden Workflow</a> to run a full integration test</li>
          <li> Check <a href="/app/agent-activity" className="font-semibold underline">Agent Activity</a> after running golden workflow</li>
        </ul>
      </div>
    </div>
  );
}

