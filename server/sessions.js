import { readFile, writeFile, rename, readdir } from 'fs/promises';
import path from 'path';

const SESSIONS_DIR = 'triage-sessions';

function sessionFilePath(id) {
  return path.join(SESSIONS_DIR, `${id}.json`);
}

/**
 * Write session JSON atomically: write to .tmp then rename.
 * fs.rename is atomic on Linux when src/dst are on the same filesystem.
 */
async function writeSession(session) {
  const dest = sessionFilePath(session.id);
  const tmp = dest + '.tmp';
  await writeFile(tmp, JSON.stringify(session, null, 2), 'utf8');
  await rename(tmp, dest);
}

/**
 * Read a session by ID.
 * @returns {Promise<object>} the parsed session
 * @throws if not found
 */
export async function getSession(id) {
  const filePath = sessionFilePath(id);
  let raw;
  try {
    raw = await readFile(filePath, 'utf8');
  } catch {
    const err = new Error(`Session not found: ${id}`);
    err.status = 404;
    throw err;
  }
  return JSON.parse(raw);
}

/**
 * Create a new session and persist it to disk.
 */
export async function createSession(session) {
  await writeSession(session);
  return session;
}

/**
 * Update top-level session fields (everything except id, createdAt, cards).
 * Returns the updated session.
 */
export async function patchSession(id, patch) {
  const session = await getSession(id);
  const PROTECTED = new Set(['id', 'createdAt', 'cards']);
  for (const [key, value] of Object.entries(patch)) {
    if (!PROTECTED.has(key)) {
      session[key] = value;
    }
  }
  await writeSession(session);
  return session;
}

/**
 * Update a single card within a session.
 * Returns the updated card.
 */
export async function patchCard(sessionId, cardId, patch) {
  const session = await getSession(sessionId);
  const cardIndex = session.cards.findIndex(c => c.id === cardId);
  if (cardIndex === -1) {
    const err = new Error(`Card not found: ${cardId}`);
    err.status = 404;
    throw err;
  }
  const ALLOWED = new Set(['decision', 'notes', 'decidedAt']);
  for (const [key, value] of Object.entries(patch)) {
    if (ALLOWED.has(key)) {
      session.cards[cardIndex][key] = value;
    }
  }
  await writeSession(session);
  return session.cards[cardIndex];
}

/**
 * List all sessions with summary metadata (no cards array).
 */
export async function listSessions() {
  let files;
  try {
    files = await readdir(SESSIONS_DIR);
  } catch {
    return [];
  }

  const jsonFiles = files.filter(f => f.endsWith('.json'));

  const summaries = await Promise.all(
    jsonFiles.map(async (filename) => {
      try {
        const raw = await readFile(path.join(SESSIONS_DIR, filename), 'utf8');
        const session = JSON.parse(raw);
        const decidedCount = session.cards
          ? session.cards.filter(c => c.decision !== null && c.decision !== 'skip').length
          : 0;
        return {
          id: session.id,
          filename,
          label: session.label || '',
          sourceDir: session.sourceDir || '',
          createdAt: session.createdAt,
          cardCount: session.cards ? session.cards.length : 0,
          decidedCount,
        };
      } catch {
        return null;
      }
    })
  );

  return summaries
    .filter(Boolean)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
