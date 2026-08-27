import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../services/api';
import { useSocket } from '../context/SocketContext';

/**
 * Single source of truth for the game session.
 *
 * Previously the TopBar's countdown widget owned this fetch, which meant the
 * clock had to stay mounted for any other panel to know the session state.
 */
export function useSession() {
  const { socket } = useSocket();
  const [session, setSession] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setSession(await apiFetch('/session'));
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

  return session;
}
