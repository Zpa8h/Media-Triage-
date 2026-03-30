import React from 'react';

const PHASE_LABELS = ['Scan', 'Configure', 'Triage', 'Export'];

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
    </nav>
  );
}
