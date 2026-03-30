async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  scan(sourceDir) {
    return apiFetch('/api/scan', {
      method: 'POST',
      body: JSON.stringify({ sourceDir }),
    });
  },

  listSessions() {
    return apiFetch('/api/sessions');
  },

  getSession(id) {
    return apiFetch(`/api/sessions/${id}`);
  },

  patchSession(id, patch) {
    return apiFetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  decideCard(sessionId, cardId, decision, notes) {
    return apiFetch(`/api/sessions/${sessionId}/cards/${cardId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        decision,
        notes,
        decidedAt: decision !== null ? new Date().toISOString() : null,
      }),
    });
  },

  exportSession(id, includeSkipped = false) {
    return apiFetch(`/api/sessions/${id}/export`, {
      method: 'POST',
      body: JSON.stringify({ includeSkipped }),
    });
  },
};
