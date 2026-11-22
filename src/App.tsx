import { useState } from 'react';
import { Header, type AppTab } from './components/Header';
import { LiveGameView } from './components/LiveGameView';
import { LeaderboardView } from './components/LeaderboardView';
import { HowToPlayView } from './components/HowToPlayView';
import { useWebSocket } from './hooks/useWebSocket';

const NAME_STORAGE_KEY = 'word_hunt_player_name_v1';

function getInitialPlayerName(): string {
  try {
    const saved = localStorage.getItem(NAME_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim().slice(0, 22);
  } catch {
    // ignore storage errors
  }
  const suffix = Math.floor(100 + Math.random() * 900);
  return `Player-${suffix}`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('play');
  const [playerName, setPlayerName] = useState<string>(getInitialPlayerName);

  const {
    onlineCount,
    game,
    clockOffsetMs,
    leaderboard,
    latestScoreId,
    wsError,
    clearError,
    lastGuessFeedback,
    send,
  } = useWebSocket(playerName);

  const handleChangePlayerName = (nextName: string) => {
    setPlayerName(nextName);
    try {
      localStorage.setItem(NAME_STORAGE_KEY, nextName);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1613] text-[#F4F1EA] flex flex-col">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        playerName={playerName}
        onChangePlayerName={handleChangePlayerName}
      />

      <main className="mx-auto w-full max-w-[1360px] flex-1 px-5 py-6 sm:px-8 sm:py-8">
        {activeTab === 'play' && (
          <LiveGameView
            game={game}
            clockOffsetMs={clockOffsetMs}
            playerName={playerName}
            leaderboard={leaderboard}
            wsError={wsError}
            onClearError={clearError}
            lastGuessFeedback={lastGuessFeedback}
            onSend={send}
            onOpenLeaderboard={() => setActiveTab('leaderboard')}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardView
            entries={leaderboard}
            latestScoreId={latestScoreId}
            onlineCount={onlineCount}
            currentPlayerName={playerName}
            onJumpToPlay={() => setActiveTab('play')}
          />
        )}

        {activeTab === 'rules' && (
          <HowToPlayView onStartPlaying={() => setActiveTab('play')} />
        )}
      </main>
    </div>
  );
}
