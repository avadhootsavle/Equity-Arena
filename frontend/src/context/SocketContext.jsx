import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, user, isAuthenticated, loading } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectFailed, setReconnectFailed] = useState(false);

  // Tracks the one socket instance whose events are allowed to drive state.
  // Without this, a torn-down instance's late 'disconnect' event can overwrite
  // the live instance's 'connect', pinning the UI to "Reconnecting to market...".
  const activeSocketRef = useRef(null);

  // Depend on the user id, not the user object: AuthContext replaces the user
  // object after /auth/me revalidation, which would otherwise rebuild the socket.
  const userId = user?.id ?? null;

  useEffect(() => {
    // Phase 45 Fix: ONLY connect socket AFTER auth check is fully finished (loading === false)
    // and user is verified authenticated with a valid token.
    if (loading || !isAuthenticated || !token || !userId) {
      if (activeSocketRef.current) {
        activeSocketRef.current.removeAllListeners();
        activeSocketRef.current.disconnect();
        activeSocketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const targetUrl =
      import.meta.env.VITE_API_URL ||
      (typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:5001`
        : '/');

    const socketInstance = io(targetUrl, {
      auth: { token },
      extraHeaders: {
        'ngrok-skip-browser-warning': '1'
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      transports: ['websocket', 'polling']
    });

    activeSocketRef.current = socketInstance;

    // Ignore events from any instance that is no longer the active one.
    const isStale = () => activeSocketRef.current !== socketInstance;

    socketInstance.on('connect', () => {
      if (isStale()) return;
      setIsConnected(true);
      setReconnectFailed(false);
    });

    socketInstance.on('disconnect', () => {
      if (isStale()) return;
      setIsConnected(false);
    });

    socketInstance.on('connect_error', () => {
      if (isStale()) return;
      setIsConnected(false);
    });

    const handleReconnectFailed = () => {
      if (isStale()) return;
      setReconnectFailed(true);
    };
    // 'reconnect_failed' is emitted by the Manager, not the Socket.
    socketInstance.io.on('reconnect_failed', handleReconnectFailed);

    // Handle auth:unauthorized on socket: close socket instance only, DO NOT trigger global auth reset or redirect
    socketInstance.on('auth:unauthorized', () => {
      socketInstance.disconnect();
      if (isStale()) return;
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      if (activeSocketRef.current === socketInstance) {
        activeSocketRef.current = null;
      }
      // Scoped off(): the Manager can be shared with other sockets on this URL,
      // so never removeAllListeners() on it.
      socketInstance.io.off('reconnect_failed', handleReconnectFailed);
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
    };
  }, [token, userId, isAuthenticated, loading]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, reconnectFailed }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
