import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import type { GuessEntry, LadderInstanceView, LadderTargetView } from '../types/game';

interface LadderBoardProps {
  board: LadderInstanceView;
  isQuad: boolean;
  isSelected?: boolean;
  onSelectBoard?: () => void;
  canUseHints: boolean;
  hintsRemaining: number;
  onUseHint: (hintType: 'bracket' | 'clue', boardIndex: number, targetIndex: number) => void;
  isGaveUp: boolean;
  clockOffsetMs: number;
}

function BracketWordRow({
  entry,
  direction,
  isLatest,
  compact,
  emptyLabel,
  subLabel,
}: {
  entry: GuessEntry | null;
  direction: 'above' | 'below' | 'between';
  isLatest: boolean;
  compact: boolean;
  emptyLabel: string;
  subLabel?: string;
}) {
  const renderArrow = (className: string) => {
    if (direction === 'above') {
      return <ArrowDown className={className} aria-hidden="true" />;
    }
    if (direction === 'below') {
      return <ArrowUp className={className} aria-hidden="true" />;
    }
    return <ArrowUpDown className={className} aria-hidden="true" />;
  };

  if (!entry) {
    return (
      <div
        className={`flex items-center justify-between rounded-xl border border-dashed border-white/10 bg-[#121A17]/60 ${
          compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-xs'
        } text-[#64736B]`}
      >
        <span className="inline-flex items-center gap-1.5">
          {renderArrow('h-3.5 w-3.5 text-[#58675F]')}
          <span>{emptyLabel}</span>
        </span>
        <span className="font-mono text-[11px] uppercase tracking-wider text-[#526059]">
          {direction === 'above' ? 'A →' : direction === 'below' ? '← Z' : 'A ↔ Z'}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border transition-all ${
        compact ? 'px-3 py-2.5' : 'px-4 py-3'
      } ${
        isLatest
          ? 'animate-ladder-flash border-[#F5B82E]/50 bg-[#1E2A25] shadow-sm'
          : 'border-white/10 bg-[#18231F]'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
            direction === 'above'
              ? 'bg-sky-500/15 text-sky-300'
              : direction === 'below'
              ? 'bg-violet-500/15 text-violet-300'
              : 'bg-[#F5B82E]/15 text-[#F5B82E]'
          }`}
          title={
            direction === 'above'
              ? 'Closest word above secret word'
              : direction === 'below'
              ? 'Closest word below secret word'
              : 'Closest word between both secret words'
          }
        >
          {renderArrow('h-4 w-4')}
        </span>
        <span
          className={`font-display font-extrabold tracking-[0.09em] uppercase truncate leading-tight ${
            compact ? 'text-[20px]' : 'text-[25px]'
          } ${entry.isHint ? 'text-[#F5B82E]' : 'text-[#F4F1EA]'}`}
        >
          {entry.word}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0 text-xs">
        {subLabel && (
          <span className="text-[11px] font-medium text-[#7D8C84]">{subLabel}</span>
        )}
        {entry.isHint ? (
          <span className="font-semibold text-[#F5B82E]">Hint</span>
        ) : entry.guessedBy ? (
          <span className="max-w-[110px] truncate text-[#9CA9A2]">{entry.guessedBy}</span>
        ) : null}
      </div>
    </div>
  );
}

function TargetWordCard({
  target,
  boardIndex,
  isDual,
  compact,
  canUseHints,
  hintsRemaining,
  onUseHint,
  isGaveUp,
  nowMs,
}: {
  target: LadderTargetView;
  boardIndex: number;
  isDual: boolean;
  compact: boolean;
  canUseHints: boolean;
  hintsRemaining: number;
  onUseHint: (hintType: 'bracket' | 'clue', boardIndex: number, targetIndex: number) => void;
  isGaveUp: boolean;
  nowMs: number;
}) {
  const lockedSolved = target.solved && !target.bufferActive;
  const revealedWord = target.word;
  const bufferRemainingMs =
    target.bufferActive && target.bufferEndsAt
      ? Math.max(0, target.bufferEndsAt - nowMs)
      : 0;
  const bufferPct = Math.min(100, (bufferRemainingMs / 4000) * 100);

  // Merge shared prefix (from closestBefore & closestAfter) and Letter Clue prefix
  const sharedPrefix = target.sharedPrefix || '';
  const cluePrefix = target.revealedPrefix || '';
  const effectivePrefix =
    sharedPrefix.length >= cluePrefix.length ? sharedPrefix : cluePrefix;
  const hasAutoFilledPrefix = !target.solved && !isGaveUp && sharedPrefix.length > 0;

  // Always use the exact number of letters required for the target word
  const exactLength = revealedWord?.length ?? target.revealedLength ?? 5;
  const tileCount = exactLength;

  const tileChars = Array.from({ length: tileCount }, (_, i) => {
    if (revealedWord) return revealedWord[i]?.toUpperCase() ?? '';
    if (effectivePrefix && i < effectivePrefix.length) {
      return effectivePrefix[i].toUpperCase();
    }
    return '?';
  });

  const winnerNames = target.winners.map((w) => w.name);

  return (
    <div
      className={`rounded-xl border transition-all ${
        compact ? 'p-3.5' : 'p-5'
      } ${
        lockedSolved
          ? 'border-emerald-400/45 bg-emerald-950/35'
          : target.bufferActive
          ? 'border-[#F5B82E] bg-[#F5B82E]/12 shadow-[0_0_0_1px_rgba(245,184,46,0.28)]'
          : isGaveUp
          ? 'border-white/15 bg-[#1B2521]'
          : 'border-[#F5B82E]/40 bg-[#1B2621] shadow-[0_0_0_1px_rgba(245,184,46,0.12)]'
      }`}
    >
      {/* Top Meta Line */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          {lockedSolved ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
          ) : target.bufferActive ? (
            <Clock className="h-4 w-4 text-[#F5B82E] shrink-0" aria-hidden="true" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-[#F5B82E] shrink-0" aria-hidden="true" />
          )}
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              lockedSolved ? 'text-emerald-300' : 'text-[#F5B82E]'
            }`}
          >
            {target.bufferActive
              ? `${isDual ? `Word #${target.index + 1}` : 'Word'} Found · 4s Lag Window`
              : isDual
              ? `Secret Word #${target.index + 1}`
              : 'Secret Word'}
          </span>
        </div>

        {target.bufferActive ? (
          <span className="font-mono text-xs font-bold tabular-nums text-[#F5B82E]">
            {(bufferRemainingMs / 1000).toFixed(1)}s left
          </span>
        ) : lockedSolved ? (
          <span className="text-xs font-semibold text-emerald-300 truncate max-w-[220px]">
            {winnerNames.length > 0 ? `Found by ${winnerNames.join(', ')}` : 'Found'}
          </span>
        ) : !isGaveUp ? (
          <span className="font-mono text-xs font-semibold tabular-nums text-[#F4F1EA]">
            {exactLength} letters
          </span>
        ) : (
          <span className="text-xs font-medium text-[#9CA9A2]">
            {exactLength} letters · Revealed
          </span>
        )}
      </div>

      {/* Sculpted 3D Letter Tiles (+50% Size, Gold Border on Autofilled Boxes) */}
      <div className="flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap py-1">
        {tileChars.map((ch, idx) => {
          const isAutoFilled =
            !revealedWord &&
            !target.bufferActive &&
            !isGaveUp &&
            idx < sharedPrefix.length;
          const isClueFilled =
            !revealedWord &&
            !target.bufferActive &&
            !isGaveUp &&
            !isAutoFilled &&
            ch !== '?';

          return (
            <div
              key={idx}
              className={`relative flex items-center justify-center rounded-xl font-display font-extrabold select-none transition-transform duration-150 ${
                compact
                  ? 'h-12 w-10 text-xl sm:h-[54px] sm:w-12 sm:text-2xl'
                  : 'h-14 w-12 text-2xl sm:h-[72px] sm:w-[60px] sm:text-3xl'
              } ${
                lockedSolved
                  ? 'animate-tile-flip bg-gradient-to-b from-emerald-500/40 to-emerald-700/40 border border-emerald-400/75 border-b-[5px] border-b-emerald-900 shadow-[0_6px_14px_rgba(16,185,129,0.25),inset_0_1px_0_rgba(167,243,208,0.45)] text-emerald-100'
                  : target.bufferActive
                  ? 'animate-tile-flip bg-gradient-to-b from-emerald-500/40 to-emerald-700/40 border-2 border-[#F5B82E] border-b-[5px] border-b-[#9E6B0E] shadow-[0_6px_16px_rgba(245,184,46,0.28),inset_0_1px_0_rgba(255,232,163,0.45)] text-emerald-50'
                  : isGaveUp
                  ? 'bg-gradient-to-b from-[#26332E] to-[#17201C] border border-white/20 border-b-[5px] border-b-[#0B110F] shadow-[0_6px_12px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.16)] text-[#E5E0D5]'
                  : isAutoFilled
                  ? 'bg-gradient-to-b from-[#352B14] to-[#1E180B] border-2 border-[#F5B82E] border-b-[6px] border-b-[#A67010] shadow-[0_7px_18px_rgba(245,184,46,0.32),inset_0_1px_0_rgba(255,234,167,0.5)] text-[#FFD666]'
                  : isClueFilled
                  ? 'bg-gradient-to-b from-[#2B2516] to-[#19160E] border border-[#F5B82E]/75 border-b-[5px] border-b-[#8F6212] shadow-[0_6px_14px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,224,138,0.32)] text-[#F5B82E]'
                  : 'bg-gradient-to-b from-[#202E28] to-[#121B17] border border-white/15 border-b-[5px] border-b-[#080E0C] shadow-[0_6px_14px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.14)] text-[#64766D]'
              }`}
            >
              <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]">{ch}</span>
            </div>
          );
        })}
      </div>

      {/* 4-Second Stream-Lag Buffer Bar */}
      {target.bufferActive && (
        <div className="mt-3 space-y-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0F1613]">
            <div
              className="h-full bg-[#F5B82E] transition-[width] duration-100 ease-linear"
              style={{ width: `${bufferPct}%` }}
            />
          </div>
          <p className="text-center text-xs font-medium text-[#F4F1EA]">
            Keep guessing for lagged viewers!{' '}
            {winnerNames.length > 0 && (
              <span className="text-[#F5B82E]">
                Got it: {winnerNames.join(', ')}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Auto-filled Shared Prefix Indicator */}
      {hasAutoFilledPrefix && (
        <p className="mt-2.5 text-center text-xs font-medium text-[#F5B82E]">
          Auto-filled &ldquo;{sharedPrefix.toUpperCase()}&rdquo; from matching guesses above &amp; below
        </p>
      )}

      {/* Hint Controls when Active */}
      {!target.solved && !isGaveUp && (
        <div className="mt-3 pt-2.5 border-t border-white/8 flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0F1613]">
              <div
                className="h-full bg-[#F5B82E] transition-all duration-300"
                style={{ width: `${Math.max(4, target.proximityPct)}%` }}
              />
            </div>
          </div>

          {canUseHints && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={hintsRemaining <= 0}
                onClick={(e) => {
                  e.stopPropagation();
                  onUseHint('bracket', boardIndex, target.index);
                }}
                title="Place a dictionary word closer to the secret word"
                className="inline-flex items-center gap-1 rounded-md border border-white/12 bg-[#141D19] px-2 py-1 text-[11px] font-semibold text-[#D6DDD9] hover:border-[#F5B82E]/50 hover:text-[#F5B82E] transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                <span>Hint</span>
              </button>
              <button
                type="button"
                disabled={hintsRemaining <= 0}
                onClick={(e) => {
                  e.stopPropagation();
                  onUseHint('clue', boardIndex, target.index);
                }}
                title="Reveal exact word length and starting letter"
                className="inline-flex items-center gap-1 rounded-md border border-white/12 bg-[#141D19] px-2 py-1 text-[11px] font-semibold text-[#D6DDD9] hover:border-[#F5B82E]/50 hover:text-[#F5B82E] transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
              >
                <Lightbulb className="h-3 w-3" aria-hidden="true" />
                <span>Clue</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function LadderBoard({
  board,
  isQuad,
  isSelected,
  onSelectBoard,
  canUseHints,
  hintsRemaining,
  onUseHint,
  isGaveUp,
  clockOffsetMs,
}: LadderBoardProps) {
  const isDual = board.targets.length === 2;
  const hasActiveBuffer = board.targets.some((t) => t.bufferActive);
  const [nowMs, setNowMs] = useState(() => Date.now() + clockOffsetMs);

  useEffect(() => {
    setNowMs(Date.now() + clockOffsetMs);
    if (!hasActiveBuffer) return;
    const interval = window.setInterval(() => {
      setNowMs(Date.now() + clockOffsetMs);
    }, 80);
    return () => window.clearInterval(interval);
  }, [hasActiveBuffer, clockOffsetMs]);

  const t0 = board.targets[0];
  const t1 = isDual ? board.targets[1] : null;

  // In Dual mode, check whether closestAfter(t0) and closestBefore(t1) are the exact same word
  const middleSameWord =
    isDual &&
    t0.closestAfter &&
    t1?.closestBefore &&
    t0.closestAfter.word === t1.closestBefore.word;

  return (
    <section
      onClick={isQuad && onSelectBoard ? onSelectBoard : undefined}
      className={`rounded-2xl border bg-[#16201C] transition-all flex flex-col ${
        isQuad ? 'p-3.5 cursor-pointer' : 'p-5'
      } ${
        board.lockedSolved
          ? 'border-emerald-400/40'
          : hasActiveBuffer
          ? 'border-[#F5B82E]/70 shadow-[0_0_0_1px_rgba(245,184,46,0.2)]'
          : isSelected
          ? 'border-[#F5B82E] shadow-[0_0_0_1px_rgba(245,184,46,0.3)]'
          : 'border-white/10 hover:border-white/18'
      }`}
    >
      {/* Board Header */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/8">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-display text-sm font-bold text-[#F4F1EA] truncate">
            {board.label}
          </h3>
          {board.lockedSolved && (
            <span className="text-xs font-semibold text-emerald-400">Solved</span>
          )}
          {!board.lockedSolved && hasActiveBuffer && (
            <span className="text-xs font-semibold text-[#F5B82E]">4s Buffer</span>
          )}
        </div>
        <span className="font-mono text-xs tabular-nums text-[#8C9B93]">
          {board.guessCount} {board.guessCount === 1 ? 'guess' : 'guesses'}
        </span>
      </div>

      {/* Closest-Only Alphabetical Ladder */}
      <div className="space-y-2.5 flex-1 flex flex-col justify-center">
        {/* Closest Word Above Target 1 */}
        <BracketWordRow
          entry={t0.closestBefore}
          direction="above"
          isLatest={Boolean(t0.closestBefore && board.lastGuessWord === t0.closestBefore.word)}
          compact={isQuad}
          emptyLabel="No word above yet"
        />

        {/* Target 1 */}
        <TargetWordCard
          target={t0}
          boardIndex={board.boardIndex}
          isDual={isDual}
          compact={isQuad}
          canUseHints={canUseHints}
          hintsRemaining={hintsRemaining}
          onUseHint={onUseHint}
          isGaveUp={isGaveUp}
          nowMs={nowMs}
        />

        {isDual && t1 ? (
          <>
            {/* Middle Closest Word(s) Between Target 1 and Target 2 */}
            {middleSameWord ? (
              <BracketWordRow
                entry={t0.closestAfter}
                direction="between"
                isLatest={Boolean(
                  t0.closestAfter && board.lastGuessWord === t0.closestAfter.word
                )}
                compact={false}
                emptyLabel="No word between yet"
                subLabel="Between #1 & #2"
              />
            ) : (
              <div className="space-y-2">
                {t0.closestAfter && (
                  <BracketWordRow
                    entry={t0.closestAfter}
                    direction="below"
                    isLatest={board.lastGuessWord === t0.closestAfter.word}
                    compact={false}
                    emptyLabel="No word after #1 yet"
                    subLabel="After #1"
                  />
                )}
                {t1.closestBefore && (
                  <BracketWordRow
                    entry={t1.closestBefore}
                    direction="above"
                    isLatest={board.lastGuessWord === t1.closestBefore.word}
                    compact={false}
                    emptyLabel="No word before #2 yet"
                    subLabel="Before #2"
                  />
                )}
                {!t0.closestAfter && !t1.closestBefore && (
                  <BracketWordRow
                    entry={null}
                    direction="between"
                    isLatest={false}
                    compact={false}
                    emptyLabel="No word between #1 & #2 yet"
                  />
                )}
              </div>
            )}

            {/* Target 2 */}
            <TargetWordCard
              target={t1}
              boardIndex={board.boardIndex}
              isDual={true}
              compact={false}
              canUseHints={canUseHints}
              hintsRemaining={hintsRemaining}
              onUseHint={onUseHint}
              isGaveUp={isGaveUp}
              nowMs={nowMs}
            />

            {/* Closest Word Below Target 2 */}
            <BracketWordRow
              entry={t1.closestAfter}
              direction="below"
              isLatest={Boolean(
                t1.closestAfter && board.lastGuessWord === t1.closestAfter.word
              )}
              compact={false}
              emptyLabel="No word below yet"
            />
          </>
        ) : (
          /* Single-Target Closest Word Below */
          <BracketWordRow
            entry={t0.closestAfter}
            direction="below"
            isLatest={Boolean(
              t0.closestAfter && board.lastGuessWord === t0.closestAfter.word
            )}
            compact={isQuad}
            emptyLabel="No word below yet"
          />
        )}
      </div>
    </section>
  );
}
