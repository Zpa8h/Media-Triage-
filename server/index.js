import express from 'express';
import { mkdirSync } from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

import { scanDirectory } from './scanner.js';
import {
  createSession,
  getSession,
  patchSession,
  patchCard,
  listSessions,
} from './sessions.js';
import { generateExportScript } from './export.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SESSIONS_DIR = path.join(ROOT, 'triage-sessions');
const DIST_DIR = path.join(ROOT, 'dist');

// Ensure triage-sessions/ directory exists before any request
mkdirSync(SESSIONS_DIR, { recursive: true });

const app = express();
app.use(express.json());

// -----------------------------------------------------------------------
// API Routes
// -----------------------------------------------------------------------

// POST /api/scan  — scan a directory and create a new session
app.post('/api/scan', async (req, res) => {
  const { sourceDir } = req.body;
  if (!sourceDir || typeof sourceDir !== 'string') {
    return res.status(400).json({ error: 'sourceDir is required' });
  }

  let cards;
  try {
    cards = await scanDirectory(sourceDir);
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') {
      return res.status(400).json({ error: `Directory not found: ${sourceDir}` });
    }
    return res.status(500).json({ error: err.message });
  }

  const session = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    sourceDir,
    label: '',
    options: [],
    cards,
  };

  await createSession(session);

  res.status(201).json({
    sessionId: session.id,
    cardCount: cards.length,
  });
});

// GET /api/sessions  — list all sessions
app.get('/api/sessions', async (_req, res) => {
  const sessions = await listSessions();
  res.json(sessions);
});

// GET /api/sessions/:id  — load a full session
app.get('/api/sessions/:id', async (req, res) => {
  try {
    const session = await getSession(req.params.id);
    res.json(session);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// PATCH /api/sessions/:id  — update label / options
app.patch('/api/sessions/:id', async (req, res) => {
  try {
    const session = await patchSession(req.params.id, req.body);
    res.json(session);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// PATCH /api/sessions/:id/cards/:cardId  — record a card decision
app.patch('/api/sessions/:id/cards/:cardId', async (req, res) => {
  try {
    const card = await patchCard(req.params.id, req.params.cardId, req.body);
    res.json(card);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/sessions/:id/export  — generate shell script
app.post('/api/sessions/:id/export', async (req, res) => {
  try {
    const session = await getSession(req.params.id);
    const { includeSkipped = false } = req.body;
    const result = await generateExportScript(session, includeSkipped);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------
// Static file serving (production build)
// -----------------------------------------------------------------------
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(DIST_DIR));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// -----------------------------------------------------------------------
// Start
// -----------------------------------------------------------------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'dev';
  // Find the LAN IP so the user knows where to point their browser
  const lanIP = Object.values(os.networkInterfaces())
    .flat()
    .find(i => i.family === 'IPv4' && !i.internal)?.address ?? 'localhost';
  console.log(`[media-triage] server → http://${lanIP}:${PORT} (${env})`);
  if (env !== 'production') {
    console.log(`[media-triage] UI      → http://${lanIP}:5173`);
  }
});
