import React, { useState, useEffect } from 'react';
import { useSession } from '../hooks/useSession.js';
import { v4 as uuidv4 } from 'uuid';

const PRESET_COLORS = [
  '#4ade80', '#60a5fa', '#f59e0b', '#f87171',
  '#a78bfa', '#34d399', '#fb923c', '#e879f9',
];

const DEFAULT_OPTIONS = [
  { label: 'Keep',    destPath: '', color: '#4ade80' },
  { label: 'Archive', destPath: '', color: '#60a5fa' },
  { label: 'Delete',  destPath: '', color: '#f87171' },
];

export default function Configure({ sessionId, onDone }) {
  const { session, loading, error, updateSession } = useSession(sessionId);
  const [label, setLabel] = useState('');
  const [options, setOptions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Populate form from loaded session
  useEffect(() => {
    if (!session) return;
    setLabel(session.label || '');
    if (session.options && session.options.length > 0) {
      setOptions(session.options);
    } else {
      // Default options for new session
      setOptions(DEFAULT_OPTIONS.map(o => ({ ...o, id: uuidv4() })));
    }
  }, [session?.id]);

  function addOption() {
    if (options.length >= 8) return;
    const color = PRESET_COLORS[options.length % PRESET_COLORS.length];
    setOptions(prev => [...prev, { id: uuidv4(), label: '', destPath: '', color }]);
  }

  function removeOption(id) {
    setOptions(prev => prev.filter(o => o.id !== id));
  }

  function updateOption(id, field, value) {
    setOptions(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (options.some(o => !o.label.trim())) {
      setSaveError('Every option must have a label.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await updateSession({ label, options });
      onDone();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="page" style={{ paddingTop: 40, color: 'var(--text-dim)' }}>Loading…</div>;
  if (error) return <div className="page" style={{ paddingTop: 40, color: 'var(--red)' }}>{error}</div>;

  return (
    <div className="page" style={{ paddingTop: 40 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Configure session</h1>
      <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 28, lineHeight: 1.6 }}>
        Give your session a label and define where each decision sends files.
        Destination paths are only used in the generated shell script — nothing is moved now.
      </p>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Session label */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label className="section-title">Session label</label>
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="e.g. Ebook Library Triage — March 2026"
            style={{ maxWidth: 480 }}
          />
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label className="section-title">Destination buckets</label>
          <p style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: -4, marginBottom: 4 }}>
            Define 2–8 buckets. Leave "Destination path" blank to mean "leave in place".
          </p>

          {options.map((opt, i) => (
            <div
              key={opt.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 180px 1fr auto',
                gap: 10,
                alignItems: 'center',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '12px 14px',
                borderLeft: `3px solid ${opt.color}`,
              }}
            >
              {/* Color swatch + hotkey badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={opt.color}
                  onChange={e => updateOption(opt.id, 'color', e.target.value)}
                  title="Button color"
                  style={{
                    width: 28, height: 28,
                    border: 'none', background: 'none',
                    cursor: 'pointer', padding: 0,
                    borderRadius: 4,
                  }}
                />
                <span style={{
                  width: 20, height: 20,
                  borderRadius: 'var(--radius)',
                  background: opt.color + '33',
                  border: `1px solid ${opt.color}`,
                  color: opt.color,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {i + 1}
                </span>
              </div>

              <input
                type="text"
                value={opt.label}
                onChange={e => updateOption(opt.id, 'label', e.target.value)}
                placeholder="Label (e.g. Keep)"
                required
              />

              <input
                type="text"
                value={opt.destPath}
                onChange={e => updateOption(opt.id, 'destPath', e.target.value)}
                placeholder="Destination path (blank = leave in place)"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
              />

              <button
                type="button"
                onClick={() => removeOption(opt.id)}
                disabled={options.length <= 2}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: options.length <= 2 ? 'var(--text-muted)' : 'var(--text-dim)',
                  cursor: options.length <= 2 ? 'default' : 'pointer',
                  fontSize: 16,
                  padding: '0 4px',
                }}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}

          {options.length < 8 && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={addOption}
              style={{ alignSelf: 'flex-start', marginTop: 4 }}
            >
              + Add bucket
            </button>
          )}
        </div>

        {saveError && (
          <div style={{
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid var(--red)',
            borderRadius: 'var(--radius)',
            padding: '10px 14px',
            color: 'var(--red)',
            fontSize: 13,
          }}>
            {saveError}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || options.length < 2}
          >
            {saving ? 'Saving…' : 'Save & Start Triage →'}
          </button>
        </div>
      </form>
    </div>
  );
}
