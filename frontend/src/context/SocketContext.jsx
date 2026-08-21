import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, user, isAuthenticated, loading } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectFailed, setReconnectFailed] = useState(false);

  useEffect(() => {
    // Phase 45 Fix: ONLY connect socket AFTER auth check is fully finished (loading === false)
    // and user is verified authenticated with a valid token.
    if (loading || !isAuthenticated || !token || !user) {
      if (socket) {
        console.log('[Socket] Cleaning up socket connection (User unauthenticated or auth loading).');
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const targetUrl =
      import.meta.env.VITE_API_URL ||
      (typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:5001`
        : '/');

    console.log(`[Socket] Initiating authenticated socket connection for ${user.email} (Role: ${user.role})...`);

    const socketInstance = io(targetUrl, {
      auth: { token },
      extraHeaders: {
        'ngrok-skip-browser-warning': '1'
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected cleanly to server, ID:', socketInstance.id);
      setIsConnected(true);
      setReconnectFailed(false);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected from server. Reason:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('[Socket] Connection attempt error:', err.message);
      setIsConnected(false);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('[Socket] Maximum reconnection attempts (5) reached.');
      setReconnectFailed(true);
    });

    // Handle auth:unauthorized on socket: close socket instance only, DO NOT trigger global auth reset or redirect
    socketInstance.on('auth:unauthorized', () => {
      console.warn('[Socket] Socket server sent auth:unauthorized. Closing socket connection only (NO global redirect).');
      socketInstance.disconnect();
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, user, isAuthenticated, loading]);

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
