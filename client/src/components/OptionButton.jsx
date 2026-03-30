import React from 'react';

export default function OptionButton({ option, index, isSelected, onClick }) {
  const color = option.color || 'var(--accent)';

  return (
    <button
      onClick={onClick}
      title={option.destPath ? `→ ${option.destPath}` : 'Leave in place'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 18px',
        borderRadius: 'var(--radius)',
        border: `1px solid ${isSelected ? color : 'var(--border)'}`,
        background: isSelected
          ? `${color}22`
          : 'var(--surface-2)',
        color: isSelected ? color : 'var(--text)',
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        fontWeight: isSelected ? 700 : 400,
        cursor: 'pointer',
        transition: 'border-color 0.1s, background 0.1s, color 0.1s',
        flex: '1 1 0',
        minWidth: 0,
        justifyContent: 'center',
      }}
      onMouseEnter={e => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = color;
          e.currentTarget.style.color = color;
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.color = 'var(--text)';
        }
      }}
    >
      <span style={{
        width: 20,
        height: 20,
        borderRadius: 'var(--radius)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 700,
        background: color + '33',
        color: color,
        flexShrink: 0,
      }}>
        {index + 1}
      </span>
      {option.label}
    </button>
  );
}
