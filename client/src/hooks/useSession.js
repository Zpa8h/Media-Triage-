import { useState, useEffect, useCallback } from 'react';
import { api } from '../api.js';

/**
 * Load and manage a session by ID.
 * Provides the session data plus mutation helpers that write to disk
 * immediately and update local state without a full re-fetch.
 */
export function useSession(sessionId) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    api.getSession(sessionId)
      .then((s) => { setSession(s); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [sessionId]);

  // Update label / options — returns updated session
  const updateSession = useCallback(async (patch) => {
    const updated = await api.patchSession(sessionId, patch);
    setSession(updated);
    return updated;
  }, [sessionId]);

  // Record a card decision — only updates the affected card in local state
  const decideCard = useCallback(async (cardId, decision, notes = '') => {
    const updatedCard = await api.decideCard(sessionId, cardId, decision, notes);
    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        cards: prev.cards.map(c => c.id === cardId ? updatedCard : c),
      };
    });
    return updatedCard;
  }, [sessionId]);

  return { session, loading, error, updateSession, decideCard };
}
