import express from 'express';
import http from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import type {
  LadderMode,
  LeaderboardEntry,
  LiveGameStateView,
  RoundWinnerSummary,
  WSClientMessage,
  WSServerMessage,
} from './src/types/game.ts';
import { pickTargetWords, getDictionarySize } from './server/dictionary.ts';
import {
  STREAM_LAG_BUFFER_MS,
  applyGuess,
  applyHint,
  calculateWinnerScore,
  checkAndFinalizeRound,
  createLadderSet,
  toBoardView,
  type InternalLadderSet,
} from './server/gameEngine.ts';
import { addLeaderboardEntry, getLeaderboard } from './server/leaderboardStore.ts';

interface ClientSession {
  id: string;
  ws: WebSocket;
  playerName: string;
}

interface ActivityItem {
  id: string;
  text: string;
  timestamp: number;
  tone: 'neutral' | 'solve' | 'buffer' | 'hint' | 'system';
}

const NEXT_ROUND_DELAY_MS = 15000;

interface LiveGameState {
  roundId: string;
  roundNumber: number;
  mode: LadderMode;
  ladderSet: InternalLadderSet | null;
  roundWinners: RoundWinnerSummary[];
  recentActivity: ActivityItem[];
  nextRoundAt: number | null;
  activeTimers: Set<ReturnType<typeof setTimeout>>;
}

const clients = new Map<string, ClientSession>();

const liveState: LiveGameState = {
  roundId: crypto.randomUUID(),
  roundNumber: 0,
  mode: 'classic',
  ladderSet: null,
  roundWinners: [],
  recentActivity: [],
  nextRoundAt: null,
  activeTimers: new Set(),
};

function sanitizeName(raw: unknown): string {
  if (typeof raw !== 'string') return 'Viewer';
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-. @]/g, '').trim().slice(0, 22);
  return cleaned || 'Viewer';
}

function isValidMode(mode: unknown): mode is LadderMode {
  return mode === 'classic' || mode === 'dual' || mode === 'quad';
}

