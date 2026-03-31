import React, { useState } from 'react';

const PHASE_LABELS = ['Scan', 'Configure', 'Triage', 'Export'];

function StopButton() {
  const [state, setState] = useState('idle'); // idle | stopping | stopped

  async function handleStop() {
    if (state !== 'idle') return;
    setState('stopping');
    try {
      await fetch('/api/shutdown', { method: 'POST' });
    } catch {
      // Expected — the server closes the connection as it exits
    }
    setState('stopped');
  }

  const label = state === 'idle' ? '⏻  stop server'
    : state === 'stopping' ? 'stopping…'
    : 'stopped';

  return (
    <button
      onClick={handleStop}
      disabled={state !== 'idle'}
      title="Stop the dev server"
      style={{
        marginLeft: 'auto',
        background: 'transparent',
        border: '1px solid',
        borderColor: state === 'idle' ? 'var(--border)' : 'transparent',
        borderRadius: 'var(--radius)',
        padding: '4px 10px',
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        color: state === 'stopped' ? 'var(--text-muted)' : 'var(--text-dim)',
        cursor: state === 'idle' ? 'pointer' : 'default',
        letterSpacing: '0.05em',
        transition: 'color 0.15s, border-color 0.15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (state === 'idle') e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red)'; }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      {label}
    </button>
  );
}

export default function PhaseBar({ phases, current, sessionId, onNavigate }) {
  return (
    <nav style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      height: 48,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <span style={{
        fontWeight: 700,
        fontSize: 13,
        color: 'var(--accent)',
        marginRight: 32,
        letterSpacing: '0.05em',
      }}>
        MEDIA-TRIAGE
      </span>

      <div style={{ display: 'flex', gap: 0 }}>
        {phases.map((phase, i) => {
          const isActive = i === current;
          const isDone = i < current;
          const isReachable = sessionId || i === 0;
          const canClick = isReachable && !isActive;

          return (
            <button
              key={phase}
              onClick={() => canClick && onNavigate(i)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                padding: '0 16px',
                height: 48,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                fontWeight: isActive ? 700 : 400,
                color: isActive ? 'var(--accent)' : isDone ? 'var(--text-dim)' : 'var(--text-muted)',
                cursor: canClick ? 'pointer' : 'default',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                transition: 'color 0.15s',
                whiteSpace: 'nowrap',
              }}
              disabled={!canClick}
            >
              <span style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                background: isActive ? 'var(--accent)' : isDone ? 'var(--surface-3)' : 'var(--surface-3)',
                color: isActive ? '#000' : isDone ? 'var(--text-dim)' : 'var(--text-muted)',
                border: '1px solid',
                borderColor: isActive ? 'var(--accent)' : isDone ? 'var(--border-2)' : 'var(--border)',
                flexShrink: 0,
              }}>
                {isDone ? '✓' : i + 1}
              </span>
              {PHASE_LABELS[i]}
            </button>
          );
        })}
      </div>

      <StopButton />
    </nav>
  );
}
