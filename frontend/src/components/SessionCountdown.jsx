import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export function SessionCountdown({ onSessionUpdate }) {
  const { socket } = useSocket();
  const [session, setSession] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const fetchSession = useCallback(async () => {
    try {
      const data = await apiFetch('/session');
      setSession(data);
      setRemainingSeconds(data.remainingSeconds);
      if (onSessionUpdate) onSessionUpdate(data);
    } catch (err) {
      console.error('Failed to fetch session countdown:', err);
    }
  }, [onSessionUpdate]);

  useEffect(() => {
    fetchSession();

    // Re-sync with server every 20 seconds to prevent clock drift
    const syncInterval = setInterval(fetchSession, 20000);
    return () => clearInterval(syncInterval);
  }, [fetchSession]);

  // Client-side 1-second countdown tick
  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          fetchSession(); // Refetch on 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, fetchSession]);

  // Listen to WebSocket session events
  useEffect(() => {
    if (!socket) return;

    const handleSessionUpdate = () => fetchSession();
    const handleSessionLiquidated = () => fetchSession();
    const handleSessionEnded = () => fetchSession();

    socket.on('session:started', handleSessionUpdate);
    socket.on('session:liquidated', handleSessionLiquidated);
    socket.on('session:ended', handleSessionEnded);

    return () => {
      socket.off('session:started', handleSessionUpdate);
      socket.off('session:liquidated', handleSessionLiquidated);
      socket.off('session:ended', handleSessionEnded);
    };
  }, [socket, fetchSession]);

  if (!session) return null;

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isLiquidating = remainingSeconds <= 300 || session.isLiquidated;
  const isEnded = session.status === 'ENDED' || remainingSeconds === 0;
  const isWarning = remainingSeconds <= 1800 && !isLiquidating; // 30 minutes left

  return (
    <div
      className={`px-3 py-1.5 rounded-[4px] border font-mono text-xs font-bold flex items-center gap-2 transition-all ${
        isEnded
          ? 'bg-[#E8453C]/20 border-[#E8453C] text-[#E8453C]'
          : isLiquidating
          ? 'bg-[#E8453C]/20 border-[#E8453C] text-[#E8453C] animate-pulse'
          : isWarning
          ? 'bg-[#D4A017]/20 border-[#D4A017] text-[#D4A017] animate-pulse'
          : 'bg-[#D4A017]/10 border-[#D4A017]/40 text-[#D4A017]'
      }`}
    >
      {isEnded ? (
        <ShieldCheck className="w-4 h-4 text-[#E8453C]" />
      ) : isLiquidating ? (
        <AlertTriangle className="w-4 h-4 text-[#E8453C] animate-bounce" />
      ) : (
        <Clock className="w-4 h-4 text-[#D4A017]" />
      )}

      <div>
        <div className="text-[9px] uppercase font-mono tracking-wider opacity-90 leading-tight">
          {isEnded ? 'SESSION ENDED' : isLiquidating ? 'AUTO-LIQUIDATED' : 'SESSION TIME'}
        </div>
        <div className="text-xs font-black tracking-tight">
          {isEnded ? '00:00:00 (LOCKED)' : formattedTime}
        </div>
      </div>
    </div>
  );
}
