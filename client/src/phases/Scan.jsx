import React, { useState, useEffect } from 'react';
import { api } from '../api.js';

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function Scan({ onSessionCreated }) {
  const [sourceDir, setSourceDir] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    api.listSessions()
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoadingSessions(false));
  }, []);

  async function handleScan(e) {
    e.preventDefault();
    if (!sourceDir.trim()) return;
    setScanning(true);
    setError(null);
    try {
      const { sessionId, cardCount } = await api.scan(sourceDir.trim());
      onSessionCreated(sessionId, cardCount);
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="page" style={{ paddingTop: 40 }}>
      {/* New scan */}
      <div style={{ marginBottom: 48 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>
          Scan a directory
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
          Point at your media library. The scanner will find all media files and prepare them for triage.
          Nothing is moved or modified.
        </p>

        <form onSubmit={handleScan} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={sourceDir}
              onChange={e => setSourceDir(e.target.value)}
              placeholder="/home/user/Books"
              style={{ flex: 1, fontSize: 14 }}
              disabled={scanning}
              autoFocus
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={scanning || !sourceDir.trim()}
            >
              {scanning ? 'Scanning…' : 'Scan →'}
            </button>
          </div>

          {error && (
            <div style={{
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid var(--red)',
              borderRadius: 'var(--radius)',
              padding: '10px 14px',
              color: 'var(--red)',
              fontSize: 13,
            }}>
              {error}
            </div>
          )}
        </form>
      </div>

      {/* Resume existing sessions */}
      <div>
        <div className="section-title">Resume a session</div>

        {loadingSessions && (
          <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Loading sessions…</p>
        )}

        {!loadingSessions && sessions?.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            No sessions yet. Run a scan above to get started.
          </p>
        )}

        {sessions && sessions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessions.map(s => {
              const pct = s.cardCount > 0
                ? Math.round((s.decidedCount / s.cardCount) * 100)
                : 0;

              return (
                <button
                  key={s.id}
                  onClick={() => onSessionCreated(s.id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '4px 16px',
                    alignItems: 'center',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'var(--font-mono)',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: s.label ? 500 : 400, color: s.label ? 'var(--text)' : 'var(--text-dim)', marginBottom: 3 }}>
                      {s.label || '(unlabeled session)'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', wordBreak: 'break-all' }}>
                      {s.sourceDir}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>{pct}%</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {s.decidedCount}/{s.cardCount}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {formatDate(s.createdAt)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
