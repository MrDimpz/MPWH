import fs from 'node:fs';
import path from 'node:path';
import type { LadderMode, LeaderboardEntry } from '../src/types/game.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');
const MAX_ENTRIES = 500;

let entries: LeaderboardEntry[] = [];

function ensureLoaded(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(LEADERBOARD_FILE)) {
      const raw = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        entries = parsed
          .filter(
            (e): e is Record<string, unknown> =>
              Boolean(e) &&
              typeof e.id === 'string' &&
              typeof e.playerName === 'string' &&
              typeof e.score === 'number'
          )
          .map((e) => ({
            id: e.id as string,
            playerName: e.playerName as string,
            mode:
              e.mode === 'dual' || e.mode === 'quad' ? (e.mode as LadderMode) : 'classic',
            score: e.score as number,
            bananas: typeof e.bananas === 'number' ? e.bananas : Math.max(5, Math.round((e.score as number) / 45)),
            guesses: typeof e.guesses === 'number' ? e.guesses : 1,
            hintsUsed: typeof e.hintsUsed === 'number' ? e.hintsUsed : 0,
            durationMs: typeof e.durationMs === 'number' ? e.durationMs : 0,
            wordsFound: typeof e.wordsFound === 'number' ? e.wordsFound : 1,
            createdAt: typeof e.createdAt === 'number' ? e.createdAt : Date.now(),
          }));
      }
    }
  } catch {
    entries = [];
  }
}

function persist(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${LEADERBOARD_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(entries, null, 2), 'utf8');
    fs.renameSync(tmpFile, LEADERBOARD_FILE);
  } catch (err) {
    console.error('Failed to persist leaderboard:', err);
  }
}

ensureLoaded();

function sortEntries(list: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...list].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.wordsFound !== a.wordsFound) return b.wordsFound - a.wordsFound;
    if (a.guesses !== b.guesses) return a.guesses - b.guesses;
    if (a.durationMs !== b.durationMs) return a.durationMs - b.durationMs;
    return b.createdAt - a.createdAt;
  });
}

export function addLeaderboardEntry(entry: LeaderboardEntry): LeaderboardEntry[] {
  if (entries.some((e) => e.id === entry.id)) {
    return getLeaderboard('all', 50);
  }
  entries = sortEntries([entry, ...entries]).slice(0, MAX_ENTRIES);
  persist();
  return getLeaderboard('all', 50);
}

export function getLeaderboard(
  filter: 'all' | LadderMode = 'all',
  limit = 50
): LeaderboardEntry[] {
  const safeLimit = Math.max(1, Math.min(100, limit));
  const filtered = entries.filter((e) => {
    if (filter === 'all') return true;
    return e.mode === filter;
  });
  return sortEntries(filtered).slice(0, safeLimit);
}
