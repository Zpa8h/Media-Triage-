import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from '../hooks/useSession.js';
import Card from '../components/Card.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import FilterBar from '../components/FilterBar.jsx';

function filterCards(cards, filter) {
  switch (filter) {
    case 'undecided': return cards.filter(c => c.decision === null);
    case 'skipped':   return cards.filter(c => c.decision === 'skip');
    case 'decided':   return cards.filter(c => c.decision !== null && c.decision !== 'skip');
    default:          return cards;
  }
}

function getFilterCounts(cards) {
  return {
    all:       cards.length,
    undecided: cards.filter(c => c.decision === null).length,
    skipped:   cards.filter(c => c.decision === 'skip').length,
    decided:   cards.filter(c => c.decision !== null && c.decision !== 'skip').length,
  };
}

export default function Triage({ sessionId, onExport }) {
  const { session, loading, error, decideCard } = useSession(sessionId);
  const [filter, setFilter] = useState('all');
  const [visibleIndex, setVisibleIndex] = useState(0);
  const notesRef = useRef(null);

  // When filter changes, reset to first card in that view
  const prevFilter = useRef(filter);
  useEffect(() => {
    if (prevFilter.current !== filter) {
      setVisibleIndex(0);
      prevFilter.current = filter;
    }
  }, [filter]);

  // On first load, jump to first undecided card in 'all' view
  const initialJump = useRef(false);
  useEffect(() => {
    if (!session || initialJump.current) return;
    initialJump.current = true;
    const firstUndecided = session.cards.findIndex(c => c.decision === null);
    if (firstUndecided > 0) setVisibleIndex(firstUndecided);
  }, [session]);

  const handleDecide = useCallback(async (decision, notes) => {
    const cards = session?.cards;
    if (!cards) return;
    const filtered = filterCards(cards, filter);
    const card = filtered[visibleIndex];
    if (!card) return;
    await decideCard(card.id, decision, notes);
    // Auto-advance to next card if it wasn't already decided
    if (card.decision === null || card.decision === 'skip') {
      setVisibleIndex(i => Math.min(i + 1, filtered.length - 1));
    }
  }, [session, filter, visibleIndex, decideCard]);

  const handleSkip = useCallback(async () => {
    const cards = session?.cards;
    if (!cards) return;
    const filtered = filterCards(cards, filter);
    const card = filtered[visibleIndex];
    if (!card) return;
    await decideCard(card.id, 'skip', card.notes || '');
    setVisibleIndex(i => Math.min(i + 1, filtered.length - 1));
  }, [session, filter, visibleIndex, decideCard]);

  // Keyboard navigation
  useEffect(() => {
    if (!session) return;

    function onKeyDown(e) {
      // Don't intercept keys while textarea is focused
      if (document.activeElement?.tagName === 'TEXTAREA') {
        // Allow Escape to blur textarea
        if (e.key === 'Escape') document.activeElement.blur();
        return;
      }
      if (document.activeElement?.tagName === 'INPUT') return;

      const filtered = filterCards(session.cards, filter);
      const total = filtered.length;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          setVisibleIndex(i => Math.min(i + 1, total - 1));
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          setVisibleIndex(i => Math.max(i - 1, 0));
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          notesRef.current?.focus();
          break;
        case 's':
        case 'S':
          e.preventDefault();
          handleSkip();
          break;
        default: {
          const num = parseInt(e.key, 10);
          if (num >= 1 && num <= (session.options?.length ?? 0)) {
            e.preventDefault();
            const opt = session.options[num - 1];
            const card = filtered[visibleIndex];
            if (card) handleDecide(opt.id, card.notes || '');
          }
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [session, filter, visibleIndex, handleDecide, handleSkip]);

  if (loading) return (
    <div>
      <div style={{ height: 40, background: 'var(--surface)', borderBottom: '1px solid var(--border)' }} />
      <div className="page" style={{ paddingTop: 40, color: 'var(--text-dim)' }}>Loading session…</div>
    </div>
  );
  if (error) return <div className="page" style={{ paddingTop: 40, color: 'var(--red)' }}>{error}</div>;
  if (!session) return null;

  const allCards = session.cards || [];
  const filtered = filterCards(allCards, filter);
  const counts = getFilterCounts(allCards);
  const card = filtered[visibleIndex];

  const clampedIndex = Math.min(visibleIndex, Math.max(filtered.length - 1, 0));
  if (clampedIndex !== visibleIndex) setVisibleIndex(clampedIndex);

  const hasOptions = session.options && session.options.length >= 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <ProgressBar cards={allCards} currentIndex={visibleIndex} />

      <div className="page" style={{ paddingTop: 24 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <FilterBar active={filter} counts={counts} onChange={setFilter} />
          <button
            className="btn btn-ghost"
            onClick={onExport}
            style={{ fontSize: 12 }}
          >
            Export →
          </button>
        </div>

        {/* Keyboard hint */}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.8 }}>
          <span style={{ marginRight: 16 }}>← → navigate</span>
          <span style={{ marginRight: 16 }}>1–{session.options?.length ?? 0} decide</span>
          <span style={{ marginRight: 16 }}>S skip</span>
          <span>N notes</span>
        </div>

        {!hasOptions && (
          <div style={{
            background: 'rgba(245,166,35,0.08)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)',
            padding: '12px 16px',
            color: 'var(--accent)',
            fontSize: 13,
            marginBottom: 20,
          }}>
            No options configured yet. <a href="#" onClick={e => { e.preventDefault(); window.history.back(); }}>Go back to Configure</a> to add destination buckets.
          </div>
        )}

        {filtered.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', fontSize: 13, paddingTop: 20 }}>
            No cards in this filter. {filter !== 'all' && (
              <button
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 13 }}
                onClick={() => setFilter('all')}
              >
                Show all
              </button>
            )}
          </div>
        ) : card ? (
          <>
            {/* Navigation arrows + card index */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <button
                className="btn btn-ghost"
                onClick={() => setVisibleIndex(i => Math.max(i - 1, 0))}
                disabled={visibleIndex === 0}
                style={{ padding: '6px 12px', fontSize: 14 }}
              >
                ← Prev
              </button>
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                {visibleIndex + 1} / {filtered.length}
              </span>
              <button
                className="btn btn-ghost"
                onClick={() => setVisibleIndex(i => Math.min(i + 1, filtered.length - 1))}
                disabled={visibleIndex === filtered.length - 1}
                style={{ padding: '6px 12px', fontSize: 14 }}
              >
                Next →
              </button>
            </div>

            <Card
              card={card}
              options={session.options || []}
              onDecide={(decision, notes) => handleDecide(decision, notes)}
              onSkip={handleSkip}
              notesRef={notesRef}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
