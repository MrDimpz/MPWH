import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Eye,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type {
  LadderMode,
  LeaderboardEntry,
  LiveGameStateView,
  WSClientMessage,
} from '../types/game';
import type { GuessFeedback } from '../hooks/useWebSocket';
import { LadderBoard } from './LadderBoard';
import { GuessInputBar } from './GuessInputBar';
import { WinnerModal } from './WinnerModal';
import { formatDuration, formatModeLabel } from '../utils/format';
import { soundFX } from '../utils/sound';

interface LiveGameViewProps {
  game: LiveGameStateView | null;
  clockOffsetMs: number;
  playerName: string;
  leaderboard: LeaderboardEntry[];
  wsError: string | null;
  onClearError: () => void;
  lastGuessFeedback: GuessFeedback | null;
  onSend: (msg: WSClientMessage) => boolean;
  onOpenLeaderboard: () => void;
}

const MODE_OPTIONS: Array<{
  id: LadderMode;
  label: string;
  shortLabel: string;
  desc: string;
}> = [
  {
    id: 'classic',
    label: 'Classic · 1 Word',
    shortLabel: 'Classic',
    desc: 'One secret 4–8 letter word on a single A→Z ladder.',
  },
  {
    id: 'dual',
    label: 'Dual Ladder · 2 Words',
    shortLabel: 'Dual (2)',
    desc: 'Two secret words hidden inside the same alphabetical ladder.',
  },
  {
    id: 'quad',
    label: 'Quad Hunt · 4 Boards',
    shortLabel: 'Quad (4)',
    desc: 'Four separate ladders running simultaneously on one screen.',
  },
];

