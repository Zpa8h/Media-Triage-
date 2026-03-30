import React from 'react';
import PathDisplay from './PathDisplay.jsx';
import OptionButton from './OptionButton.jsx';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function Card({ card, options, onDecide, onSkip, notesRef }) {
  const [localNotes, setLocalNotes] = React.useState(card.notes || '');

  // Sync notes when card changes
  React.useEffect(() => {
    setLocalNotes(card.notes || '');
  }, [card.id]);

  function handleNotesBlur() {
    if (localNotes !== (card.notes || '')) {
      onDecide(card.decision, localNotes);
    }
  }

  const isSkipped = card.decision === 'skip';

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '32px 36px',
      boxShadow: 'var(--shadow-card)',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      minHeight: 360,
    }}>
      {/* Header: filename + badges */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{
          fontSize: 22,
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text)',
          wordBreak: 'break-all',
          flex: 1,
          lineHeight: 1.3,
        }}>
          {card.filename}
        </h2>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, paddingTop: 4 }}>
          <span className="badge" style={{ color: 'var(--accent)', borderColor: 'var(--accent-dim)' }}>
            {card.format.toUpperCase()}
          </span>
          <span className="badge">{formatBytes(card.sizeBytes)}</span>
        </div>
      </div>

      {/* Path display */}
      <div style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '10px 14px',
        fontSize: 13,
        lineHeight: 1.5,
      }}>
        <PathDisplay splitPoint={card.splitPoint} boldSegment={card.boldSegment} />
      </div>

      {/* Decision state indicator */}
      {card.decision && (
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          {isSkipped ? (
            <span style={{ color: 'var(--text-muted)' }}>⊘ skipped</span>
          ) : (
            <span style={{ color: 'var(--green)' }}>
              ✓ {options.find(o => o.id === card.decision)?.label ?? 'decided'}
            </span>
          )}
        </div>
      )}

      {/* Notes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Notes <span style={{ opacity: 0.5 }}>(N to focus)</span>
        </label>
        <textarea
          id="notes-field"
          ref={notesRef}
          value={localNotes}
          onChange={e => setLocalNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="optional notes..."
          rows={2}
          style={{
            resize: 'vertical',
            width: '100%',
          }}
        />
      </div>

      {/* Option buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {options.map((opt, i) => (
          <OptionButton
            key={opt.id}
            option={opt}
            index={i}
            isSelected={card.decision === opt.id}
            onClick={() => onDecide(opt.id, localNotes)}
          />
        ))}
        <button
          onClick={onSkip}
          style={{
            padding: '10px 18px',
            borderRadius: 'var(--radius)',
            border: `1px solid ${isSkipped ? 'var(--text-dim)' : 'var(--border)'}`,
            background: isSkipped ? 'var(--surface-3)' : 'transparent',
            color: isSkipped ? 'var(--text)' : 'var(--text-dim)',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
            transition: 'all 0.1s',
          }}
        >
          <span style={{ fontSize: 11, background: 'var(--surface-3)', borderRadius: 3, padding: '1px 5px' }}>S</span>
          Skip
        </button>
      </div>
    </div>
  );
}
