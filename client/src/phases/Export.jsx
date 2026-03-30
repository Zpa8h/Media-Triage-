import React, { useState } from 'react';
import { useSession } from '../hooks/useSession.js';
import { api } from '../api.js';
import ScriptViewer from '../components/ScriptViewer.jsx';
import PathDisplay from '../components/PathDisplay.jsx';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function Export({ sessionId, onBack }) {
  const { session, loading, error } = useSession(sessionId);
  const [includeSkipped, setIncludeSkipped] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [exportError, setExportError] = useState(null);

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const result = await api.exportSession(sessionId, includeSkipped);
      setExportResult(result);
    } catch (err) {
      setExportError(err.message);
    } finally {
      setExporting(false);
    }
  }

  if (loading) return <div className="page" style={{ paddingTop: 40, color: 'var(--text-dim)' }}>Loading…</div>;
  if (error) return <div className="page" style={{ paddingTop: 40, color: 'var(--red)' }}>{error}</div>;
  if (!session) return null;

  const cards = session.cards || [];
  const options = session.options || [];
  const optionMap = new Map(options.map(o => [o.id, o]));

  // Build summary counts
  const decided = cards.filter(c => c.decision && c.decision !== 'skip');
  const skipped = cards.filter(c => c.decision === 'skip');
  const undecided = cards.filter(c => !c.decision);

  const byOption = new Map();
  for (const opt of options) {
    byOption.set(opt.id, cards.filter(c => c.decision === opt.id));
  }

  return (
    <div className="page-wide" style={{ paddingTop: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ fontSize: 12 }}>
          ← Back to Triage
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Export</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left: summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Session info */}
          <div className="card-surface">
            <div className="section-title" style={{ marginBottom: 12 }}>Session</div>
            <div style={{ fontSize: 14, marginBottom: 6 }}>{session.label || '(unlabeled)'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', wordBreak: 'break-all' }}>{session.sourceDir}</div>
          </div>

          {/* Counts by option */}
          <div className="card-surface">
            <div className="section-title" style={{ marginBottom: 12 }}>Summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {options.map(opt => {
                const optCards = byOption.get(opt.id) || [];
                return (
                  <div key={opt.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--radius)',
                    borderLeft: `3px solid ${opt.color}`,
                  }}>
                    <span style={{ fontSize: 13, color: opt.color, fontWeight: 600 }}>{opt.label}</span>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>
                      {optCards.length} file{optCards.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                );
              })}
              {skipped.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius)',
                  borderLeft: '3px solid var(--text-muted)',
                }}>
                  <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>Skipped</span>
                  <span style={{ fontSize: 13 }}>{skipped.length}</span>
                </div>
              )}
              {undecided.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius)',
                  borderLeft: '3px solid var(--border)',
                }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Undecided</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{undecided.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* Export controls */}
          <div className="card-surface">
            <div className="section-title" style={{ marginBottom: 12 }}>Generate script</div>

            {undecided.length > 0 && (
              <div style={{
                background: 'rgba(245,166,35,0.08)',
                border: '1px solid var(--accent-dim)',
                borderRadius: 'var(--radius)',
                padding: '10px 14px',
                color: 'var(--accent)',
                fontSize: 12,
                marginBottom: 14,
                lineHeight: 1.6,
              }}>
                {undecided.length} card{undecided.length !== 1 ? 's' : ''} still undecided.
                The script will only include decided cards unless you export all.
              </div>
            )}

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 16,
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--text-dim)',
            }}>
              <input
                type="checkbox"
                checked={includeSkipped}
                onChange={e => setIncludeSkipped(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              Include skipped cards as comments in script
            </label>

            <button
              className="btn btn-primary"
              onClick={handleExport}
              disabled={exporting || decided.length === 0}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {exporting ? 'Generating…' : `Generate script (${decided.length} mv commands)`}
            </button>

            {exportError && (
              <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 12 }}>{exportError}</div>
            )}

            {exportResult && (
              <div style={{ color: 'var(--green)', fontSize: 12, marginTop: 12 }}>
                Saved to: <span style={{ fontFamily: 'var(--font-mono)' }}>{exportResult.scriptPath}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: decisions list + script */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Decisions grouped by option */}
          {options.map(opt => {
            const optCards = byOption.get(opt.id) || [];
            if (optCards.length === 0) return null;
            return (
              <div key={opt.id} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: opt.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: opt.color }}>{opt.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 'auto' }}>{optCards.length} files</span>
                </div>
                <div style={{ maxHeight: 240, overflowY: 'auto', padding: '4px 0' }}>
                  {optCards.map(card => (
                    <div key={card.id} style={{
                      padding: '7px 16px',
                      borderBottom: '1px solid var(--border)',
                      fontSize: 12,
                    }}>
                      <PathDisplay splitPoint={card.splitPoint} boldSegment={card.boldSegment} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Script viewer */}
          {exportResult && (
            <div>
              <div className="section-title" style={{ marginBottom: 10 }}>Generated script</div>
              <div style={{
                background: 'rgba(248,113,113,0.06)',
                border: '1px solid rgba(248,113,113,0.3)',
                borderRadius: 'var(--radius)',
                padding: '10px 14px',
                fontSize: 12,
                color: 'var(--red)',
                marginBottom: 12,
              }}>
                Review before running. This script will move files on your system.
              </div>
              <ScriptViewer script={exportResult.script} scriptPath={exportResult.scriptPath} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
