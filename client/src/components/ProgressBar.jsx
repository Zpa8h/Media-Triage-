import React from 'react';

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function ProgressBar({ cards, currentIndex }) {
  const total = cards.length;
  const decided = cards.filter(c => c.decision !== null && c.decision !== 'skip').length;
  const skipped = cards.filter(c => c.decision === 'skip').length;
  const undecided = total - decided - skipped;
  const pct = total > 0 ? Math.round((decided / total) * 100) : 0;

  return (
    <div style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '10px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      fontSize: 12,
      color: 'var(--text-dim)',
    }}>
      {/* Progress bar track */}
      <div style={{
        flex: '1 1 200px',
        maxWidth: 300,
        height: 4,
        background: 'var(--surface-3)',
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Decided */}
        <div style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: `${(decided / total) * 100}%`,
          background: 'var(--green)',
          transition: 'width 0.2s',
        }} />
        {/* Skipped */}
        <div style={{
          position: 'absolute',
          left: `${(decided / total) * 100}%`,
          top: 0, bottom: 0,
          width: `${(skipped / total) * 100}%`,
          background: 'var(--text-muted)',
          transition: 'width 0.2s',
        }} />
      </div>

      <span style={{ whiteSpace: 'nowrap' }}>
        <span style={{ color: 'var(--text)', fontWeight: 700 }}>{decided}</span>
        <span> / {total} decided</span>
        {skipped > 0 && <span> · {skipped} skipped</span>}
        {undecided > 0 && <span> · {undecided} remaining</span>}
        <span style={{ marginLeft: 8, color: 'var(--accent)' }}>{pct}%</span>
      </span>

      {currentIndex != null && (
        <span style={{ whiteSpace: 'nowrap', marginLeft: 'auto' }}>
          card {currentIndex + 1} of {total}
        </span>
      )}
    </div>
  );
}