export function LiveGameView({
  game,
  clockOffsetMs,
  playerName,
  leaderboard,
  wsError,
  onClearError,
  lastGuessFeedback,
  onSend,
  onOpenLeaderboard,
}: LiveGameViewProps) {
  const [selectedMode, setSelectedMode] = useState<LadderMode>(game?.mode ?? 'classic');
  const [selectedBoardIndex, setSelectedBoardIndex] = useState<number | null>(null);
  const [muted, setMuted] = useState(() => soundFX.isMuted());
  const [elapsedMs, setElapsedMs] = useState(0);
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);

  const celebratedRoundRef = useRef<string | null>(null);
  const lastFeedbackIdRef = useRef<number>(0);

  useEffect(() => {
    if (game?.mode) {
      setSelectedMode(game.mode);
    }
  }, [game?.mode]);

  // Reset selected board if switching rounds or mode
  useEffect(() => {
    setSelectedBoardIndex(null);
  }, [game?.roundId, game?.mode]);

  // Live round elapsed clock
  useEffect(() => {
    if (!game || game.status !== 'playing' || !game.startedAt) {
      if (game?.startedAt && game?.finishedAt) {
        setElapsedMs(Math.max(0, game.finishedAt - game.startedAt));
      } else {
        setElapsedMs(0);
      }
      return;
    }
    const tick = () => {
      const serverNow = Date.now() + clockOffsetMs;
      setElapsedMs(Math.max(0, serverNow - (game.startedAt ?? serverNow)));
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [game?.status, game?.startedAt, game?.finishedAt, clockOffsetMs]);

  // Sound feedback for local guesses
  useEffect(() => {
    if (!lastGuessFeedback || lastGuessFeedback.id === lastFeedbackIdRef.current) return;
    lastFeedbackIdRef.current = lastGuessFeedback.id;
    if (!lastGuessFeedback.accepted) {
      soundFX.playInvalid();
    } else if (
      lastGuessFeedback.matchedWords &&
      lastGuessFeedback.matchedWords.length > 0
    ) {
      soundFX.playWordSolved();
    } else {
      soundFX.playPlace();
    }
  }, [lastGuessFeedback]);

  // Open WinnerModal + confetti when round transitions to 'won'
  useEffect(() => {
    if (!game) return;
    if (game.status === 'won' && celebratedRoundRef.current !== game.roundId) {
      celebratedRoundRef.current = game.roundId;
      setWinnerModalOpen(true);
      soundFX.playVictory();
      confetti({
        particleCount: 90,
        spread: 72,
        origin: { y: 0.55 },
        colors: ['#F5B82E', '#34D399', '#F4F1EA', '#FBBF24'],
      });
    } else if (game.status !== 'won') {
      setWinnerModalOpen(false);
    }
  }, [game?.status, game?.roundId]);

  const handleStartGame = (modeOverride?: LadderMode) => {
    const modeToUse = modeOverride ?? selectedMode;
    onClearError();
    setWinnerModalOpen(false);
    onSend({ type: 'start_game', mode: modeToUse });
  };

  const handleModeSwitch = (mode: LadderMode) => {
    setSelectedMode(mode);
    onClearError();
    onSend({ type: 'set_mode', mode });
  };

  const handleSubmitGuess = (word: string, targetBoardIndex: number | null) => {
    onSend({
      type: 'submit_guess',
      word,
      playerName,
      targetBoardIndex,
    });
  };

  const handleUseHint = (
    hintType: 'bracket' | 'clue',
    boardIndex: number,
    targetIndex: number
  ) => {
    soundFX.playHint();
    onSend({
      type: 'use_hint',
      hintType,
      boardIndex,
      targetIndex,
    });
  };

  const handleReveal = () => {
    onSend({ type: 'reveal_game' });
  };

  const handleToggleMute = () => {
    const next = !soundFX.isMuted();
    soundFX.setMuted(next);
    setMuted(next);
  };

  // IDLE START SCREEN — clean single Start Game button for TikTok Live
  if (!game || game.status === 'idle') {
    return (
      <div className="mx-auto max-w-3xl py-6 sm:py-10 space-y-8">
        <section className="rounded-2xl border border-white/10 bg-[#16201C] p-6 sm:p-10 text-center space-y-7">
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F5B82E]">
              TikTok Interactive Live
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-[#F4F1EA] text-balance">
              Word Hunt - Extreme Edition
            </h1>
            <p className="mx-auto max-w-xl text-sm sm:text-base text-[#A7B5AE]">
              Pinch the secret word between the closest alphabetical guesses above and below. Shared starting letters auto-fill right into the word box.
            </p>
          </div>

          {/* Mode Selection */}
          <div className="grid gap-3 sm:grid-cols-3 text-left">
            {MODE_OPTIONS.map((opt) => {
              const active = selectedMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleModeSwitch(opt.id)}
                  className={`rounded-xl border p-4 transition-all cursor-pointer ${
                    active
                      ? 'border-[#F5B82E] bg-[#F5B82E]/12 shadow-[0_0_0_1px_rgba(245,184,46,0.25)]'
                      : 'border-white/10 bg-[#121A17] hover:border-white/25'
                  }`}
                >
                  <div
                    className={`font-display text-sm font-extrabold ${
                      active ? 'text-[#F5B82E]' : 'text-[#F4F1EA]'
                    }`}
                  >
                    {opt.label}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[#9CA9A2]">
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Single Prominent Start Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleStartGame(selectedMode)}
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#F5B82E] px-10 py-4 font-display text-lg font-extrabold text-[#0F1613] shadow-lg shadow-[#F5B82E]/15 hover:bg-[#F7C652] active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B82E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#16201C]"
            >
              <Play className="h-5 w-5 fill-current" aria-hidden="true" />
              <span>Start Game</span>
            </button>
          </div>

          {/* Compact Key Rules Strip */}
          <div className="grid gap-3 pt-4 border-t border-white/8 sm:grid-cols-3 text-xs text-[#9CA9A2]">
            <div className="rounded-lg bg-[#111916] px-3.5 py-2.5">
              <span className="font-semibold text-[#F4F1EA]">Closest Bracket Only</span>
              <p className="mt-0.5">Shows only the nearest word above and below.</p>
            </div>
            <div className="rounded-lg bg-[#111916] px-3.5 py-2.5">
              <span className="font-semibold text-[#F4F1EA]">Shared Letters Auto-Fill</span>
              <p className="mt-0.5">Matching starting letters fill straight into the box.</p>
            </div>
            <div className="rounded-lg bg-[#111916] px-3.5 py-2.5">
              <span className="font-semibold text-[#F4F1EA]">4-Second Lag Buffer</span>
              <p className="mt-0.5">Lagged viewers still win credit for 4s after a find.</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const isQuad = game.mode === 'quad';
  const isPlaying = game.status === 'playing';
  const isGaveUp = game.status === 'gave_up';
  const solvedTargetsCount = game.boards.reduce(
    (sum, b) => sum + b.targets.filter((t) => t.solved).length,
    0
  );
  const totalTargetsCount = game.boards.reduce((sum, b) => sum + b.targets.length, 0);
  const topLeaders = leaderboard.slice(0, 6);

  return (
    <div className="space-y-5">
      {/* Compact Stream Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#16201C] px-4 py-3">
        {/* Left: Mode Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#101815] p-1">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleModeSwitch(opt.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  game.mode === opt.id
                    ? 'bg-[#F5B82E] text-[#0F1613]'
                    : 'text-[#A7B5AE] hover:text-[#F4F1EA]'
                }`}
              >
                {opt.shortLabel}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-[#9CA9A2] font-mono tabular-nums">
            <span>
              Round <strong className="text-[#F4F1EA]">#{game.roundNumber}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Words{' '}
              <strong className="text-emerald-400">
                {solvedTargetsCount}/{totalTargetsCount}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Guesses <strong className="text-[#F4F1EA]">{game.totalGuesses}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Hints <strong className="text-[#F5B82E]">{game.hintsRemaining}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-[#F4F1EA]">{formatDuration(elapsedMs)}</span>
          </div>
        </div>

        {/* Right: Quick Host Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#111815] text-[#A7B5AE] hover:text-[#F4F1EA] transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          {isPlaying && (
            <button
              type="button"
              onClick={handleReveal}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#111815] px-3 py-2 text-xs font-semibold text-[#C2CEC8] hover:border-white/25 hover:text-[#F4F1EA] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reveal</span>
            </button>
          )}

          {game.status === 'won' && (
            <button
              type="button"
              onClick={() => setWinnerModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#F5B82E]/40 bg-[#F5B82E]/15 px-3 py-2 text-xs font-semibold text-[#F5B82E] hover:bg-[#F5B82E]/25 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Winners</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleStartGame(game.mode)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5B82E] px-3.5 py-2 text-xs font-bold text-[#0F1613] hover:bg-[#F7C652] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isPlaying ? 'Restart' : 'Start Game'}</span>
          </button>
        </div>
      </div>

      {/* Main Play Area + Guess Box directly below main board at matching width */}
      {isQuad ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {game.boards.map((board) => (
              <LadderBoard
                key={board.boardIndex}
                board={board}
                isQuad={true}
                isSelected={selectedBoardIndex === board.boardIndex}
                onSelectBoard={() =>
                  setSelectedBoardIndex((prev) =>
                    prev === board.boardIndex ? null : board.boardIndex
                  )
                }
                canUseHints={isPlaying}
                hintsRemaining={game.hintsRemaining}
                onUseHint={handleUseHint}
                isGaveUp={isGaveUp}
                clockOffsetMs={clockOffsetMs}
              />
            ))}
          </div>

          <div className="w-full rounded-2xl border border-white/10 bg-[#16201C] p-4">
            <GuessInputBar
              mode={game.mode}
              boards={game.boards}
              disabled={!isPlaying}
              submitting={false}
              errorMessage={wsError}
              onClearError={onClearError}
              onSubmitGuess={handleSubmitGuess}
              selectedBoardIndex={selectedBoardIndex}
              onSelectBoardIndex={setSelectedBoardIndex}
              placeholder={
                isPlaying
                  ? undefined
                  : 'Round finished — press Start Game for the next round!'
              }
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
          {/* Primary Ladder Board + Matching-Width Guess Box Below */}
          <div className="space-y-4 min-w-0">
            {game.boards.map((board) => (
              <LadderBoard
                key={board.boardIndex}
                board={board}
                isQuad={false}
                canUseHints={isPlaying}
                hintsRemaining={game.hintsRemaining}
                onUseHint={handleUseHint}
                isGaveUp={isGaveUp}
                clockOffsetMs={clockOffsetMs}
              />
            ))}

            <div className="w-full rounded-2xl border border-white/10 bg-[#16201C] p-4">
              <GuessInputBar
                mode={game.mode}
                boards={game.boards}
                disabled={!isPlaying}
                submitting={false}
                errorMessage={wsError}
                onClearError={onClearError}
                onSubmitGuess={handleSubmitGuess}
                selectedBoardIndex={selectedBoardIndex}
                onSelectBoardIndex={setSelectedBoardIndex}
                placeholder={
                  isPlaying
                    ? undefined
                    : 'Round finished — press Start Game for the next round!'
                }
              />
            </div>
          </div>

          {/* Right Sidebar: Live Feed + Top Hunters */}
          <aside className="space-y-4">
            {/* Live Activity Feed */}
            <div className="rounded-2xl border border-white/10 bg-[#16201C] p-4">
              <h2 className="font-display text-sm font-bold text-[#F4F1EA] mb-3">
                Live Feed
              </h2>
              {game.recentActivity.length === 0 ? (
                <p className="text-xs text-[#7D8C84]">
                  Waiting for the first guess...
                </p>
              ) : (
                <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs">
                  {game.recentActivity.map((item) => (
                    <li
                      key={item.id}
                      className={`rounded-lg px-2.5 py-1.5 ${
                        item.tone === 'buffer'
                          ? 'bg-[#F5B82E]/15 text-[#F5B82E] font-semibold'
                          : item.tone === 'solve'
                          ? 'bg-emerald-500/15 text-emerald-300 font-semibold'
                          : item.tone === 'hint'
                          ? 'bg-amber-500/10 text-amber-200'
                          : 'bg-[#111815] text-[#C2CEC8]'
                      }`}
                    >
                      {item.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Top Hunters Mini-Board */}
            <div className="rounded-2xl border border-white/10 bg-[#16201C] p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-sm font-bold text-[#F4F1EA]">
                  Top Winners
                </h2>
                <button
                  type="button"
                  onClick={onOpenLeaderboard}
                  className="text-xs font-semibold text-[#F5B82E] hover:underline cursor-pointer"
                >
                  Full Board
                </button>
              </div>
              {topLeaders.length === 0 ? (
                <p className="text-xs text-[#7D8C84]">
                  Finish a round to appear on the leaderboard.
                </p>
              ) : (
                <ul className="space-y-1.5 text-xs">
                  {topLeaders.map((entry, idx) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-[#111815] px-2.5 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold text-[#F5B82E] w-5 shrink-0 tabular-nums">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-[#F4F1EA] truncate">
                          {entry.playerName}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-[#D6DDD9] tabular-nums shrink-0">
                        {entry.score.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Gave Up Banner */}
      {isGaveUp && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/12 bg-[#16201C] px-5 py-4">
          <p className="text-sm text-[#C2CEC8]">
            Round #{game.roundNumber} ({formatModeLabel(game.mode)}) revealed. Ready for another hunt?
          </p>
          <button
            type="button"
            onClick={() => handleStartGame(game.mode)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F5B82E] px-5 py-2.5 text-sm font-bold text-[#0F1613] hover:bg-[#F7C652] transition-colors cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            <span>Start Next Round</span>
          </button>
        </div>
      )}

      {/* Automatic Winner Popup Modal (15s Auto-Restart) */}
      <WinnerModal
        game={game}
        clockOffsetMs={clockOffsetMs}
        open={winnerModalOpen}
        onClose={() => setWinnerModalOpen(false)}
        onStartNextRound={() => handleStartGame(game.mode)}
      />
    </div>
  );
}
