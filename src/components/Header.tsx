import { useEffect, useRef, useState } from 'react';
import { Check, Pencil } from 'lucide-react';

export type AppTab = 'play' | 'leaderboard' | 'rules';

interface HeaderProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  playerName: string;
  onChangePlayerName: (name: string) => void;
}

const NAV_ITEMS: Array<{ id: AppTab; label: string }> = [
  { id: 'play', label: 'Live Game' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'rules', label: 'How to Play' },
];

export function Header({
  activeTab,
  onSelectTab,
  playerName,
  onChangePlayerName,
}: HeaderProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(playerName);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDraft(playerName);
  }, [playerName]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    const onOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setEditing(false);
      }
    };
    window.addEventListener('mousedown', onOutsideClick);
    return () => window.removeEventListener('mousedown', onOutsideClick);
  }, [editing]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draft.replace(/[^a-zA-Z0-9_\-. @]/g, '').trim().slice(0, 22);
    if (cleaned) {
      onChangePlayerName(cleaned);
    }
    setEditing(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0F1613]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-8 px-5 py-3.5 sm:px-8">
        <button
          type="button"
          onClick={() => onSelectTab('play')}
          className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-[#F4F1EA] hover:text-[#F5B82E] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B82E] rounded"
        >
          Word Hunt - Extreme Edition
        </button>

        <nav aria-label="Primary" className="flex items-center gap-6 sm:gap-8 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B82E] rounded ${
                  isActive
                    ? 'text-[#F5B82E]'
                    : 'text-[#A7B5AE] hover:text-[#F4F1EA]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-3.5 h-0.5 bg-[#F5B82E]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="relative shrink-0" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/12 bg-[#18221E] px-3.5 py-2 text-xs font-semibold text-[#F4F1EA] hover:border-[#F5B82E]/50 hover:text-[#F5B82E] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B82E]"
          >
            <span className="max-w-[120px] truncate">{playerName}</span>
            <Pencil className="h-3.5 w-3.5 text-[#9CA9A2]" aria-hidden="true" />
          </button>

          {editing && (
            <form
              onSubmit={handleSave}
              className="absolute right-0 mt-2 w-64 rounded-xl border border-white/12 bg-[#18221E] p-4 shadow-2xl"
            >
              <label
                htmlFor="player-name-input"
                className="block text-xs font-medium text-[#A7B5AE] mb-2"
              >
                Display Name (Winner Popup &amp; Board)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="player-name-input"
                  ref={inputRef}
                  type="text"
                  maxLength={22}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Enter display name"
                  className="w-full rounded-lg border border-white/15 bg-[#0F1613] px-3 py-2 text-sm text-[#F4F1EA] placeholder:text-[#6B7A72] focus:border-[#F5B82E] focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Save name"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5B82E] text-[#0F1613] hover:bg-[#F7C652] transition-colors cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
