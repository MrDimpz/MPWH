import { useEffect, useRef, useState } from 'react';
import { CornerDownLeft } from 'lucide-react';
import type { LadderInstanceView, LadderMode } from '../types/game';

interface GuessInputBarProps {
  mode: LadderMode;
  boards: LadderInstanceView[];
  disabled: boolean;
  submitting: boolean;
  errorMessage: string | null;
  onClearError: () => void;
  onSubmitGuess: (word: string, targetBoardIndex: number | null) => void;
  selectedBoardIndex: number | null;
  onSelectBoardIndex: (idx: number | null) => void;
  placeholder?: string;
}

export function GuessInputBar({
  mode,
  boards,
  disabled,
  submitting,
  errorMessage,
  onClearError,
  onSubmitGuess,
  selectedBoardIndex,
  onSelectBoardIndex,
  placeholder,
}: GuessInputBarProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled, mode]);

  const cleanLen = value.trim().length;
  const isLengthValid = cleanLen >= 4 && cleanLen <= 8;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || submitting) return;
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return;
    onSubmitGuess(trimmed, mode === 'quad' ? selectedBoardIndex : null);
    setValue('');
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2.5">
      {mode === 'quad' && boards.length === 4 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-medium text-[#A7B5AE]">
            Send guess to
          </span>
          <div className="flex items-center gap-1 rounded-lg bg-[#141D19] p-1 border border-white/8">
            <button
              type="button"
              onClick={() => onSelectBoardIndex(null)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedBoardIndex === null
                  ? 'bg-[#F5B82E] text-[#0F1613]'
                  : 'text-[#A7B5AE] hover:text-[#F4F1EA]'
              }`}
            >
              All 4 Boards
            </button>
            {boards.map((b) => (
              <button
                key={b.boardIndex}
                type="button"
                disabled={b.lockedSolved}
                onClick={() => onSelectBoardIndex(b.boardIndex)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  selectedBoardIndex === b.boardIndex
                    ? 'bg-[#F5B82E] text-[#0F1613]'
                    : 'text-[#A7B5AE] hover:text-[#F4F1EA]'
                }`}
              >
                #{b.boardIndex + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative flex items-center gap-2.5">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={8}
            disabled={disabled}
            value={value}
            onChange={(e) => {
              const lettersOnly = e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 8);
              setValue(lettersOnly);
              if (errorMessage) onClearError();
            }}
            placeholder={(() => {
              if (placeholder) return placeholder;
              if (mode === 'quad' && selectedBoardIndex !== null) {
                const len = boards[selectedBoardIndex]?.targets[0]?.revealedLength;
                return len
                  ? `Type a word for Board #${selectedBoardIndex + 1} (${len} letters)...`
                  : `Type a word for Board #${selectedBoardIndex + 1}...`;
              }
              if (mode === 'quad') {
                return 'Type a word to play on all 4 boards...';
              }
              if (mode === 'dual') {
                const lengths = boards[0]?.targets
                  .map((t) => t.revealedLength)
                  .filter((n): n is number => typeof n === 'number');
                if (lengths && lengths.length === 2) {
                  return `Type a word (${lengths[0]}-letter & ${lengths[1]}-letter targets)...`;
                }
              }
              const targetLen = boards[0]?.targets[0]?.revealedLength;
              return targetLen
                ? `Type a word (${targetLen} letters required for secret word)...`
                : 'Type a dictionary word...';
            })()}
            className={`w-full rounded-xl border bg-[#141D19] px-4 py-3.5 pr-20 font-display text-lg font-bold tracking-[0.08em] uppercase text-[#F4F1EA] placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-[#6B7A72] transition-colors focus:outline-none disabled:opacity-50 ${
              errorMessage
                ? 'border-rose-400/70 focus:border-rose-400'
                : 'border-white/12 focus:border-[#F5B82E]'
            }`}
          />
          <span
            className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs tabular-nums ${
              cleanLen === 0
                ? 'text-[#6B7A72]'
                : isLengthValid
                ? 'text-emerald-400'
                : 'text-[#F5B82E]'
            }`}
          >
            {cleanLen}/8
          </span>
        </div>

        <button
          type="submit"
          disabled={disabled || submitting || !isLengthValid}
          className="inline-flex h-[54px] items-center justify-center gap-2 rounded-xl bg-[#F5B82E] px-5 text-sm font-bold text-[#0F1613] hover:bg-[#F7C652] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B82E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1613]"
        >
          <span>Guess</span>
          <CornerDownLeft className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>

      {errorMessage && (
        <p role="alert" className="text-xs font-medium text-rose-300">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
