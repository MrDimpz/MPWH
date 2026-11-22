import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  LeaderboardEntry,
  LiveGameStateView,
  WSClientMessage,
  WSServerMessage,
} from '../types/game';

export interface GuessFeedback {
  id: number;
  accepted: boolean;
  word: string;
  reason?: string;
  matchedWords?: string[];
  wasLagBufferHit?: boolean;
}

export function useWebSocket(playerName: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const playerNameRef = useRef(playerName);
  const feedbackSeqRef = useRef(0);

  const [connected, setConnected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(1);
  const [game, setGame] = useState<LiveGameStateView | null>(null);
  const [clockOffsetMs, setClockOffsetMs] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [latestScoreId, setLatestScoreId] = useState<string | null>(null);
  const [wsError, setWsError] = useState<string | null>(null);
  const [lastGuessFeedback, setLastGuessFeedback] = useState<GuessFeedback | null>(null);

  useEffect(() => {
    playerNameRef.current = playerName;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'set_name', playerName }));
    }
  }, [playerName]);

  const applyGameUpdate = useCallback((nextGame: LiveGameStateView) => {
    setGame(nextGame);
    if (typeof nextGame.serverNow === 'number') {
      setClockOffsetMs(nextGame.serverNow - Date.now());
    }
  }, []);

  const send = useCallback((msg: WSClientMessage): boolean => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }, []);

  const clearError = useCallback(() => setWsError(null), []);

  useEffect(() => {
    let active = true;

    // Initial HTTP hydration so the screen loads immediately
    Promise.all([
      fetch('/api/game').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/leaderboard?mode=all&limit=50')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([gameData, lbData]) => {
      if (!active) return;
      if (gameData?.game) {
        setGame((prev) => prev ?? gameData.game);
        if (typeof gameData.game.serverNow === 'number') {
          setClockOffsetMs(gameData.game.serverNow - Date.now());
        }
      }
      if (Array.isArray(lbData?.entries)) {
        setLeaderboard(lbData.entries);
      }
    });

    const connect = () => {
      if (!active) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!active) return;
        setConnected(true);
        setWsError(null);
        ws.send(JSON.stringify({ type: 'hello', playerName: playerNameRef.current }));
      };

      ws.onmessage = (event) => {
        if (!active) return;
        let data: WSServerMessage;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        switch (data.type) {
          case 'welcome':
            setClientId(data.clientId);
            setOnlineCount(data.onlineCount);
            applyGameUpdate(data.game);
            setLeaderboard(data.leaderboard);
            break;
          case 'presence':
            setOnlineCount(data.onlineCount);
            break;
          case 'game_state':
            applyGameUpdate(data.game);
            break;
          case 'leaderboard_update':
            setLeaderboard(data.leaderboard);
            if (data.latestEntry) {
              setLatestScoreId(data.latestEntry.id);
            }
            break;
          case 'guess_result':
            feedbackSeqRef.current += 1;
            setLastGuessFeedback({
              id: feedbackSeqRef.current,
              accepted: data.accepted,
              word: data.word,
              reason: data.reason,
              matchedWords: data.matchedWords,
              wasLagBufferHit: data.wasLagBufferHit,
            });
            if (!data.accepted && data.reason) {
              setWsError(data.reason);
            } else {
              setWsError(null);
            }
            break;
          case 'error':
            setWsError(data.message);
            break;
        }
      };

      ws.onclose = () => {
        if (!active) return;
        setConnected(false);
        reconnectTimerRef.current = window.setTimeout(connect, 1600);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      active = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      wsRef.current?.close();
    };
  }, [applyGameUpdate]);

  return {
    connected,
    clientId,
    onlineCount,
    game,
    clockOffsetMs,
    leaderboard,
    latestScoreId,
    wsError,
    clearError,
    lastGuessFeedback,
    send,
  };
}
