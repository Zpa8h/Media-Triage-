import React from 'react';

export default function ScriptViewer({ script, scriptPath }) {
  const [copied, setCopied] = React.useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(script).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface-2)',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          {scriptPath || 'export.sh'}
        </span>
        <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={handleCopy}>
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>

      {/* Script content */}
      <pre style={{
        margin: 0,
        padding: '16px',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        lineHeight: 1.6,
        color: 'var(--text)',
        background: 'var(--bg)',
        overflowX: 'auto',
        maxHeight: '60vh',
        overflowY: 'auto',
        whiteSpace: 'pre',
      }}>
        {script.split('\n').map((line, i) => {
          let color = 'var(--text)';
          if (line.startsWith('#')) color = 'var(--text-dim)';
          else if (line.startsWith('mv ')) color = 'var(--green)';
          return (
            <div key={i} style={{ color }}>
              {line || '\u00a0'}
            </div>
          );
        })}
      </pre>
    </div>
  );
}
