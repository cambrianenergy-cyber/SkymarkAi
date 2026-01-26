// app/api/webhooks/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@lib/firebase';

interface TestPayload {
  event: string;
  timestamp: string;
  correlationId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      workspaceId: string;
      channel: string;
      testPayload: TestPayload;
    };

    const { workspaceId, channel, testPayload } = body;

    if (!workspaceId || !channel) {
      return NextResponse.json(
        { error: 'Missing workspaceId or channel' },
        { status: 400 }
      );
    }

    // Get workspace integrations
    const workspaceRef = doc(db, 'workspaces', workspaceId);
    const workspaceDoc = await getDoc(workspaceRef);

    if (!workspaceDoc.exists()) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const integrations = workspaceDoc.data()?.integrations || {};

    // Check if channel has credentials
    const channelCreds = integrations[channel];
    let connected = false;
    let credentialsValid = false;

    if (channelCreds && channelCreds.apiKey) {
      credentialsValid = true;

      // Simulate testing the connection based on channel type
      switch (channel.toLowerCase()) {
        case 'email': {
          // Test SMTP/Email service connection
          connected = !!channelCreds.smtpHost && !!channelCreds.smtpPort;
          break;
        }
        case 'instagram':
        case 'meta': {
          // Test Meta API token
          connected = !!channelCreds.accessToken && channelCreds.accessToken.length > 0;
          break;
        }
        case 'linkedin': {
          // Test LinkedIn credentials
          connected = !!channelCreds.accessToken && channelCreds.accessToken.length > 0;
          break;
        }
        case 'crm': {
          // Test CRM connection (HubSpot, Salesforce, etc.)
          connected = !!channelCreds.apiKey && channelCreds.apiKey.length > 0;
          break;
        }
        case 'scheduler': {
          // Test scheduler connection
          connected = !!channelCreds.apiKey && channelCreds.apiKey.length > 0;
          break;
        }
        default: {
          connected = !!channelCreds.apiKey;
        }
      }

      // Log the test event (in production, would actually send to the channel)
      console.log(`[CHANNEL-TEST] ${channel}: ${connected ? ' CONNECTED' : ' FAILED'}`, {
        workspaceId,
        correlationId: testPayload.correlationId,
        timestamp: testPayload.timestamp,
      });
    }

    return NextResponse.json({
      channel,
      connected,
      credentialsValid,
      testPayload,
      message: connected ? 'Channel test successful' : 'Channel test failed',
    });
  } catch (error) {
    console.error('Webhook test error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

