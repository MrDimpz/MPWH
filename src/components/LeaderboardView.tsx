import { useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';
import type { LadderMode, LeaderboardEntry } from '../types/game';
import { formatDuration, formatModeLabel, formatRelativeTime } from '../utils/format';

type LeaderboardFilter = 'all' | LadderMode;

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  latestScoreId: string | null;
  onlineCount: number;
  currentPlayerName: string;
  onJumpToPlay: () => void;
}

const FILTERS: Array<{ id: LeaderboardFilter; label: string }> = [
  { id: 'all', label: 'All Modes' },
  { id: 'classic', label: 'Classic' },
  { id: 'dual', label: 'Dual Ladder' },
  { id: 'quad', label: 'Quad Hunt' },
];

export function LeaderboardView({
  entries,
  latestScoreId,
  onlineCount,
  currentPlayerName,
  onJumpToPlay,
}: LeaderboardViewProps) {
  const [filter, setFilter] = useState<LeaderboardFilter>('all');

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filter === 'all') return true;
      return e.mode === filter;
    });
  }, [entries, filter]);

  return (
    <div className="mx-auto max-w-[1160px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#F4F1EA]">
            Real-Time Leaderboard
          </h1>
          <p className="mt-1 text-sm text-[#9CA9A2]">
            Winners are recorded automatically after every round finishes its 4-second lag buffer.
            {' · '}
            <span className="tabular-nums text-[#F4F1EA] font-medium">
              {onlineCount} {onlineCount === 1 ? 'player' : 'players'} connected
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-[#141D19] p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filter === f.id
                  ? 'bg-[#F5B82E] text-[#0F1613]'
                  : 'text-[#A7B5AE] hover:text-[#F4F1EA]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#16201C] p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1F2B26] text-[#F5B82E]">
            <Trophy className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="font-display text-xl font-bold text-[#F4F1EA]">
            No winners recorded yet for this mode
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#9CA9A2]">
            Start a live round and guess the secret words to appear on the real-time leaderboard.
          </p>
          <button
            type="button"
            onClick={onJumpToPlay}
            className="mt-6 rounded-xl bg-[#F5B82E] px-5 py-2.5 text-sm font-bold text-[#0F1613] hover:bg-[#F7C652] transition-colors cursor-pointer"
          >
            Go to Live Game
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#16201C]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#121A17] text-xs font-semibold text-[#8C9B93]">
                  <th className="py-3.5 pl-5 pr-3 w-16">Rank</th>
                  <th className="py-3.5 px-3">Winner</th>
                  <th className="py-3.5 px-3">Mode</th>
                  <th className="py-3.5 px-3 text-right">Words</th>
                  <th className="py-3.5 px-3 text-right">Score</th>
                  <th className="py-3.5 px-3 text-right">Bananas</th>
                  <th className="py-3.5 px-3 text-right">Time</th>
                  <th className="py-3.5 pl-3 pr-5 text-right">Recorded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6 text-sm">
                {filtered.map((entry, idx) => {
                  const rank = idx + 1;
                  const isMe =
                    entry.playerName.toLowerCase() === currentPlayerName.toLowerCase();
                  const isLatest = entry.id === latestScoreId;
                  return (
                    <tr
                      key={entry.id}
                      className={`transition-colors ${
                        isLatest
                          ? 'animate-ladder-flash bg-[#F5B82E]/10'
                          : isMe
                          ? 'bg-white/[0.03]'
                          : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="py-3.5 pl-5 pr-3 font-mono font-semibold tabular-nums">
                        <span
                          className={
                            rank === 1
                              ? 'text-[#F5B82E]'
                              : rank === 2
                              ? 'text-[#D6DDD9]'
                              : rank === 3
                              ? 'text-amber-600'
                              : 'text-[#7D8C84]'
                          }
                        >
                          #{rank}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-[#F4F1EA]">
                        <span>{entry.playerName}</span>
                        {isMe && (
                          <span className="ml-2 text-xs font-medium text-[#F5B82E]">
                            (You)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-xs text-[#E5E0D5] font-medium">
                        {formatModeLabel(entry.mode)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums text-emerald-400 font-semibold">
                        {entry.wordsFound}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold tabular-nums text-[#F4F1EA]">
                        {entry.score.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums text-[#F5B82E]">
                        {entry.bananas.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums text-[#C2CEC8]">
                        {formatDuration(entry.durationMs)}
                      </td>
                      <td className="py-3.5 pl-3 pr-5 text-right text-xs text-[#8C9B93] whitespace-nowrap">
                        {formatRelativeTime(entry.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