function sendWS(ws: WebSocket, payload: WSServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastAll(payload: WSServerMessage): void {
  const encoded = JSON.stringify(payload);
  for (const c of clients.values()) {
    if (c.ws.readyState === WebSocket.OPEN) {
      c.ws.send(encoded);
    }
  }
}

function pushActivity(text: string, tone: ActivityItem['tone'] = 'neutral'): void {
  liveState.recentActivity.unshift({
    id: crypto.randomUUID(),
    text,
    timestamp: Date.now(),
    tone,
  });
  if (liveState.recentActivity.length > 24) {
    liveState.recentActivity.length = 24;
  }
}

function clearAllRoundTimers(): void {
  for (const timer of liveState.activeTimers) {
    clearTimeout(timer);
  }
  liveState.activeTimers.clear();
  liveState.nextRoundAt = null;
}

function serializeLiveGame(now = Date.now()): LiveGameStateView {
  const set = liveState.ladderSet;
  if (!set) {
    return {
      roundId: liveState.roundId,
      roundNumber: liveState.roundNumber,
      mode: liveState.mode,
      status: 'idle',
      boards: [],
      totalGuesses: 0,
      hintsRemaining: 0,
      hintsUsed: 0,
      startedAt: null,
      finishedAt: null,
      nextRoundAt: null,
      serverNow: now,
      roundWinners: [],
      recentActivity: liveState.recentActivity.slice(0, 14),
    };
  }

  const revealAll = set.status === 'gave_up';
  return {
    roundId: liveState.roundId,
    roundNumber: liveState.roundNumber,
    mode: set.mode,
    status: set.status,
    boards: set.boards.map((b) => toBoardView(b, revealAll, now)),
    totalGuesses: set.totalGuesses,
    hintsRemaining: set.hintsRemaining,
    hintsUsed: set.hintsUsed,
    startedAt: set.startedAt,
    finishedAt: set.finishedAt,
    nextRoundAt: liveState.nextRoundAt,
    serverNow: now,
    roundWinners: liveState.roundWinners,
    recentActivity: liveState.recentActivity.slice(0, 14),
  };
}

function broadcastGameState(): void {
  broadcastAll({ type: 'game_state', game: serializeLiveGame() });
}

function computeAndRecordRoundWinners(set: InternalLadderSet, now: number): void {
  const byPlayer = new Map<
    string,
    { displayName: string; wordsFound: Set<string>; firstSolves: number }
  >();

  for (const board of set.boards) {
    for (const target of board.targets) {
      for (const winner of target.winners) {
        const key = winner.name.trim().toLowerCase();
        const existing = byPlayer.get(key);
        if (existing) {
          existing.wordsFound.add(target.word);
          if (winner.isFirst) existing.firstSolves += 1;
        } else {
          byPlayer.set(key, {
            displayName: winner.name,
            wordsFound: new Set([target.word]),
            firstSolves: winner.isFirst ? 1 : 0,
          });
        }
      }
    }
  }

  const durationMs = Math.max(1000, now - set.startedAt);
  const summaries: RoundWinnerSummary[] = [];
  let latestEntry: LeaderboardEntry | undefined;

  for (const record of byPlayer.values()) {
    const wordsArray = Array.from(record.wordsFound);
    const { score, bananas } = calculateWinnerScore(
      set.mode,
      set.totalGuesses,
      set.hintsUsed,
      durationMs,
      wordsArray.length,
      record.firstSolves
    );

    summaries.push({
      name: record.displayName,
      wordsFound: wordsArray,
      firstSolves: record.firstSolves,
      score,
      bananas,
    });

    const entry: LeaderboardEntry = {
      id: crypto.randomUUID(),
      playerName: record.displayName,
      mode: set.mode,
      score,
      bananas,
      guesses: set.totalGuesses,
      hintsUsed: set.hintsUsed,
      durationMs,
      wordsFound: wordsArray.length,
      createdAt: now,
    };
    addLeaderboardEntry(entry);
    latestEntry = entry;
  }

  summaries.sort((a, b) => {
    if (b.wordsFound.length !== a.wordsFound.length) {
      return b.wordsFound.length - a.wordsFound.length;
    }
    if (b.firstSolves !== a.firstSolves) {
      return b.firstSolves - a.firstSolves;
    }
    return b.score - a.score;
  });

  liveState.roundWinners = summaries;

  const winnerNames = summaries.map((w) => w.name).join(', ');
  pushActivity(
    summaries.length > 1
      ? `All words locked! Winners: ${winnerNames}`
      : `All words locked! Winner: ${winnerNames || 'Players'}`,
    'solve'
  );

  broadcastAll({
    type: 'leaderboard_update',
    leaderboard: getLeaderboard('all', 50),
    latestEntry,
  });
}

function scheduleAutoNextRound(completedRoundId: string): void {
  liveState.nextRoundAt = Date.now() + NEXT_ROUND_DELAY_MS;
  const timer = setTimeout(() => {
    liveState.activeTimers.delete(timer);
    if (liveState.roundId !== completedRoundId) return;
    if (liveState.ladderSet?.status !== 'won') return;
    startLiveRound(liveState.mode);
  }, NEXT_ROUND_DELAY_MS);
  liveState.activeTimers.add(timer);
}

function scheduleBufferExpiry(roundId: string, solvedWords: string[], delayMs: number): void {
  const timer = setTimeout(() => {
    liveState.activeTimers.delete(timer);
    if (liveState.roundId !== roundId || !liveState.ladderSet) return;
    if (liveState.ladderSet.status !== 'playing') return;

    const now = Date.now();
    const upperWords = solvedWords.map((w) => w.toUpperCase()).join(', ');
    pushActivity(`4s buffer closed — revealed ${upperWords}!`, 'solve');

    const finalized = checkAndFinalizeRound(liveState.ladderSet, now);
    if (finalized) {
      computeAndRecordRoundWinners(liveState.ladderSet, now);
      scheduleAutoNextRound(roundId);
    }

    broadcastGameState();
  }, delayMs);

  liveState.activeTimers.add(timer);
}

function startLiveRound(mode?: LadderMode): LiveGameStateView {
  clearAllRoundTimers();
  if (mode && isValidMode(mode)) {
    liveState.mode = mode;
  }

  const secretWords = pickTargetWords(liveState.mode, null);
  liveState.roundId = crypto.randomUUID();
  liveState.roundNumber += 1;
  liveState.ladderSet = createLadderSet(liveState.mode, secretWords);
  liveState.roundWinners = [];
  liveState.recentActivity = [];

  const modeLabel =
    liveState.mode === 'classic'
      ? 'Classic (1 Word)'
      : liveState.mode === 'dual'
      ? 'Dual Ladder (2 Words)'
      : 'Quad Hunt (4 Boards)';

  pushActivity(`Round #${liveState.roundNumber} started — ${modeLabel}. Type a word!`, 'system');
  broadcastGameState();
  return serializeLiveGame();
}

function handleLiveGuess(
  rawWord: string,
  playerName: string,
  targetBoardIndex?: number | null
) {
  if (!liveState.ladderSet || liveState.ladderSet.status !== 'playing') {
    return {
      accepted: false,
      word: '',
      reason: 'Press Start Game to begin a round.',
      matchedWords: [] as string[],
      wasLagBufferHit: false,
    };
  }

  const cleanName = sanitizeName(playerName);
  const result = applyGuess(liveState.ladderSet, rawWord, cleanName, targetBoardIndex);

  if (!result.accepted) {
    return {
      accepted: false,
      word: result.word,
      reason: result.reason,
      matchedWords: [] as string[],
      wasLagBufferHit: false,
    };
  }

  if (result.firstSolvedWords.length > 0) {
    const countLabel =
      result.firstSolvedWords.length > 1
        ? `${result.firstSolvedWords.length} secret words`
        : 'a secret word';
    pushActivity(
      `${cleanName} found ${countLabel}! 4s stream-lag buffer open...`,
      'buffer'
    );
    const delayMs = result.newBufferEndsAt
      ? Math.max(100, result.newBufferEndsAt - Date.now() + 40)
      : STREAM_LAG_BUFFER_MS + 40;
    scheduleBufferExpiry(liveState.roundId, result.firstSolvedWords, delayMs);
    broadcastGameState();

    return {
      accepted: true,
      word: result.word,
      matchedWords: result.firstSolvedWords,
      wasLagBufferHit: false,
    };
  }

  if (result.bufferMatchedWords.length > 0) {
    pushActivity(`${cleanName} also got it during the 4s lag buffer!`, 'solve');
    broadcastGameState();
    return {
      accepted: true,
      word: result.word,
      matchedWords: result.bufferMatchedWords,
      wasLagBufferHit: true,
    };
  }

  pushActivity(`${cleanName} guessed ${result.word.toUpperCase()}`, 'neutral');
  broadcastGameState();

  return {
    accepted: true,
    word: result.word,
    matchedWords: [] as string[],
    wasLagBufferHit: false,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      dictionarySize: getDictionarySize(),
      onlinePlayers: clients.size,
      status: liveState.ladderSet?.status ?? 'idle',
      roundNumber: liveState.roundNumber,
    });
  });

  app.get('/api/game', (_req, res) => {
    res.json({ game: serializeLiveGame() });
  });

  app.post('/api/game/start', (req, res) => {
    const requestedMode = req.body?.mode;
    const mode = isValidMode(requestedMode) ? requestedMode : liveState.mode;
    const game = startLiveRound(mode);
    res.json({ game });
  });

  // External stream bridge endpoint (e.g. TikTok Live chat connectors)
  app.post('/api/stream/guess', (req, res) => {
    const word = typeof req.body?.word === 'string' ? req.body.word : '';
    const username = sanitizeName(req.body?.username ?? req.body?.playerName ?? 'Viewer');
    const targetBoardIndex =
      typeof req.body?.targetBoardIndex === 'number' ? req.body.targetBoardIndex : null;

    const outcome = handleLiveGuess(word, username, targetBoardIndex);
    res.json({ ...outcome, game: serializeLiveGame() });
  });

  app.get('/api/leaderboard', (req, res) => {
    const rawFilter = typeof req.query.mode === 'string' ? req.query.mode : 'all';
    const filter: 'all' | LadderMode = isValidMode(rawFilter) ? rawFilter : 'all';
    const limit = Number(req.query.limit ?? 50);
    res.json({ entries: getLeaderboard(filter, Number.isFinite(limit) ? limit : 50) });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(
      request.url ?? '/',
      `http://${request.headers.host ?? 'localhost'}`
    ).pathname;
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws) => {
    const clientId = crypto.randomUUID();
    const session: ClientSession = {
      id: clientId,
      ws,
      playerName: `Viewer-${Math.floor(100 + Math.random() * 900)}`,
    };
    clients.set(clientId, session);

    sendWS(ws, {
      type: 'welcome',
      clientId,
      onlineCount: clients.size,
      game: serializeLiveGame(),
      leaderboard: getLeaderboard('all', 50),
    });

    broadcastAll({ type: 'presence', onlineCount: clients.size });

    ws.on('message', (raw) => {
      let msg: WSClientMessage;
      try {
        msg = JSON.parse(raw.toString('utf8'));
      } catch {
        return;
      }

      switch (msg.type) {
        case 'hello':
        case 'set_name': {
          session.playerName = sanitizeName(msg.playerName);
          break;
        }

        case 'set_mode': {
          if (!isValidMode(msg.mode)) return;
          liveState.mode = msg.mode;
          if (!liveState.ladderSet || liveState.ladderSet.status === 'idle') {
            broadcastGameState();
          } else {
            startLiveRound(msg.mode);
          }
          break;
        }

        case 'start_game': {
          startLiveRound(msg.mode);
          break;
        }

        case 'submit_guess': {
          const guesserName =
            typeof msg.playerName === 'string' && msg.playerName.trim()
              ? sanitizeName(msg.playerName)
              : session.playerName;
          const outcome = handleLiveGuess(msg.word, guesserName, msg.targetBoardIndex ?? null);
          sendWS(ws, {
            type: 'guess_result',
            accepted: outcome.accepted,
            word: outcome.word,
            reason: outcome.reason,
            matchedWords: outcome.matchedWords,
            wasLagBufferHit: outcome.wasLagBufferHit,
          });
          break;
        }

        case 'use_hint': {
          if (!liveState.ladderSet || liveState.ladderSet.status !== 'playing') {
            sendWS(ws, { type: 'error', message: 'Start a game first to use hints.' });
            return;
          }
          const res = applyHint(
            liveState.ladderSet,
            msg.hintType,
            msg.boardIndex,
            msg.targetIndex,
            session.playerName
          );
          if (!res.accepted) {
            sendWS(ws, { type: 'error', message: res.reason ?? 'Hint unavailable.' });
            return;
          }
          if (res.hintWord) {
            pushActivity(`Hint placed ${res.hintWord.toUpperCase()}`, 'hint');
          } else if (res.clueText) {
            pushActivity(`Letter clue revealed: ${res.clueText}`, 'hint');
          }
          broadcastGameState();
          break;
        }

        case 'reveal_game': {
          if (!liveState.ladderSet || liveState.ladderSet.status !== 'playing') return;
          clearAllRoundTimers();
          liveState.ladderSet.status = 'gave_up';
          liveState.ladderSet.finishedAt = Date.now();
          pushActivity('Round revealed by host.', 'system');
          broadcastGameState();
          break;
        }
      }
    });

    ws.on('close', () => {
      clients.delete(clientId);
      broadcastAll({ type: 'presence', onlineCount: clients.size });
    });
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server },
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT ?? 3000);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(
      `Word Hunt TikTok Live server running on http://0.0.0.0:${PORT} (${getDictionarySize()} words loaded)`
    );
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
