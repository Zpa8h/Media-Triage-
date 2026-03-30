import React from 'react';

const FILTERS = [
  { id: 'all',       label: 'All' },
  { id: 'undecided', label: 'Undecided' },
  { id: 'skipped',   label: 'Skipped' },
  { id: 'decided',   label: 'Decided' },
];

export default function FilterBar({ active, counts, onChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: 6,
      padding: '8px 0',
    }}>
      {FILTERS.map(f => {
        const count = counts?.[f.id] ?? 0;
        const isActive = active === f.id;
        return (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius)',
              border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
              background: isActive ? 'var(--accent-bg)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-dim)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: isActive ? 700 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.1s',
            }}
          >
            {f.label}
            <span style={{
              fontSize: 10,
              background: isActive ? 'var(--accent-dim)' : 'var(--surface-3)',
              borderRadius: 3,
              padding: '1px 5px',
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
            }}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
