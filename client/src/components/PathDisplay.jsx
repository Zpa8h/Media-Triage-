import React from 'react';

/**
 * Renders a file path split into a dim prefix (splitPoint) and a
 * highlighted bold segment.
 */
export default function PathDisplay({ splitPoint, boldSegment, style }) {
  return (
    <span style={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all', ...style }}>
      <span style={{ color: 'var(--text-dim)' }}>{splitPoint}</span>
      <span style={{
        color: 'var(--text)',
        background: 'var(--accent-bg)',
        borderRadius: 3,
        padding: '1px 3px',
        outline: '1px solid var(--accent-dim)',
      }}>
        {boldSegment}
      </span>
    </span>
  );
}
