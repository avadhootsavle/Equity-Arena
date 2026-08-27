import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../services/api';
import { useSocket } from '../context/SocketContext';

const DEFAULT_SESSION = {
  id: null,
  status: 'NOT_STARTED',
  remainingSeconds: 0,
  durationMinutes: 180,
  liquidationBufferMinutes: 5,
  macroCycleIntervalMinutes: 15,
  volatilityLevel: 'MEDIUM',
  isLiquidated: false,
  isTradingLocked: true,
  isPaused: false
};

/**
 * Single source of truth for the game session.
 */
export function useSession() {
  const { socket } = useSocket();
  const [session, setSession] = useState(DEFAULT_SESSION);

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch('/session');
      if (data && typeof data === 'object') {
        setSession({ ...DEFAULT_SESSION, ...data });
      }
    } catch (err) {
      // Periodic refresh retry
    }
  }, []);

  // Re-sync periodically so the local countdown can't drift from the server
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 20000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (!socket) return;
    const onChange = () => refresh();

    socket.on('session:started', onChange);
    socket.on('session:paused', onChange);
    socket.on('session:resumed', onChange);
    socket.on('session:liquidated', onChange);
    socket.on('session:ended', onChange);

    return () => {
      socket.off('session:started', onChange);
      socket.off('session:paused', onChange);
      socket.off('session:resumed', onChange);
      socket.off('session:liquidated', onChange);
      socket.off('session:ended', onChange);
    };
  }, [socket, refresh]);

  return {
    ...DEFAULT_SESSION,
    ...session,
    refetchSession: refresh
  };
}
