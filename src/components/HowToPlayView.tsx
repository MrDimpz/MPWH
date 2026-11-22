import { ArrowDown, ArrowUp, Clock, Play, Sparkles, Trophy } from 'lucide-react';
import emblemUrl from '../assets/images/gorilla_word_hunt_emblem_1795368301777.jpg';

interface HowToPlayViewProps {
  onStartPlaying: () => void;
}

export function HowToPlayView({ onStartPlaying }: HowToPlayViewProps) {
  return (
    <div className="mx-auto max-w-[1040px] space-y-8">
      {/* Intro Banner */}
      <section className="grid gap-6 md:grid-cols-[200px_1fr] items-center rounded-2xl border border-white/10 bg-[#16201C] p-6 sm:p-8">
        <img
          src={emblemUrl}
          alt="Word Hunt - Extreme Edition Emblem"
          className="h-40 w-40 md:h-48 md:w-48 rounded-2xl object-cover border border-white/10 mx-auto"
        />
        <div className="space-y-3">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#F4F1EA]">
            How to Play Word Hunt - Extreme Edition
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-[#A7B5AE]">
            Built for TikTok Live interactive streams. Press <strong className="text-[#F4F1EA]">Start Game</strong> to launch a live round — no room codes required. Guess valid 4–8 letter English words to pinch the hidden word(s) alphabetically.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onStartPlaying}
              className="inline-flex items-center gap-2 rounded-xl bg-[#F5B82E] px-5 py-2.5 text-sm font-bold text-[#0F1613] hover:bg-[#F7C652] transition-colors cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" aria-hidden="true" />
              <span>Go to Live Game</span>
            </button>
          </div>
        </div>
      </section>

      {/* Key Stream Rules */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#16201C] p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-[#F5B82E]">
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
            <h2 className="font-display text-base font-bold text-[#F4F1EA]">
              Closest Bracket Only
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-[#A7B5AE]">
            Instead of a cluttered word history list, the board shows only the single closest word alphabetically above and below each secret word — keeping your stream layout crisp and readable.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#16201C] p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-[#F5B82E]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <h2 className="font-display text-base font-bold text-[#F4F1EA]">
              Shared Letters Auto-Fill
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-[#A7B5AE]">
            Whenever the closest word above and the closest word below start with the same letters (for example <span className="font-mono text-[#F4F1EA]">BASKET</span> above and <span className="font-mono text-[#F4F1EA]">BATTERY</span> below), <span className="font-mono font-bold text-[#F5B82E]">BA</span> automatically fills into the word box.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#16201C] p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-[#F5B82E]">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <h2 className="font-display text-base font-bold text-[#F4F1EA]">
              4-Second Stream-Lag Buffer
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-[#A7B5AE]">
            Once a player guesses a secret word correctly, it fills into the letter boxes and opens a 4-second lag buffer so viewers on delayed streams who submit the exact word within 4 seconds also earn winner credit!
          </p>
        </div>
      </section>

      {/* Modes & Winner Popup */}
      <section className="rounded-2xl border border-white/10 bg-[#16201C] p-6 space-y-4">
        <div className="flex items-center gap-2 text-[#F5B82E]">
          <Trophy className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold text-[#F4F1EA]">
            Three Modes &amp; Automatic Winner Popup
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 text-xs leading-relaxed text-[#A7B5AE]">
          <div className="rounded-xl border border-white/8 bg-[#121A17] p-4">
            <h3 className="font-display text-sm font-bold text-[#F4F1EA] mb-1">
              Classic (1 Word)
            </h3>
            <p>One secret 4–8 letter word. Fast rounds ideal for high-tempo live chats.</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-[#121A17] p-4">
            <h3 className="font-display text-sm font-bold text-[#F4F1EA] mb-1">
              Dual Ladder (2 Words)
            </h3>
            <p>Two secret words inside the same A→Z ladder. Every guess tightens the brackets around both targets.</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-[#121A17] p-4">
            <h3 className="font-display text-sm font-bold text-[#F4F1EA] mb-1">
              Quad Hunt (4 Boards)
            </h3>
            <p>Four separate boards running at the same time. One guess plays across all active boards or a targeted board.</p>
          </div>
        </div>
        <p className="text-xs text-[#9CA9A2]">
          When all words in the round are found and every 4-second lag buffer completes, a celebratory Winner Popup automatically appears displaying every winning player&apos;s name, found words, and leaderboard score — then automatically starts a fresh round after 15 seconds.
        </p>
      </section>
    </div>
  );
}
