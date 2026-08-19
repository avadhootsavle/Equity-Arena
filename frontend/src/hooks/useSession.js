import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../services/api';
import { useSocket } from '../context/SocketContext';

const DEFAULT_SESSION = {
  status: 'NOT_STARTED',
  formattedTime: '00:00:00',
  isTradingLocked: true,
  remainingSeconds: 0
};

export function useSession() {
  const { socket } = useSocket();
  const [session, setSession] = useState(DEFAULT_SESSION);

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch('/session');
      if (data) {
        setSession(data);
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 20000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (!socket) return;
    const onChange = () => refresh();

    socket.on('session:started', onChange);
    socket.on('session:liquidated', onChange);
    socket.on('session:ended', onChange);

    return () => {
      socket.off('session:started', onChange);
      socket.off('session:liquidated', onChange);
      socket.off('session:ended', onChange);
    };
  }, [socket, refresh]);

  return session || DEFAULT_SESSION;
}
