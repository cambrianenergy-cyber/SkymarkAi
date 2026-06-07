"use client";

import { useRouter } from "next/navigation";
import { INDUSTRY_PLAYBOOKS } from "../../../../lib/playbooks";
import { getAgentSpecialization } from "@/lib/agentRunnerRegistry";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import React, { useState } from "react";

export default function PlaybookDetailPage({ params }: { params: { playbookId: string } }) {
  const router = useRouter();
  const playbook = INDUSTRY_PLAYBOOKS.find(p => p.id === params.playbookId);

  if (!playbook) return <div style={{ padding: 48 }}>Playbook not found.</div>;


  // Accordion state for each section

  const [open, setOpen] = useState({
    agents: true,
    timeline: false,
    messaging: false,
    results: false,
    status: false,
  });
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  function toggle(section: keyof typeof open) {
    setOpen(prev => ({ ...prev, [section]: !prev[section] }));
  }

  return (
    <main style={{ padding: 32, maxWidth: 900, margin: "0 auto", fontFamily: 'Segoe UI, Arial, sans-serif', background: 'linear-gradient(120deg, #e3f2fd 0%, #f5f7fa 100%)', minHeight: '100vh', boxShadow: '0 8px 32px rgba(33,150,243,0.10)' }}>
      <button
        onClick={() => router.back()}
        style={{ background: '#fff', color: '#1976d2', border: '1.5px solid #b0bec5', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 15, marginBottom: 18, cursor: 'pointer', marginRight: 18 }}
      >
        <ArrowLeft style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} /> Back
      </button>
      <h1 style={{ fontSize: 38, fontWeight: 900, margin: '18px 0 8px 0', letterSpacing: 1 }}>{playbook.title}</h1>
      <div style={{ fontSize: 18, color: '#00897b', fontWeight: 700, marginBottom: 8 }}>{playbook.industry}</div>
      <p style={{ color: '#263238', fontSize: 17, margin: '8px 0 24px 0', maxWidth: 700 }}>{playbook.description}</p>

      {/* Agents Section */}
      <div style={{ marginBottom: 18, borderRadius: 12, background: '#fff', boxShadow: '0 2px 8px rgba(33,150,243,0.05)' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '18px 24px', borderBottom: open.agents ? '1.5px solid #b0bec5' : 'none' }}
          onClick={() => toggle('agents')}
        >
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1976d2', flex: 1, margin: 0 }}>Included Agents</h2>
          {open.agents ? <ChevronUp /> : <ChevronDown />}
        </div>
        {open.agents && (
          <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 10, listStyle: 'none', padding: 24, paddingTop: 0 }}>
            {playbook.agentPresets.map(agent => (
              <li
                key={agent.agentType}
                style={{
                  background: selectedAgent === agent.agentType ? '#1976d2' : '#e3f2fd',
                  color: selectedAgent === agent.agentType ? '#fff' : '#1976d2',
                  borderRadius: 12,
                  padding: '8px 18px',
                  fontWeight: 700,
                  fontSize: 15,
                  border: '1.5px solid #b0bec5',
                  cursor: 'pointer',
                  boxShadow: selectedAgent === agent.agentType ? '0 2px 8px rgba(33,150,243,0.15)' : undefined,
                  transition: 'all 0.15s',
                }}
                onClick={e => {
                  e.stopPropagation();
                  setSelectedAgent(selectedAgent === agent.agentType ? null : agent.agentType);
                }}
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedAgent(selectedAgent === agent.agentType ? null : agent.agentType);
                  }
                }}
                aria-label={`Show details for ${agent.agentType.replace(/_/g, ' ')}`}
              >
                {agent.agentType.replace(/_/g, ' ')}
              </li>
            ))}
          </ul>
        )}
        {/* Agent Role Explanation */}
        {open.agents && selectedAgent && (
          <div style={{ background: '#f5f7fa', border: '1.5px solid #b0bec5', borderRadius: 10, margin: '0 24px 18px 24px', padding: '18px 22px', color: '#263238', fontSize: 16, boxShadow: '0 2px 8px rgba(33,150,243,0.04)' }}>
            <b>Role in this Playbook:</b>
            <div style={{ marginTop: 6 }}>
              {getAgentSpecialization(selectedAgent) || 'No description available.'}
            </div>
          </div>
        )}
      </div>

      {/* Timeline Section */}
      <div style={{ marginBottom: 18, borderRadius: 12, background: '#fff', boxShadow: '0 2px 8px rgba(33,150,243,0.05)' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '18px 24px', borderBottom: open.timeline ? '1.5px solid #b0bec5' : 'none' }}
          onClick={() => toggle('timeline')}
        >
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1976d2', flex: 1, margin: 0 }}>Implementation Timeline</h2>
          {open.timeline ? <ChevronUp /> : <ChevronDown />}
        </div>
        {open.timeline && (
          <ol style={{ padding: 24, paddingTop: 0, paddingLeft: 48 }}>
            <li><b>Phase 1:</b> {playbook.cadence.phase1.duration} — {playbook.cadence.phase1.actions.join(', ')}</li>
            <li><b>Phase 2:</b> {playbook.cadence.phase2.duration} — {playbook.cadence.phase2.actions.join(', ')}</li>
            <li><b>Phase 3:</b> {playbook.cadence.phase3.duration} — {playbook.cadence.phase3.actions.join(', ')}</li>
          </ol>
        )}
      </div>

      {/* Messaging Frameworks Section */}
      <div style={{ marginBottom: 18, borderRadius: 12, background: '#fff', boxShadow: '0 2px 8px rgba(33,150,243,0.05)' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '18px 24px', borderBottom: open.messaging ? '1.5px solid #b0bec5' : 'none' }}
          onClick={() => toggle('messaging')}
        >
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1976d2', flex: 1, margin: 0 }}>Messaging Frameworks</h2>
          {open.messaging ? <ChevronUp /> : <ChevronDown />}
        </div>
        {open.messaging && (
          playbook.messagingFrameworks && playbook.messagingFrameworks.length > 0 ? (
            <ul style={{ padding: 24, paddingTop: 0 }}>
              {playbook.messagingFrameworks.map((msg, idx) => (
                <li key={idx} style={{ marginBottom: 12 }}>
                  <b>{msg.scenario}:</b> <span style={{ color: '#607d8b' }}>{msg.template}</span>
                  <div style={{ fontSize: 13, color: '#00897b', marginTop: 2 }}>Variables: {msg.variables.join(', ')} | Tone: {msg.tone}</div>
                </li>
              ))}
            </ul>
          ) : <div style={{ color: '#607d8b', padding: 24, paddingTop: 0 }}>No messaging frameworks for this playbook.</div>
        )}
      </div>

      {/* Expected Results Section */}
      <div style={{ marginBottom: 18, borderRadius: 12, background: '#fff', boxShadow: '0 2px 8px rgba(33,150,243,0.05)' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '18px 24px', borderBottom: open.results ? '1.5px solid #b0bec5' : 'none' }}
          onClick={() => toggle('results')}
        >
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1976d2', flex: 1, margin: 0 }}>Expected Results</h2>
          {open.results ? <ChevronUp /> : <ChevronDown />}
        </div>
        {open.results && (
          <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 14, listStyle: 'none', padding: 24, paddingTop: 0 }}>
            {playbook.kpiExpectations.map((result, idx) => (
              <li key={idx} style={{ background: '#fff', color: '#1976d2', borderRadius: 12, padding: '18px 14px', fontWeight: 700, fontSize: 16, border: '1.5px solid #b0bec5', minWidth: 120 }}>
                <div style={{ fontSize: 22, fontWeight: 900 }}>{result.target}</div>
                <div style={{ fontSize: 13, color: '#607d8b', marginTop: 2 }}>{result.metric} • {result.timeframe}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Status & Access Section */}
      <div style={{ marginBottom: 18, borderRadius: 12, background: '#fff', boxShadow: '0 2px 8px rgba(33,150,243,0.05)' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '18px 24px', borderBottom: open.status ? '1.5px solid #b0bec5' : 'none' }}
          onClick={() => toggle('status')}
        >
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1976d2', flex: 1, margin: 0 }}>Status & Access</h2>
          {open.status ? <ChevronUp /> : <ChevronDown />}
        </div>
        {open.status && (
          <div style={{ padding: 24, paddingTop: 0 }}>
            <div style={{ fontSize: 16, color: playbook.status === 'locked' ? '#ff9800' : '#1976d2', fontWeight: 700 }}>
              {playbook.status === 'locked' ? 'Locked (Upgrade or Founder Access Required)' : 'Public (Available to All Users)'}
            </div>
            {playbook.founderAccess && <div style={{ color: '#0f9d58', fontWeight: 700, marginTop: 4 }}>👑 Founder Full Access</div>}
            {playbook.price && <div style={{ color: '#ff9800', fontWeight: 700, marginTop: 4 }}>${playbook.price}/month</div>}
          </div>
        )}
      </div>
    </main>
  );
}
