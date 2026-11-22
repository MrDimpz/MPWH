export type LadderMode = 'classic' | 'dual' | 'quad';

export type GameStatus = 'idle' | 'playing' | 'won' | 'gave_up';

export interface GuessEntry {
  word: string;
  order: number;
  isHint: boolean;
  guessedBy?: string;
  timestamp: number;
}

export interface TargetWinner {
  name: string;
  guessedAt: number;
  isFirst: boolean;
  word: string;
}

export interface LadderTargetView {
  index: number;
  solved: boolean;
  /** True while the 4-second stream-lag buffer is still accepting exact guesses from other players */
  bufferActive: boolean;
  bufferEndsAt: number | null;
  /** Revealed once the 4-second buffer closes (or if revealed/gave up) */
  word: string | null;
  revealedLength: number | null;
  /** Prefix revealed via Letter Clue hint */
  revealedPrefix: string | null;
  /** Longest common prefix shared by closestBefore and closestAfter — auto-filled into the word box */
  sharedPrefix: string;
  solvedAtGuess: number | null;
  winners: TargetWinner[];
  closestBefore: GuessEntry | null;
  closestAfter: GuessEntry | null;
  proximityPct: number;
}

export interface LadderInstanceView {
  boardIndex: number;
  label: string;
  targets: LadderTargetView[];
  solved: boolean;
  /** True only when all targets are solved AND their 4s lag buffers have finished */
  lockedSolved: boolean;
  guessCount: number;
  lastGuessWord: string | null;
}

export interface RoundWinnerSummary {
  name: string;
  wordsFound: string[];
  firstSolves: number;
  score: number;
  bananas: number;
}

export interface LiveGameStateView {
  roundId: string;
  roundNumber: number;
  mode: LadderMode;
  status: GameStatus;
  boards: LadderInstanceView[];
  totalGuesses: number;
  hintsRemaining: number;
  hintsUsed: number;
  startedAt: number | null;
  finishedAt: number | null;
  nextRoundAt: number | null;
  serverNow: number;
  roundWinners: RoundWinnerSummary[];
  recentActivity: Array<{
    id: string;
    text: string;
    timestamp: number;
    tone: 'neutral' | 'solve' | 'buffer' | 'hint' | 'system';
  }>;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  mode: LadderMode;
  score: number;
  bananas: number;
  guesses: number;
  hintsUsed: number;
  durationMs: number;
  wordsFound: number;
  createdAt: number;
}

export type WSClientMessage =
  | { type: 'hello'; playerName: string }
  | { type: 'set_name'; playerName: string }
  | { type: 'set_mode'; mode: LadderMode }
  | { type: 'start_game'; mode?: LadderMode }
  | { type: 'submit_guess'; word: string; playerName?: string; targetBoardIndex?: number | null }
  | { type: 'use_hint'; hintType: 'bracket' | 'clue'; boardIndex: number; targetIndex: number }
  | { type: 'reveal_game' };

export type WSServerMessage =
  | {
      type: 'welcome';
      clientId: string;
      onlineCount: number;
      game: LiveGameStateView;
      leaderboard: LeaderboardEntry[];
    }
  | { type: 'presence'; onlineCount: number }
  | { type: 'game_state'; game: LiveGameStateView }
  | { type: 'leaderboard_update'; leaderboard: LeaderboardEntry[]; latestEntry?: LeaderboardEntry }
  | {
      type: 'guess_result';
      accepted: boolean;
      word: string;
      reason?: string;
      matchedWords?: string[];
      wasLagBufferHit?: boolean;
    }
  | { type: 'error'; message: string };
