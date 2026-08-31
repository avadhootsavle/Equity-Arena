import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../services/api';
import { GameClock, BreakCountdownTimer } from '../components/GameClock';
import { useSession } from '../hooks/useSession';
import { AdminTraderDetailModal } from '../components/AdminTraderDetailModal';
import { playNewsChime } from '../services/soundService';
import * as XLSX from 'xlsx';
import { 
  TrendingUp, TrendingDown, Shield, LogOut, Radio, Send, 
  Trophy, Search, RefreshCw, CheckCircle2, AlertCircle, Sparkles, SlidersHorizontal, Clock, Zap, Eye, Sun, Moon, RotateCcw, Bell, Users, UserPlus, Upload, Trash2, RotateCcw as ResetIcon, Check, X,
  ThumbsUp, ThumbsDown, Newspaper, PieChart, BarChart3, Filter, ArrowUpRight, ArrowDownRight, Layers, Activity,
  Play, Square, Coffee, Lock, ChevronRight, HelpCircle
} from 'lucide-react';

const fmtMoney = (n, d = 2) =>
  Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d
  });

export function AdminDashboard() {
  const adminSession = useSession();
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const { theme, toggleTheme } = useTheme();

  // Layout & Filter states
  const [newsTab, setNewsTab] = useState('POSITIVE'); // 'POSITIVE' | 'NEGATIVE'
  const [rightBottomTab, setRightBottomTab] = useState('LEADERBOARD'); // 'LEADERBOARD' | 'ACTIVITY' | 'PARTICIPANTS'
  const [stockSortMode, setStockSortMode] = useState('CHANGE'); // 'CHANGE' | 'ALPHA'
  const [searchQuery, setSearchQuery] = useState('');

  const [stocks, setStocks] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(true);
  
  const [customPercents, setCustomPercents] = useState({});
  const [adjustingStockId, setAdjustingStockId] = useState(null);
  const [confirmStockAdj, setConfirmStockAdj] = useState(null);
  const [stockFlashes, setStockFlashes] = useState({});
  const flashTimersRef = useRef(new Map());

  const [newsMessage, setNewsMessage] = useState('');
  const [customNewsStockId, setCustomNewsStockId] = useState('');
  const [customNewsDirection, setCustomNewsDirection] = useState('RISE'); // 'RISE' | 'FALL'
  const [customNewsPercent, setCustomNewsPercent] = useState('15');
  const [sendingNews, setSendingNews] = useState(false);

  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [usedTemplateIds, setUsedTemplateIds] = useState([]);
  const [recentlySentTplIds, setRecentlySentTplIds] = useState([]);
  const [inlineConfirmTplId, setInlineConfirmTplId] = useState(null);
  const [customNewsConfirm, setCustomNewsConfirm] = useState(false);
  const [delaySeconds, setDelaySeconds] = useState(60);
  const [triggeringTemplateId, setTriggeringTemplateId] = useState(null);

  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [liveTradeFeed, setLiveTradeFeed] = useState([]);

  /* Participants Roster State */
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');
  const [resetConfirmPartId, setResetConfirmPartId] = useState(null);
  const [removeConfirmPartId, setRemoveConfirmPartId] = useState(null);
  const [resettingPartId, setResettingPartId] = useState(null);
  const [removingPartId, setRemovingPartId] = useState(null);
  const [showResetAllModal, setShowResetAllModal] = useState(false);
  const [resettingAll, setResettingAll] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  
  const removeTimerRef = useRef(null);
  const resetTimerRef = useRef(null);

  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newPartEmail, setNewPartEmail] = useState('');
  const [newPartPhone, setNewPartPhone] = useState('');
  const [addingParticipant, setAddingParticipant] = useState(false);

  const [showUploadPreviewModal, setShowUploadPreviewModal] = useState(false);
  const [uploadPreviewRows, setUploadPreviewRows] = useState([]);
  const [uploadingRoster, setUploadingRoster] = useState(false);

  const fileInputRef = useRef(null);

  // Admin Trader Drill-Down Modal state
  const [selectedTraderId, setSelectedTraderId] = useState(null);
  const [isTraderModalOpen, setIsTraderModalOpen] = useState(false);

  const [toast, setToast] = useState(null);

  /* Break Modal State */
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState(10);
  const [breakNote, setBreakNote] = useState("☕ Refreshment Break — Grab snacks, water, and take a quick rest!");

  /* Session Configurator Modal State */
  const [showSessionConfigModal, setShowSessionConfigModal] = useState(false);
  const [sessionDurationMins, setSessionDurationMins] = useState(180);
  const [customDurationInput, setCustomDurationInput] = useState('');
  const [liquidationBufferMins, setLiquidationBufferMins] = useState(5);
  const [customBufferInput, setCustomBufferInput] = useState('');
  const [macroCycleIntervalMins, setMacroCycleIntervalMins] = useState(15);
  const [customMacroInput, setCustomMacroInput] = useState('');
  const [volatilityLevel, setVolatilityLevel] = useState('MEDIUM');
  const [volatilityCustomPercent, setVolatilityCustomPercent] = useState('');
  const [isStartingSession, setIsStartingSession] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  /* ---------------- Fetching Data ---------------- */
  const fetchStocks = useCallback(async () => {
    try {
      const data = await apiFetch('/stocks');
      if (Array.isArray(data)) {
        setStocks(data);
      }
    } catch (err) {
      console.error('Fetch stocks error:', err);
    } finally {
      setLoadingStocks(false);
    }
  }, []);

  const fetchNewsTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const data = await apiFetch('/admin/news-templates');
      const tpls = Array.isArray(data) ? data : (data?.templates || []);
      setTemplates(tpls);
      if (data?.usedTemplateIds && Array.isArray(data.usedTemplateIds)) {
        setUsedTemplateIds(data.usedTemplateIds);
      }
    } catch (err) {
      console.error('Fetch news templates error:', err);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  const fetchLeaderboard = useCallback(async (isInitial = false) => {
    if (isInitial) setLoadingLeaderboard(true);
    try {
      const data = await apiFetch('/admin/leaderboard');
      if (Array.isArray(data)) {
        setLeaderboard(data);
      }
    } catch (err) {
      console.error('Fetch leaderboard error:', err);
    } finally {
      if (isInitial) setLoadingLeaderboard(false);
    }
  }, []);

  const fetchParticipants = useCallback(async (isInitial = false) => {
    if (isInitial) setLoadingParticipants(true);
    try {
      let data;
      try {
        data = await apiFetch('/admin/participants');
      } catch (firstErr) {
        if (firstErr.status === 404) {
          data = await apiFetch('/api/admin/participants');
        } else {
          throw firstErr;
        }
      }
      if (Array.isArray(data)) {
        setParticipants(data);
      }
    } catch (err) {
      console.error('Fetch participants error:', err);
    } finally {
      if (isInitial) setLoadingParticipants(false);
    }
  }, []);

  useEffect(() => {
    fetchStocks();
    fetchNewsTemplates();
    fetchLeaderboard(true);
    fetchParticipants(true);
  }, [fetchStocks, fetchNewsTemplates, fetchLeaderboard, fetchParticipants]);

  useEffect(() => {
    if (rightBottomTab === 'PARTICIPANTS') {
      fetchParticipants();
    }
  }, [rightBottomTab, fetchParticipants]);

  /* ---------------- Socket Wiring ---------------- */
  useEffect(() => {
    if (!socket) return;

    const triggerFlash = (stockId, direction) => {
      if (!stockId || !direction) return;
      setStockFlashes((prev) => ({ ...prev, [stockId]: direction }));
      clearTimeout(flashTimersRef.current.get(stockId));
      flashTimersRef.current.set(
        stockId,
        setTimeout(() => {
          setStockFlashes((prev) => ({ ...prev, [stockId]: null }));
        }, 750)
      );
    };

    const handleStockUpdate = (payload) => {
      const diff = payload?.stock || payload;
      if (!diff) return;
      const targetId = diff.stockId || diff.id;
      if (!targetId) return;

      const newPrice = diff.newPrice ?? diff.currentPrice ?? diff.price;
      const percentChange = diff.percentChange;

      setStocks((prev) =>
        prev.map((s) => {
          if (s.id !== targetId) return s;
          if (newPrice !== undefined && newPrice !== s.currentPrice) {
            triggerFlash(targetId, newPrice > s.currentPrice ? 'up' : 'down');
          }
          return {
            ...s,
            currentPrice: newPrice !== undefined ? newPrice : s.currentPrice,
            percentChange: percentChange !== undefined ? percentChange : s.percentChange
          };
        })
      );
    };

    const handleBatchUpdate = (batchData) => {
      const updates = Array.isArray(batchData) ? batchData : batchData?.updates;
      if (!Array.isArray(updates) || updates.length === 0) return;

      const updateMap = new Map();
      updates.forEach((u) => {
        const id = u.stockId || u.id;
        if (id) updateMap.set(id, u);
      });

      setStocks((prev) =>
        prev.map((s) => {
          const u = updateMap.get(s.id);
          if (!u) return s;
          const newPrice = u.newPrice ?? u.currentPrice ?? u.price;
          if (newPrice !== undefined && newPrice !== s.currentPrice) {
            triggerFlash(s.id, newPrice > s.currentPrice ? 'up' : 'down');
          }
          return {
            ...s,
            currentPrice: newPrice !== undefined ? newPrice : s.currentPrice,
            percentChange: u.percentChange !== undefined ? u.percentChange : s.percentChange
          };
        })
      );
    };

    const handleTradeExecuted = (data) => {
      if (!data) return;
      const tradeItem = {
        id: Date.now() + Math.random(),
        traderId: data.userId || data.traderId,
        traderName: data.traderName || data.userName || 'Trader',
        symbol: data.symbol || data.stockSymbol || 'STK',
        quantity: data.quantity || data.qty || 1,
        price: data.price || data.executionPrice || 0,
        action: data.action || (data.type ? `${data.type} SHARES` : 'TRADE'),
        timestamp: data.timestamp || Date.now()
      };
      setLiveTradeFeed((prev) => [tradeItem, ...prev].slice(0, 30));
      fetchLeaderboard();
      fetchParticipants();
    };

    const handleActivityLog = (log) => {
      if (!log) return;
      setLiveTradeFeed((prev) => [log, ...prev].slice(0, 30));
      // Live activity (like trades, top-ups) automatically updates rankings and participant cash
      fetchLeaderboard();
      fetchParticipants();
    };

    const handleLeaderboardUpdate = (data) => {
      if (Array.isArray(data)) {
        setLeaderboard(data);
      }
      // Re-sync participants list silently when ranks shift
      fetchParticipants();
    };

    const handleSessionStarted = () => {
      adminSession.refetchSession();
      showToast('Tournament Session Started Live!', 'success');
      setShowSessionConfigModal(false);
      fetchLeaderboard();
      fetchParticipants();
    };

    const handleSessionEnded = () => {
      adminSession.refetchSession();
      showToast('Session Ended & Floor Locked.', 'warning');
      fetchLeaderboard();
      fetchParticipants();
    };

    const handleBreakStarted = () => {
      adminSession.refetchSession();
      showToast('Refreshment Break Active!', 'warning');
      setShowBreakModal(false);
    };

    const handleBreakEnded = () => {
      adminSession.refetchSession();
      showToast('Break Over — Trading Resumed!', 'success');
    };

    socket.on('stock:update', handleStockUpdate);
    socket.on('stocks:batch-update', handleBatchUpdate);
    socket.on('order:executed', handleTradeExecuted);
    socket.on('activity:log', handleActivityLog);
    socket.on('leaderboard:update', handleLeaderboardUpdate);
    socket.on('session:started', handleSessionStarted);
    socket.on('session:ended', handleSessionEnded);
    socket.on('break:started', handleBreakStarted);
    socket.on('break:ended', handleBreakEnded);
    socket.on('session:resumed', handleBreakEnded);

    return () => {
      socket.off('stock:update', handleStockUpdate);
      socket.off('stocks:batch-update', handleBatchUpdate);
      socket.off('order:executed', handleTradeExecuted);
      socket.off('activity:log', handleActivityLog);
      socket.off('leaderboard:update', handleLeaderboardUpdate);
      socket.off('session:started', handleSessionStarted);
      socket.off('session:ended', handleSessionEnded);
      socket.off('break:started', handleBreakStarted);
      socket.off('break:ended', handleBreakEnded);
      socket.off('session:resumed', handleBreakEnded);
    };
  }, [socket, adminSession, fetchLeaderboard, fetchParticipants]);

  /* ---------------- Auto-Polling Fallback ---------------- */
  // Guaranteed real-time sync every 3 seconds so the admin panel NEVER requires manual refresh
  useEffect(() => {
    const autoRefreshTimer = setInterval(() => {
      fetchLeaderboard();
      fetchParticipants();
    }, 3000);

    return () => clearInterval(autoRefreshTimer);
  }, [fetchLeaderboard, fetchParticipants]);

  /* ---------------- Session Handlers ---------------- */
  const handleStartSession = async () => {
    setIsStartingSession(true);
    try {
      const finalDuration = customDurationInput ? parseInt(customDurationInput, 10) : sessionDurationMins;
      const finalBuffer = customBufferInput ? parseInt(customBufferInput, 10) : liquidationBufferMins;
      const finalMacro = customMacroInput ? parseInt(customMacroInput, 10) : macroCycleIntervalMins;
      const finalVolatility = volatilityLevel === 'CUSTOM' ? parseFloat(volatilityCustomPercent) || 5.0 : volatilityLevel;

      await apiFetch('/admin/session/start', {
        method: 'POST',
        body: JSON.stringify({
          durationMinutes: finalDuration,
          liquidationBufferMinutes: finalBuffer,
          macroCycleIntervalMinutes: finalMacro,
          volatilityLevel: finalVolatility
        })
      });

      await adminSession.refetchSession();
      showToast('Session started successfully!', 'success');
      setShowSessionConfigModal(false);
    } catch (err) {
      showToast(err.message || 'Failed to start session', 'error');
    } finally {
      setIsStartingSession(false);
    }
  };

  const handlePauseSession = async () => {
    try {
      await apiFetch('/admin/session/pause', {
        method: 'POST',
        body: JSON.stringify({
          breakMinutes: breakMinutes,
          note: breakNote
        })
      });
      await adminSession.refetchSession();
      showToast('Trading paused for refreshment break.', 'warning');
      setShowBreakModal(false);
    } catch (err) {
      showToast(err.message || 'Failed to pause session', 'error');
    }
  };

  const handleResumeSession = async () => {
    try {
      await apiFetch('/admin/session/resume', { method: 'POST' });
      await adminSession.refetchSession();
      showToast('Trading floor unlocked!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to resume session', 'error');
    }
  };

  const handleEndSession = async () => {
    if (!window.confirm('Are you sure you want to end the session now? All trader positions will be auto-liquidated.')) return;
    try {
      await apiFetch('/admin/session/stop', { method: 'POST' });
      await adminSession.refetchSession();
      showToast('Session ended. Portfolio balances auto-liquidated to cash.', 'warning');
    } catch (err) {
      showToast(err.message || 'Failed to end session', 'error');
    }
  };

  /* ---------------- Stock Adjustment (Percentage Only) ---------------- */
  const executeStockAdjust = async (stockId, percentChange) => {
    setAdjustingStockId(stockId);
    try {
      const res = await apiFetch(`/admin/stocks/${stockId}/adjust`, {
        method: 'POST',
        body: JSON.stringify({ percent: percentChange, percentChange })
      });

      if (res && res.stock) {
        setStocks((prev) =>
          prev.map((s) => (s.id === stockId ? { ...s, ...res.stock, percentChange: res.percentChange ?? s.percentChange } : s))
        );
        showToast(
          `Adjusted ${res.stock.symbol} by ${percentChange > 0 ? '+' : ''}${percentChange}% (${fmtMoney(res.stock.currentPrice)} IC)`,
          'success'
        );
      }
      setConfirmStockAdj(null);
    } catch (err) {
      showToast(err.message || 'Stock price adjustment failed', 'error');
    } finally {
      setAdjustingStockId(null);
    }
  };

  const handleCustomApplyClick = (stockId) => {
    const raw = String(customPercents[stockId] || '').trim().replace('%', '');
    const val = parseFloat(raw);
    if (isNaN(val) || val === 0) {
      showToast('Enter a valid percentage (e.g. 15 or -10)', 'error');
      return;
    }
    setConfirmStockAdj({ stockId, percent: val });
  };

  /* ---------------- News Trigger Handlers ---------------- */
  const handleTriggerTemplate = async (templateId) => {
    setTriggeringTemplateId(templateId);
    try {
      const res = await apiFetch('/admin/news/trigger-template', {
        method: 'POST',
        body: JSON.stringify({
          templateId,
          delaySeconds: parseInt(delaySeconds, 10) || 60
        })
      });

      playNewsChime();
      showToast(res.message || 'News template broadcasted live!', 'success');

      if (!usedTemplateIds.includes(templateId)) {
        setUsedTemplateIds((prev) => [...prev, templateId]);
      }
      setRecentlySentTplIds((prev) => [...prev, templateId]);
      setTimeout(() => {
        setRecentlySentTplIds((prev) => prev.filter((id) => id !== templateId));
      }, 3000);

      setInlineConfirmTplId(null);
    } catch (err) {
      showToast(err.message || 'Failed to broadcast news template', 'error');
    } finally {
      setTriggeringTemplateId(null);
    }
  };

  const handleCustomNewsSend = async () => {
    if (!newsMessage.trim()) return;
    setSendingNews(true);
    try {
      const res = await apiFetch('/admin/news/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          message: newsMessage.trim(),
          stockId: customNewsStockId || null,
          direction: customNewsDirection,
          effectPercent: parseFloat(customNewsPercent) || 15,
          delaySeconds: 15
        })
      });

      playNewsChime();
      showToast(res.message || 'Custom market news broadcasted live!', 'success');
      setNewsMessage('');
      setCustomNewsStockId('');
      setCustomNewsConfirm(false);
    } catch (err) {
      showToast(err.message || 'Failed to broadcast custom news', 'error');
    } finally {
      setSendingNews(false);
    }
  };

  /* ---------------- Roster Management Handlers ---------------- */
  const parseRowData = (row, index) => {
    if (!row || typeof row !== 'object') return null;

    let rawName = '';
    let rawEmail = '';
    let rawPhone = '';

    for (const [key, val] of Object.entries(row)) {
      if (val === undefined || val === null) continue;
      const k = String(key).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const v = String(val).trim();

      if (!rawName && (k.includes('fullname') || k.includes('studentname') || k.includes('name') || k.includes('participant') || k.includes('trader') || k.includes('user'))) {
        rawName = v;
      } else if (!rawEmail && (k.includes('emailaddress') || k.includes('email') || k.includes('mail'))) {
        rawEmail = v;
      } else if (!rawPhone && (k.includes('phonenumber') || k.includes('mobilenumber') || k.includes('phone') || k.includes('mobile') || k.includes('contact') || k.includes('cell') || k.includes('tel'))) {
        rawPhone = v;
      }
    }

    const allValues = Object.values(row).map((v) => String(v || '').trim()).filter(Boolean);
    if (!rawEmail) {
      const emailCandidate = allValues.find((v) => v.includes('@'));
      if (emailCandidate) rawEmail = emailCandidate;
    }
    if (!rawPhone) {
      const phoneCandidate = allValues.find((v) => {
        const digits = v.replace(/\D/g, '');
        return digits.length >= 7 && digits.length <= 15;
      });
      if (phoneCandidate) rawPhone = phoneCandidate;
    }
    if (!rawName && allValues.length > 0) {
      rawName = allValues.find((v) => v !== rawEmail && v !== rawPhone) || allValues[0];
    }

    const cleanEmail = rawEmail.trim().toLowerCase();
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const cleanName = rawName.trim();

    const missingFields = [];
    if (!cleanName) missingFields.push('Name');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) missingFields.push('Email');
    if (!cleanPhone || cleanPhone.length < 7) missingFields.push('Phone');

    return {
      rowIndex: index + 1,
      name: cleanName || 'Missing Name',
      email: cleanEmail || 'Missing Email',
      phone: cleanPhone || 'Missing Phone',
      missingFields
    };
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const rawData = XLSX.utils.sheet_to_json(wb.Sheets[wsName]);

        if (!Array.isArray(rawData) || rawData.length === 0) {
          showToast('Selected file contains no participant rows.', 'error');
          return;
        }

        const cleanRows = rawData.map((row, idx) => parseRowData(row, idx)).filter(Boolean);

        if (cleanRows.length === 0) {
          showToast('Could not extract participant rows from file.', 'error');
          return;
        }

        setUploadPreviewRows(cleanRows);
        setShowUploadPreviewModal(true);
      } catch (err) {
        showToast('Error reading Excel/CSV file: ' + err.message, 'error');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null; // Reset input
  };

  const handleConfirmImport = async () => {
    const validRows = uploadPreviewRows.filter((r) => r.missingFields.length === 0);
    if (!validRows || validRows.length === 0) {
      showToast('No valid participant rows to import.', 'error');
      return;
    }
    setUploadingRoster(true);
    try {
      let res;
      try {
        res = await apiFetch('/admin/participants/upload', {
          method: 'POST',
          body: JSON.stringify({ rows: validRows })
        });
      } catch (firstErr) {
        if (firstErr.status === 404) {
          res = await apiFetch('/api/admin/participants/upload', {
            method: 'POST',
            body: JSON.stringify({ rows: validRows })
          });
        } else {
          throw firstErr;
        }
      }

      const totalFound = uploadPreviewRows.length;
      const createdCount = res.createdCount || 0;
      const skippedEmailCount = res.skippedEmailCount || 0;
      const skippedDataCount = (totalFound - validRows.length) + (res.skippedDataCount || 0);

      const finalMsg = res.message || `Import Result: ${createdCount} accounts created, ${skippedEmailCount} skipped because email already exists, ${skippedDataCount} skipped because of missing data.`;

      showToast(finalMsg, 'success');
      setShowUploadPreviewModal(false);
      setUploadPreviewRows([]);
      fetchParticipants();
      fetchLeaderboard();
    } catch (err) {
      showToast(err.message || 'Failed to import roster', 'error');
    } finally {
      setUploadingRoster(false);
    }
  };

  const handleAddSingleParticipant = async (e) => {
    e.preventDefault();
    const cleanName = newPartName.trim();
    const cleanEmail = newPartEmail.trim().toLowerCase();
    const cleanPhone = newPartPhone.trim().replace(/\D/g, '');

    if (!cleanName) {
      showToast('Full Name is required', 'error');
      return;
    }

    if (!cleanEmail) {
      showToast('Email Address is required', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      showToast('Please enter a valid email address (e.g. name@example.com)', 'error');
      return;
    }

    if (!cleanPhone) {
      showToast('Phone Number is required', 'error');
      return;
    }

    if (cleanPhone.length < 7) {
      showToast('Please enter a valid phone number (at least 7 digits)', 'error');
      return;
    }

    setAddingParticipant(true);
    try {
      let res;
      try {
        res = await apiFetch('/admin/participants/add', {
          method: 'POST',
          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone
          })
        });
      } catch (firstErr) {
        if (firstErr.status === 404) {
          res = await apiFetch('/api/admin/participants/add', {
            method: 'POST',
            body: JSON.stringify({
              name: cleanName,
              email: cleanEmail,
              phone: cleanPhone
            })
          });
        } else {
          throw firstErr;
        }
      }

      showToast(res.message || `Participant ${cleanName} added successfully!`, 'success');
      setShowAddParticipantModal(false);
      setNewPartName('');
      setNewPartEmail('');
      setNewPartPhone('');
      fetchParticipants();
      fetchLeaderboard();
    } catch (err) {
      showToast(err.message || 'Failed to add participant', 'error');
    } finally {
      setAddingParticipant(false);
    }
  };

  /* Inline 2-Step Confirmation & Auto-Cancel Handlers */
  const handleRemoveClick = (p) => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    if (removeTimerRef.current) clearTimeout(removeTimerRef.current);
    setResetConfirmPartId(null);
    setRemoveConfirmPartId(p.id);

    removeTimerRef.current = setTimeout(() => {
      setRemoveConfirmPartId(null);
    }, 10000);
  };

  const handleCancelRemove = () => {
    if (removeTimerRef.current) clearTimeout(removeTimerRef.current);
    setRemoveConfirmPartId(null);
  };

  const handleConfirmRemove = async (p) => {
    if (removeTimerRef.current) clearTimeout(removeTimerRef.current);
    setRemovingPartId(p.id);
    try {
      let res;
      try {
        res = await apiFetch(`/admin/participants/${p.id}`, { method: 'DELETE' });
      } catch (err) {
        if (err.status === 404) {
          res = await apiFetch(`/api/admin/participants/${p.id}`, { method: 'DELETE' });
        } else {
          throw err;
        }
      }

      showToast(res.message || `Participant ${p.name} removed successfully`, 'warning');
      setRemoveConfirmPartId(null);
      fetchParticipants();
      fetchLeaderboard();
    } catch (err) {
      showToast(err.message || 'Failed to remove participant', 'error');
    } finally {
      setRemovingPartId(null);
    }
  };

  const handleResetClick = (p) => {
    if (removeTimerRef.current) clearTimeout(removeTimerRef.current);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setRemoveConfirmPartId(null);
    setResetConfirmPartId(p.id);

    resetTimerRef.current = setTimeout(() => {
      setResetConfirmPartId(null);
    }, 10000);
  };

  const handleCancelReset = () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setResetConfirmPartId(null);
  };

  const handleConfirmReset = async (p) => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setResettingPartId(p.id);
    try {
      let res;
      try {
        res = await apiFetch(`/admin/participants/${p.id}/reset`, { method: 'POST' });
      } catch (err) {
        if (err.status === 404) {
          res = await apiFetch(`/api/admin/participants/${p.id}/reset`, { method: 'POST' });
        } else {
          throw err;
        }
      }

      showToast(res.message || `Reset ${p.name} to 20,000 IC and cleared all trades and holdings.`, 'success');
      setResetConfirmPartId(null);
      fetchParticipants();
      fetchLeaderboard();
    } catch (err) {
      showToast(err.message || 'Failed to reset participant', 'error');
    } finally {
      setResettingPartId(null);
    }
  };

  const handleResetAllParticipants = async () => {
    setResettingAll(true);
    try {
      let res;
      try {
        res = await apiFetch('/admin/participants/reset-all', { method: 'POST' });
      } catch (err) {
        if (err.status === 404) {
          res = await apiFetch('/api/admin/participants/reset-all', { method: 'POST' });
        } else {
          throw err;
        }
      }

      showToast(res.message || 'Reset wallet & portfolio for all participants to 20,000 IC!', 'warning');
      setShowResetAllModal(false);
      fetchParticipants();
      fetchLeaderboard();
    } catch (err) {
      showToast(err.message || 'Failed to reset all participants', 'error');
    } finally {
      setResettingAll(false);
    }
  };

  const handleDeleteAllParticipants = async () => {
    setDeletingAll(true);
    try {
      let res;
      try {
        res = await apiFetch('/admin/participants/delete-all', { method: 'POST' });
      } catch (err) {
        if (err.status === 404) {
          res = await apiFetch('/api/admin/participants/delete-all', { method: 'POST' });
        } else {
          throw err;
        }
      }

      showToast(res.message || 'Deleted all participant accounts from roster.', 'warning');
      setShowDeleteAllModal(false);
      fetchParticipants();
      fetchLeaderboard();
    } catch (err) {
      showToast(err.message || 'Failed to delete all participants', 'error');
    } finally {
      setDeletingAll(false);
    }
  };

  /* ---------------- Open Drill-Down Modal ---------------- */
  const handleOpenTraderModal = (traderId) => {
    setSelectedTraderId(traderId);
    setIsTraderModalOpen(true);
  };

  /* ---------------- Filtered & Sorted Stocks ---------------- */
  const filteredAndSortedStocks = useMemo(() => {
    let result = [...stocks];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          (s.symbol || '').toLowerCase().includes(q) ||
          (s.name || '').toLowerCase().includes(q) ||
          (s.sector || '').toLowerCase().includes(q)
      );
    }

    if (stockSortMode === 'CHANGE') {
      result.sort((a, b) => Math.abs(b.percentChange || 0) - Math.abs(a.percentChange || 0));
    } else if (stockSortMode === 'ALPHA') {
      result.sort((a, b) => a.symbol.localeCompare(b.symbol));
    }

    return result;
  }, [stocks, searchQuery, stockSortMode]);

  /* ---------------- Filtered Participants ---------------- */
  const filteredParticipants = useMemo(() => {
    if (!participantSearch.trim()) return participants;
    const q = participantSearch.toLowerCase().trim();
    return participants.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.phone && p.phone.includes(q))
    );
  }, [participants, participantSearch]);

  /* ---------------- Categorized Templates ---------------- */
  const positiveTemplates = useMemo(
    () => templates.filter((t) => {
      if (t.type === 'POSITIVE') return true;
      if (t.type === 'NEGATIVE') return false;
      const eff = t.targetStocks && t.targetStocks[0] ? t.targetStocks[0].effectPercent : t.effectPercent;
      return (eff || 0) >= 0;
    }),
    [templates]
  );

  const negativeTemplates = useMemo(
    () => templates.filter((t) => {
      if (t.type === 'NEGATIVE') return true;
      if (t.type === 'POSITIVE') return false;
      const eff = t.targetStocks && t.targetStocks[0] ? t.targetStocks[0].effectPercent : t.effectPercent;
      return (eff || 0) < 0;
    }),
    [templates]
  );

  const activeTemplates = newsTab === 'POSITIVE' ? positiveTemplates : negativeTemplates;

  return (
    <div className="min-h-screen max-h-screen h-screen flex flex-col bg-[#0F1117] text-[#F0F2FF] overflow-hidden font-sans selection:bg-[#F0B429] selection:text-black">
      
      {/* Toast Alert Banner */}
      {toast && (
        <div
          className={`fixed top-16 right-4 z-50 px-4 py-2.5 rounded-lg border font-mono text-xs shadow-2xl flex items-center gap-2 animate-bounce-subtle ${
            toast.type === 'error'
              ? 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444]'
              : toast.type === 'warning'
              ? 'bg-[#F0B429]/20 border-[#F0B429] text-[#F0B429]'
              : 'bg-[#22C55E]/20 border-[#22C55E] text-[#22C55E]'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Hidden File Input for Excel/CSV Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* ==================================================================== */}
      {/* FIXED TOP BAR — Always visible, never scrolls away                    */}
      {/* ==================================================================== */}
      <header className="h-[54px] bg-[#1A1D27] border-b border-[#2D3142] px-4 sm:px-6 flex items-center justify-between z-30 shrink-0 font-mono text-xs select-none">
        {/* Left: Logo + Live Status + Live Clock */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/vite.svg" alt="Equity Arena Logo" className="w-6 h-6 rounded-md shrink-0" />
            <span className="font-bold text-white uppercase tracking-wider text-xs">
              EQUITY ARENA ADMIN
            </span>
          </div>

          <span className="text-[#2D3142]">|</span>

          {/* Session Timer & Status */}
          {adminSession.status === 'ACTIVE' && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-ping" />
                <span>Live</span>
              </div>
              <GameClock sessionData={adminSession} size="sm" />
            </div>
          )}

          {(adminSession.status === 'PAUSED' || adminSession.status === 'ON_BREAK' || adminSession.isPaused) && (
            <div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl shadow-sm">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                <Coffee className="w-3.5 h-3.5 animate-bounce" />
                <span>Break Ends:</span>
              </div>
              <BreakCountdownTimer sessionData={adminSession} size="sm" />
            </div>
          )}

          {(adminSession.status !== 'ACTIVE' && adminSession.status !== 'ON_BREAK' && adminSession.status !== 'PAUSED' && !adminSession.isPaused) && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px] font-bold uppercase">
                {adminSession.status === 'ENDED' ? 'Session Ended' : 'Session Ready'}
              </span>
              <button
                type="button"
                onClick={() => setShowSessionConfigModal(true)}
                className="px-3 py-1 rounded bg-[#F0B429] hover:bg-[#d9a120] text-black font-extrabold text-xs uppercase transition-all shadow-md cursor-pointer animate-pulse-subtle flex items-center gap-1"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>START SESSION</span>
              </button>
            </div>
          )}

          <span className="hidden md:inline text-[#2D3142]">|</span>

          {/* Settings Summary */}
          {adminSession.status !== 'IDLE' && (
            <div className="hidden xl:flex items-center gap-3 text-[11px] text-[#7B82A0]">
              <span>Auto-liq: <strong className="text-white">{adminSession.liquidationBufferMinutes || 5}m</strong></span>
              <span>Macro: <strong className="text-white">{adminSession.macroCycleIntervalMinutes || 15}m</strong></span>
              <span>Volatility: <strong className="text-[#F0B429] uppercase">{adminSession.volatilityLevel || 'MEDIUM'}</strong></span>
            </div>
          )}
        </div>

        {/* Right: Controls & Logout */}
        <div className="flex items-center gap-2.5">
          {adminSession.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => setShowBreakModal(true)}
              className="px-3 py-1.5 rounded-lg bg-[#F0B429]/15 border border-[#F0B429]/40 text-[#F0B429] hover:bg-[#F0B429]/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Pause trading and start refreshment break"
            >
              <span>⏸ PAUSE FOR BREAK</span>
            </button>
          )}

          {(adminSession.status === 'ON_BREAK' || adminSession.status === 'PAUSED' || adminSession.isPaused) && (
            <button
              type="button"
              onClick={handleResumeSession}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.35)] animate-pulse"
              title="Immediately stop break countdown and unlock trading floor"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>STOP TIMER & RESUME GAME</span>
            </button>
          )}

          {(adminSession.status === 'ACTIVE' || adminSession.status === 'ON_BREAK' || adminSession.status === 'PAUSED' || adminSession.isPaused) && (
            <button
              type="button"
              onClick={handleEndSession}
              className="px-3 py-1.5 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] hover:bg-[#EF4444]/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>■ END</span>
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-[#0F1117] border border-[#2D3142] text-[#7B82A0] hover:text-white cursor-pointer"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg bg-[#0F1117] border border-[#2D3142] text-[#7B82A0] hover:text-[#EF4444] cursor-pointer"
            title="Log out admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Prominent Break Active Intermission Banner with Countdown and Resume Button */}
      {(adminSession.status === 'ON_BREAK' || adminSession.status === 'PAUSED' || adminSession.isPaused) && (
        <div className="bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-amber-500/20 border-b border-amber-500/40 px-6 py-3 flex flex-wrap items-center justify-between gap-4 animate-fadeIn shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Coffee className="w-5 h-5 text-amber-400 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white tracking-wide uppercase">
                  Market On Refreshment Break
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 text-[10px] font-mono font-bold uppercase">
                  Traders Locked
                </span>
              </div>
              <p className="text-xs text-amber-300/80 font-mono">
                {adminSession.breakNote || 'Traders are on break. Live price drift and trades are paused.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#0D1117] border border-amber-500/40 px-3.5 py-1.5 rounded-xl shadow-inner">
              <span className="text-xs font-mono font-bold text-amber-400/80 uppercase tracking-widest">
                Break Ends In:
              </span>
              <BreakCountdownTimer sessionData={adminSession} size="sm" />
            </div>

            <button
              type="button"
              onClick={handleResumeSession}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>STOP TIMER & RESUME GAME</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TWO-COLUMN BODY — Fits viewport height without main page scrolling    */}
      {/* ==================================================================== */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden h-[calc(100vh-54px)]">
        
        {/* ------------------------------------------------------------------ */}
        {/* LEFT COLUMN (45% Width / lg:col-span-5) — SEND NEWS                */}
        {/* ------------------------------------------------------------------ */}
        <section className="lg:col-span-5 bg-[#1A1D27] border border-[#2D3142] rounded-xl p-3.5 shadow-lg flex flex-col h-full overflow-hidden border-r border-[#2D3142]/80">
          
          {/* Header & Positive / Negative Toggle Tabs */}
          <div className="flex items-center justify-between border-b border-[#2D3142] pb-2.5 mb-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#F0B429]" />
              <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-white">
                SEND NEWS
              </span>
            </div>

            {/* POSITIVE / NEGATIVE Toggle Buttons */}
            <div className="flex items-center gap-1.5 bg-[#0F1117] p-1 rounded-lg border border-[#2D3142]">
              <button
                type="button"
                onClick={() => setNewsTab('POSITIVE')}
                className={`px-3 py-1 rounded-md font-mono text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  newsTab === 'POSITIVE'
                    ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40 shadow-sm'
                    : 'text-[#7B82A0] hover:text-white'
                }`}
              >
                <ThumbsUp className="w-3 h-3" />
                <span>POSITIVE ({positiveTemplates.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setNewsTab('NEGATIVE')}
                className={`px-3 py-1 rounded-md font-mono text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  newsTab === 'NEGATIVE'
                    ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 shadow-sm'
                    : 'text-[#7B82A0] hover:text-white'
                }`}
              >
                <ThumbsDown className="w-3 h-3" />
                <span>NEGATIVE ({negativeTemplates.length})</span>
              </button>
            </div>
          </div>

          {/* Scrollable Templates List (Independent Container) */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 min-h-0">
            {loadingTemplates ? (
              <div className="py-16 text-center text-[#7B82A0] text-xs font-mono">Loading news templates...</div>
            ) : activeTemplates.length === 0 ? (
              <div className="py-16 text-center text-[#7B82A0] text-xs font-mono italic">No templates found in this category.</div>
            ) : (
              activeTemplates.map((t) => {
                const isRecentlySent = recentlySentTplIds.includes(t.id);
                const isUsed = usedTemplateIds.includes(t.id);
                const isConfirming = inlineConfirmTplId === t.id;
                const targets = t.targetStocks && t.targetStocks.length > 0
                  ? t.targetStocks
                  : [{ stockName: t.sector, symbol: '', effectPercent: t.effectPercent }];

                return (
                  <div
                    key={t.id}
                    className={`p-2.5 rounded-lg border transition-all font-mono text-xs ${
                      isConfirming
                        ? 'bg-[#0F1117] border-[#F0B429]/60 shadow-md space-y-2'
                        : isRecentlySent
                        ? 'bg-[#22C55E]/10 border-[#22C55E]/40 text-[#22C55E]'
                        : isUsed
                        ? 'bg-[#0F1117]/60 border-[#2D3142]/60 opacity-50'
                        : 'bg-[#0F1117] border-[#2D3142] hover:bg-[#161B27] hover:border-[#F0B429]/40'
                    }`}
                  >
                    {/* Normal State: Headline + Affected Stocks Badges + SEND Button */}
                    {!isConfirming && !isRecentlySent && (
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <p
                            className={`text-[12.5px] font-sans font-medium leading-snug line-clamp-2 ${
                              isUsed ? 'line-through text-[#7B82A0]' : 'text-[#F0F2FF]'
                            }`}
                            title={t.headline}
                          >
                            {t.headline}
                          </p>

                          {/* Upfront Target Stocks & Impact Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-[#7B82A0] uppercase font-mono font-bold">Affects:</span>
                            {targets.map((tgt, idx) => {
                              const pctVal = tgt.effectPercent !== undefined ? tgt.effectPercent : t.effectPercent;
                              const isUp = (pctVal || 0) >= 0;
                              return (
                                <span
                                  key={idx}
                                  className={`text-[10.5px] font-mono font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 shadow-xs ${
                                    isUp
                                      ? 'bg-[#22C55E]/15 border-[#22C55E]/40 text-[#22C55E]'
                                      : 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]'
                                  }`}
                                >
                                  <span>{tgt.symbol || tgt.stockName}</span>
                                  <span>{isUp ? `+${pctVal}%` : `${pctVal}%`}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setInlineConfirmTplId(t.id)}
                          className="h-[30px] px-3.5 bg-[#F0B429]/15 border border-[#F0B429]/40 text-[#F0B429] hover:bg-[#F0B429]/30 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer shadow-xs shrink-0 flex items-center justify-center gap-1 mt-0.5"
                        >
                          <Send className="w-3 h-3" />
                          <span>SEND</span>
                        </button>
                      </div>
                    )}

                    {/* Headline when confirming */}
                    {isConfirming && (
                      <p className="text-[13px] font-sans font-bold leading-snug text-[#F0F2FF]" title={t.headline}>
                        {t.headline}
                      </p>
                    )}

                    {/* Line 2 & 3 when confirming (Expanded State) */}
                    {isConfirming && (
                      <div className="pt-2 border-t border-[#2D3142] space-y-2 text-xs font-mono animate-fadeIn">
                        {/* Affected Target Stocks List */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[#7B82A0] text-[11px] font-bold">→ Affects:</span>
                          {targets.map((tgt, idx) => {
                            const pctVal = tgt.effectPercent !== undefined ? tgt.effectPercent : t.effectPercent;
                            const isUp = (pctVal || 0) >= 0;
                            return (
                              <span
                                key={idx}
                                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                                  isUp
                                    ? 'bg-[#22C55E]/15 border-[#22C55E]/30 text-[#22C55E]'
                                    : 'bg-[#EF4444]/15 border-[#EF4444]/30 text-[#EF4444]'
                                }`}
                              >
                                {tgt.stockName || tgt.symbol} {isUp ? '▲+' : '▼'}{pctVal}%
                              </span>
                            );
                          })}
                        </div>

                        {/* Delay + Confirm Send + Cancel */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#2D3142]/60">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-[#7B82A0]">Delay:</span>
                            <input
                              type="number"
                              value={delaySeconds}
                              onChange={(e) => setDelaySeconds(parseInt(e.target.value, 10) || 0)}
                              className="w-14 h-7 bg-[#1A1D27] border border-[#2D3142] text-center rounded text-xs text-white focus:outline-none focus:border-[#F0B429]"
                            />
                            <span className="text-[#7B82A0]">sec</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={triggeringTemplateId === t.id}
                              onClick={() => handleTriggerTemplate(t.id)}
                              className="h-7 px-3.5 bg-[#F0B429] hover:bg-[#d9a120] text-black font-extrabold text-xs rounded-lg uppercase transition-all cursor-pointer shadow-sm"
                            >
                              {triggeringTemplateId === t.id ? 'SENDING...' : 'CONFIRM SEND'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineConfirmTplId(null)}
                              className="h-7 px-2.5 bg-[#2D3142] text-[#7B82A0] hover:text-white font-bold text-xs rounded-lg cursor-pointer"
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Brief "✓ Sent" Feedback banner */}
                    {isRecentlySent && (
                      <div className="flex items-center justify-between text-xs font-mono font-bold py-1 px-2">
                        <span>✓ Sent to traders successfully!</span>
                        <span className="text-[10px] opacity-75">Delay: {delaySeconds}s</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Compact Custom Breaking News Input Area (Pinned at Bottom) */}
          <div className="pt-2.5 mt-2 border-t border-[#2D3142] space-y-1.5 font-mono shrink-0">
            <div className="text-[10px] font-extrabold text-[#F0B429] uppercase tracking-wider flex items-center justify-between">
              <span>CUSTOM BREAKING NEWS</span>
              <span className="text-[9px] text-[#7B82A0] font-normal">Broadcasts to all traders</span>
            </div>
            <textarea
              rows={2}
              placeholder="Write custom market announcement..."
              value={newsMessage}
              onChange={(e) => setNewsMessage(e.target.value)}
              className="w-full bg-[#0F1117] border border-[#2D3142] rounded-lg p-2 text-xs text-white placeholder-[#7B82A0] focus:outline-none focus:border-[#F0B429] resize-none font-sans"
            />

            {/* Algorithmic Stock Impact Target Selector */}
            <div className="bg-[#0F1117] border border-[#2D3142] rounded-lg p-2 space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-[10.5px] text-[#7B82A0]">
                <span className="font-bold text-white uppercase">AFFECTED STOCK (ALGORITHM):</span>
                <span>Optional algorithmic steer</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 items-center">
                {/* Stock Dropdown (6 cols) */}
                <select
                  value={customNewsStockId}
                  onChange={(e) => setCustomNewsStockId(e.target.value)}
                  className="sm:col-span-6 h-7 bg-[#1A1D27] border border-[#2D3142] rounded px-2 text-xs text-white focus:outline-none focus:border-[#F0B429] cursor-pointer"
                >
                  <option value="">No specific stock (General news)</option>
                  {stocks.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.symbol} — {s.name} ({fmtMoney(s.currentPrice)} IC)
                    </option>
                  ))}
                </select>

                {/* Direction Toggle: RISE vs FALL (4 cols) */}
                <div className="sm:col-span-4 flex items-center gap-1 bg-[#1A1D27] p-0.5 rounded border border-[#2D3142]">
                  <button
                    type="button"
                    disabled={!customNewsStockId}
                    onClick={() => setCustomNewsDirection('RISE')}
                    className={`flex-1 py-1 rounded text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                      customNewsDirection === 'RISE' && customNewsStockId
                        ? 'bg-[#22C55E] text-black shadow-xs'
                        : 'text-[#7B82A0] hover:text-[#22C55E]'
                    } disabled:opacity-40`}
                  >
                    ▲ RISE
                  </button>
                  <button
                    type="button"
                    disabled={!customNewsStockId}
                    onClick={() => setCustomNewsDirection('FALL')}
                    className={`flex-1 py-1 rounded text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                      customNewsDirection === 'FALL' && customNewsStockId
                        ? 'bg-[#EF4444] text-white shadow-xs'
                        : 'text-[#7B82A0] hover:text-[#EF4444]'
                    } disabled:opacity-40`}
                  >
                    ▼ FALL
                  </button>
                </div>

                {/* % Impact (2 cols) */}
                <div className="sm:col-span-2 flex items-center gap-1">
                  <input
                    type="number"
                    disabled={!customNewsStockId}
                    min="1"
                    max="100"
                    placeholder="15%"
                    value={customNewsPercent}
                    onChange={(e) => setCustomNewsPercent(e.target.value)}
                    className="w-full h-7 bg-[#1A1D27] border border-[#2D3142] rounded text-center text-xs text-white focus:outline-none focus:border-[#F0B429] disabled:opacity-40 font-bold"
                  />
                </div>
              </div>
            </div>

            {!customNewsConfirm ? (
              <button
                type="button"
                disabled={sendingNews || !newsMessage.trim()}
                onClick={() => setCustomNewsConfirm(true)}
                className="w-full py-2 bg-[#F0B429] text-black font-extrabold text-xs rounded-lg uppercase tracking-wider hover:bg-[#d9a120] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {customNewsStockId
                  ? `BROADCAST NEWS & STEER ${stocks.find((s) => s.id === customNewsStockId)?.symbol || 'STOCK'} ${customNewsDirection} (+${customNewsPercent}%)`
                  : 'BROADCAST CUSTOM NEWS'}
              </button>
            ) : (
              <div className="flex items-center gap-2 animate-fadeIn">
                <button
                  type="button"
                  disabled={sendingNews}
                  onClick={handleCustomNewsSend}
                  className="flex-1 py-1.5 bg-[#22C55E] text-black font-bold text-xs rounded-lg uppercase tracking-wider hover:bg-[#1eb053] cursor-pointer"
                >
                  CONFIRM BROADCAST
                </button>
                <button
                  type="button"
                  onClick={() => setCustomNewsConfirm(false)}
                  className="px-3 py-1.5 bg-[#2D3142] text-[#7B82A0] hover:text-white font-bold text-xs rounded-lg cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* RIGHT COLUMN (55% Width / lg:col-span-7) — STOCKS & LEADERBOARD    */}
        {/* ------------------------------------------------------------------ */}
        <section className="lg:col-span-7 flex flex-col gap-4 h-full overflow-hidden">
          
          {/* RIGHT TOP (60% Height) — STOCKS LIST & CONTROLS */}
          <div className="h-[60%] bg-[#1A1D27] border border-[#2D3142] rounded-xl p-3.5 shadow-lg flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#2D3142] pb-2.5 mb-2 shrink-0 font-mono text-xs">
              <div className="flex items-center gap-3">
                <span className="font-extrabold uppercase tracking-wider text-white">
                  STOCKS ({stocks.length})
                </span>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2 top-1.5 text-[#7B82A0]" />
                  <input
                    type="text"
                    placeholder="Filter stocks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-7 bg-[#0F1117] border border-[#2D3142] rounded-lg pl-7 pr-2 text-xs text-white placeholder-[#7B82A0] focus:outline-none focus:border-[#F0B429] w-36 sm:w-48"
                  />
                </div>
              </div>

              {/* Sort Toggle */}
              <div className="flex items-center gap-1 bg-[#0F1117] border border-[#2D3142] rounded-lg p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setStockSortMode('CHANGE')}
                  className={`px-2 py-1 rounded-md font-mono font-bold transition-all cursor-pointer ${
                    stockSortMode === 'CHANGE' ? 'bg-[#F0B429] text-black shadow-sm' : 'text-[#7B82A0] hover:text-white'
                  }`}
                >
                  % Change ▼
                </button>
                <button
                  type="button"
                  onClick={() => setStockSortMode('ALPHA')}
                  className={`px-2 py-1 rounded-md font-mono font-bold transition-all cursor-pointer ${
                    stockSortMode === 'ALPHA' ? 'bg-[#F0B429] text-black shadow-sm' : 'text-[#7B82A0] hover:text-white'
                  }`}
                >
                  A-Z
                </button>
              </div>
            </div>

            {/* Scrollable Compact Stock Rows with Subtle Hover Highlight */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 min-h-0 font-mono">
              {loadingStocks ? (
                <div className="py-12 text-center text-[#7B82A0] text-xs">Loading market stocks...</div>
              ) : filteredAndSortedStocks.length === 0 ? (
                <div className="py-12 text-center text-[#7B82A0] text-xs italic">No stocks matching search.</div>
              ) : (
                filteredAndSortedStocks.map((s) => {
                  const isPos = (s.percentChange || 0) >= 0;
                  const isAdjusting = adjustingStockId === s.id;
                  const isConfirmingCustom = confirmStockAdj?.stockId === s.id;

                  return (
                    <div
                      key={s.id}
                      className="p-2 bg-[#0F1117] border border-[#2D3142] rounded-lg hover:bg-[#181C28] hover:border-[#F0B429]/40 transition-all flex items-center justify-between text-xs gap-2 shadow-xs"
                    >
                      {/* Symbol & Name */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-extrabold text-white text-xs shrink-0">{s.symbol}</span>
                        <span className="text-[#7B82A0] text-[11px] truncate hidden sm:inline">{s.name}</span>
                      </div>

                      {/* Current Price & % Change */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-bold transition-all duration-300 px-1 py-0.5 rounded font-mono ${
                            stockFlashes[s.id] === 'up'
                              ? 'bg-[#22C55E]/25 text-[#22C55E] ring-1 ring-[#22C55E]/50'
                              : stockFlashes[s.id] === 'down'
                              ? 'bg-[#EF4444]/25 text-[#EF4444] ring-1 ring-[#EF4444]/50'
                              : 'text-[#F0F2FF]'
                          }`}
                        >
                          {fmtMoney(s.currentPrice)} IC
                        </span>
                        <span className={`text-[11px] font-bold ${isPos ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                          {isPos ? '▲+' : '▼'}{s.percentChange || 0}%
                        </span>
                      </div>

                      {/* Stock Adjustment Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="flex items-center gap-1 bg-[#141824] p-0.5 rounded-md border border-[#2D3142]/60">
                          {[10, 25, -10, -25].map((pct) => (
                            <button
                              key={pct}
                              disabled={isAdjusting}
                              onClick={() => executeStockAdjust(s.id, pct)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                pct > 0
                                  ? 'bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] hover:bg-[#22C55E]/35'
                                  : 'bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/35'
                              }`}
                            >
                              {pct > 0 ? `+${pct}%` : `${pct}%`}
                            </button>
                          ))}
                        </div>

                        {/* Custom % Apply Button (Amber) */}
                        {!isConfirmingCustom ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              placeholder="±%"
                              title="Enter percentage to add (+) or subtract (-), e.g. 15 or -10"
                              value={customPercents[s.id] || ''}
                              onChange={(e) =>
                                setCustomPercents({ ...customPercents, [s.id]: e.target.value })
                              }
                              className="w-14 h-5 bg-[#1A1D27] border border-[#2D3142] text-center rounded text-[10px] text-white focus:outline-none focus:border-[#F0B429]"
                            />
                            <button
                              type="button"
                              onClick={() => handleCustomApplyClick(s.id)}
                              className="px-2 py-0.5 bg-[#F0B429] hover:bg-[#d9a120] text-black font-extrabold text-[10px] rounded transition-all cursor-pointer shadow-xs"
                            >
                              APPLY
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-[#F0B429] font-bold">
                              {confirmStockAdj.percent > 0 ? `+${confirmStockAdj.percent}%?` : `${confirmStockAdj.percent}%?`}
                            </span>
                            <button
                              type="button"
                              onClick={() => executeStockAdjust(s.id, confirmStockAdj.percent)}
                              className="px-1.5 py-0.5 bg-[#22C55E] text-black font-bold rounded uppercase hover:bg-[#1eb053] cursor-pointer"
                            >
                              YES
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmStockAdj(null)}
                              className="px-1 py-0.5 bg-[#2D3142] text-[#7B82A0] hover:text-white font-bold rounded cursor-pointer"
                            >
                              NO
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT BOTTOM (40% Height) — LEADERBOARD, ACTIVITY & PARTICIPANTS TABS */}
          <div className="h-[40%] bg-[#1A1D27] border border-[#2D3142] rounded-xl p-3.5 shadow-lg flex flex-col overflow-hidden">
            
            {/* Sub-tabs Header */}
            <div className="flex items-center justify-between border-b border-[#2D3142] pb-2 mb-2 shrink-0 font-mono text-xs">
              <div className="flex items-center gap-1 bg-[#0F1117] p-1 rounded-lg border border-[#2D3142]">
                <button
                  type="button"
                  onClick={() => setRightBottomTab('LEADERBOARD')}
                  className={`px-2.5 py-1 rounded-md font-mono text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    rightBottomTab === 'LEADERBOARD'
                      ? 'bg-[#F0B429]/20 text-[#F0B429] border border-[#F0B429]/40 shadow-sm'
                      : 'text-[#7B82A0] hover:text-white'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-[#F0B429]" />
                  <span>LEADERBOARD ({leaderboard.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRightBottomTab('ACTIVITY')}
                  className={`px-2.5 py-1 rounded-md font-mono text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    rightBottomTab === 'ACTIVITY'
                      ? 'bg-[#F0B429]/20 text-[#F0B429] border border-[#F0B429]/40 shadow-sm'
                      : 'text-[#7B82A0] hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-[#F0B429]" />
                  <span>LIVE ACTIVITY</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRightBottomTab('PARTICIPANTS')}
                  className={`px-2.5 py-1 rounded-md font-mono text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    rightBottomTab === 'PARTICIPANTS'
                      ? 'bg-[#F0B429]/20 text-[#F0B429] border border-[#F0B429]/40 shadow-sm'
                      : 'text-[#7B82A0] hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-[#F0B429]" />
                  <span>PARTICIPANTS ({participants.length})</span>
                </button>
              </div>

              {rightBottomTab === 'LEADERBOARD' && (
                <button
                  type="button"
                  onClick={fetchLeaderboard}
                  disabled={loadingLeaderboard}
                  className="text-[10px] text-[#F0B429] hover:underline font-mono cursor-pointer"
                >
                  REFRESH
                </button>
              )}

              {rightBottomTab === 'PARTICIPANTS' && (
                <div className="flex items-center gap-1.5 font-mono flex-wrap">
                  {/* Action Group 1: Add & Upload (Primary) */}
                  <div className="flex items-center gap-1 bg-[#0F1117] p-0.5 rounded-lg border border-[#2D3142]">
                    <button
                      type="button"
                      onClick={() => setShowAddParticipantModal(true)}
                      className="px-2.5 py-1 rounded bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] hover:bg-[#22C55E]/30 font-bold text-[10.5px] flex items-center gap-1 cursor-pointer transition-all"
                      title="Manually add a single participant"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      className="px-2.5 py-1 rounded bg-[#F0B429]/15 border border-[#F0B429]/30 text-[#F0B429] hover:bg-[#F0B429]/30 font-bold text-[10.5px] flex items-center gap-1 cursor-pointer transition-all"
                      title="Bulk import from Excel or CSV file"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import List</span>
                    </button>
                  </div>

                  {/* Action Group 2: Danger/Maintenance Actions */}
                  <div className="flex items-center gap-1 bg-[#0F1117] p-0.5 rounded-lg border border-[#2D3142]">
                    <button
                      type="button"
                      onClick={() => setShowResetAllModal(true)}
                      disabled={participants.length === 0}
                      className="px-2 py-1 rounded text-[#F0B429] hover:bg-[#F0B429]/15 font-bold text-[10.5px] flex items-center gap-1 cursor-pointer disabled:opacity-40 transition-all"
                      title="Reset ALL participant balances to 20,000 IC and clear holdings"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset All</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteAllModal(true)}
                      disabled={participants.length === 0}
                      className="px-2 py-1 rounded text-[#EF4444] hover:bg-[#EF4444]/15 font-bold text-[10.5px] flex items-center gap-1 cursor-pointer disabled:opacity-40 transition-all"
                      title="Delete ALL participant accounts permanently"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete All</span>
                    </button>
                  </div>

                  {/* Refresh Indicator */}
                  <button
                    type="button"
                    onClick={() => fetchParticipants(true)}
                    disabled={loadingParticipants}
                    className="p-1.5 rounded-lg bg-[#0F1117] border border-[#2D3142] text-[#7B82A0] hover:text-white font-bold cursor-pointer transition-all"
                    title="Refresh participant list"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingParticipants ? 'animate-spin text-[#F0B429]' : ''}`} />
                  </button>
                </div>
              )}
            </div>

            {/* Scrollable Sub-tab Content */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 min-h-0 font-mono text-xs">
              {/* TAB 1: LEADERBOARD */}
              {rightBottomTab === 'LEADERBOARD' && (
                loadingLeaderboard ? (
                  <div className="py-8 text-center text-[#7B82A0] text-xs">Loading standings...</div>
                ) : leaderboard.length === 0 ? (
                  <div className="py-8 text-center text-[#7B82A0] text-xs italic">No active traders found.</div>
                ) : (
                  leaderboard.map((entry) => {
                    const isTop1 = entry.rank === 1;

                    return (
                      <div
                        key={entry.id || entry.rank}
                        className={`p-2 bg-[#0F1117] border ${
                          isTop1
                            ? 'border-l-4 border-l-[#F0B429] border-[#F0B429]/40 bg-[#F0B429]/5 shadow-[0_0_12px_rgba(240,180,41,0.12)]'
                            : 'border-[#2D3142]'
                        } rounded-lg flex items-center justify-between hover:bg-[#161B27] transition-all`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`font-extrabold text-xs w-5 ${isTop1 ? 'text-[#F0B429]' : 'text-[#7B82A0]'}`}>
                            #{entry.rank}
                          </span>
                          <div>
                            <span className="font-bold text-white text-xs block">{entry.name}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-xs font-extrabold text-[#22C55E] block">
                              {fmtMoney(entry.totalPortfolioValue)} IC
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenTraderModal(entry.id)}
                            className="px-2.5 py-1 bg-[#F0B429]/15 border border-[#F0B429]/30 text-[#F0B429] text-[10px] font-bold rounded hover:bg-[#F0B429]/30 transition-colors cursor-pointer"
                          >
                            VIEW
                          </button>
                        </div>
                      </div>
                    );
                  })
                )
              )}

              {/* TAB 2: LIVE ACTIVITY */}
              {rightBottomTab === 'ACTIVITY' && (
                liveTradeFeed.length === 0 ? (
                  <div className="py-8 text-center text-[#7B82A0] text-xs italic">
                    Awaiting live trades & broadcasts...
                  </div>
                ) : (
                  liveTradeFeed.map((item) => {
                    const borderClass = item.isBankrupt
                      ? 'border-l-4 border-l-[#EF4444]'
                      : item.isTopUp
                      ? 'border-l-4 border-l-[#F0B429]'
                      : 'border-l-4 border-l-[#22C55E]';

                    return (
                      <div
                        key={item.id}
                        className={`p-2 bg-[#0F1117] border border-[#2D3142] ${borderClass} rounded-r-lg space-y-0.5 text-xs`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span
                            onClick={() => item.traderId && handleOpenTraderModal(item.traderId)}
                            className="font-bold text-white hover:text-[#F0B429] cursor-pointer underline decoration-dotted"
                          >
                            {item.traderName || 'Trader'}
                          </span>
                          <span className="text-[10px] text-[#7B82A0]">
                            {new Date(item.timestamp || Date.now()).toLocaleTimeString()}
                          </span>
                        </div>

                        <div className="text-[11px] text-[#7B82A0]">
                          {item.action || 'Trade executed'}: <span className="font-bold text-white">{item.quantity} {item.symbol}</span> @ <span className="font-bold text-[#22C55E]">{fmtMoney(item.price)} IC</span>
                        </div>
                      </div>
                    );
                  })
                )
              )}

              {/* TAB 3: PARTICIPANTS ROSTER */}
              {rightBottomTab === 'PARTICIPANTS' && (
                <div className="space-y-1.5">
                  <div className="relative pb-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#7B82A0]" />
                    <input
                      type="text"
                      placeholder="Search roster by name, email, or phone number..."
                      value={participantSearch}
                      onChange={(e) => setParticipantSearch(e.target.value)}
                      className="h-7.5 bg-[#0F1117] border border-[#2D3142] rounded-lg pl-8 pr-8 text-xs text-white placeholder-[#7B82A0] focus:outline-none focus:border-[#F0B429] w-full font-mono transition-all"
                    />
                    {participantSearch && (
                      <button
                        type="button"
                        onClick={() => setParticipantSearch('')}
                        className="absolute right-2.5 top-2 text-[#7B82A0] hover:text-white text-xs cursor-pointer"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {loadingParticipants ? (
                    <div className="py-8 text-center text-[#7B82A0] text-xs">Loading participants roster...</div>
                  ) : filteredParticipants.length === 0 ? (
                    /* Step 4 Empty State with Clear Call-to-Action Upload Button */
                    <div className="py-8 px-4 text-center bg-[#0F1117] border border-[#2D3142] rounded-xl space-y-3 font-mono">
                      <div className="w-10 h-10 rounded-full bg-[#F0B429]/10 border border-[#F0B429]/30 flex items-center justify-center mx-auto text-[#F0B429]">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">No Participants in Roster Yet</h4>
                        <p className="text-[10.5px] text-[#7B82A0] max-w-sm mx-auto mt-1">
                          Traders cannot log in until you upload the event participant roster list (Excel or CSV).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        className="px-4 py-2 bg-[#F0B429] hover:bg-[#d9a120] text-black font-extrabold text-xs rounded-lg uppercase tracking-wider transition-all cursor-pointer shadow-md inline-flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Participant List (Excel or CSV)</span>
                      </button>
                    </div>
                  ) : (
                    filteredParticipants.map((p) => {
                      const isConfirmingReset = resetConfirmPartId === p.id;
                      const isConfirmingRemove = removeConfirmPartId === p.id;
                      const isResetting = resettingPartId === p.id;
                      const isRemoving = removingPartId === p.id;

                      return (
                        <div
                          key={p.id}
                          className="p-3 bg-[#0F1117] border border-[#2D3142] hover:border-[#F0B429]/40 rounded-xl flex items-center justify-between hover:bg-[#141824] transition-all text-xs"
                        >
                          {isConfirmingRemove ? (
                            /* Inline 2-Step Remove Confirmation Row */
                            <div className="w-full flex items-center justify-between gap-2 p-2 bg-[#EF4444]/10 border border-[#EF4444]/40 rounded-lg animate-fadeIn font-mono">
                              <span className="text-xs text-[#EF4444] font-bold truncate">
                                Remove <strong>{p.name}</strong> permanently? They will not be able to log in.
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  disabled={isRemoving}
                                  onClick={() => handleConfirmRemove(p)}
                                  className="px-3 py-1 bg-[#EF4444] text-white font-extrabold text-xs rounded-md uppercase hover:bg-[#dc2626] cursor-pointer shadow-xs"
                                >
                                  {isRemoving ? 'REMOVING...' : 'YES, REMOVE'}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelRemove}
                                  className="px-2.5 py-1 bg-[#2D3142] text-[#7B82A0] hover:text-white text-xs font-bold rounded-md cursor-pointer"
                                >
                                  CANCEL
                                </button>
                              </div>
                            </div>
                          ) : isConfirmingReset ? (
                            /* Inline 2-Step Reset Confirmation Row */
                            <div className="w-full flex items-center justify-between gap-2 p-2 bg-[#F0B429]/10 border border-[#F0B429]/40 rounded-lg animate-fadeIn font-mono">
                              <span className="text-xs text-[#F0B429] font-bold truncate">
                                Reset <strong>{p.name}</strong> to 20,000 IC and clear all trades/holdings?
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  disabled={isResetting}
                                  onClick={() => handleConfirmReset(p)}
                                  className="px-3 py-1 bg-[#F0B429] text-black font-extrabold text-xs rounded-md uppercase hover:bg-[#d9a120] cursor-pointer shadow-xs"
                                >
                                  {isResetting ? 'RESETTING...' : 'YES, RESET'}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelReset}
                                  className="px-2.5 py-1 bg-[#2D3142] text-[#7B82A0] hover:text-white text-xs font-bold rounded-md cursor-pointer"
                                >
                                  CANCEL
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Left: Avatar initial + Name + Email + Phone + Login status */}
                              <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                                <div className="w-8 h-8 rounded-lg bg-[#F0B429]/10 border border-[#F0B429]/20 flex items-center justify-center font-bold text-[#F0B429] shrink-0 text-xs">
                                  {p.name ? p.name.charAt(0).toUpperCase() : 'T'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      onClick={() => handleOpenTraderModal(p.id)}
                                      className="font-bold text-white text-xs hover:text-[#F0B429] cursor-pointer transition-colors"
                                      title="Click to view trader drill-down and portfolio details"
                                    >
                                      {p.name}
                                    </span>
                                    <span
                                      className={`text-[9.5px] px-2 py-0.5 rounded-full font-extrabold uppercase shrink-0 inline-flex items-center gap-1.5 ${
                                        p.hasLoggedIn
                                          ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                                          : 'bg-[#7B82A0]/15 text-[#7B82A0] border border-[#7B82A0]/30'
                                      }`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${p.hasLoggedIn ? 'bg-[#22C55E] animate-pulse' : 'bg-[#7B82A0]'}`} />
                                      <span>{p.hasLoggedIn ? 'Logged In' : 'Not Logged In'}</span>
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[#7B82A0] flex items-center gap-2.5 mt-0.5 font-mono truncate">
                                    <span className="truncate text-slate-300">{p.email}</span>
                                    <span>•</span>
                                    <span className="text-[#F0B429] font-medium shrink-0">Tel: {p.phone || '-'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Right: Cash Balance + Drill Down + Reset + Remove */}
                              <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right px-2 py-1 bg-[#1A1D27] border border-[#2D3142] rounded-lg">
                                  <span className="text-[10px] text-[#7B82A0] block uppercase font-mono">CASH</span>
                                  <span className="text-xs font-mono font-black text-[#22C55E] block">
                                    {fmtMoney(p.walletBalance)} IC
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 font-mono">
                                  <button
                                    type="button"
                                    title="View Trader Drill-down and Holdings"
                                    onClick={() => handleOpenTraderModal(p.id)}
                                    className="px-2.5 py-1 bg-[#F0B429]/15 border border-[#F0B429]/30 text-[#F0B429] hover:bg-[#F0B429]/30 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View</span>
                                  </button>

                                  <button
                                    type="button"
                                    title="Reset Wallet & Portfolio to 20,000 IC"
                                    onClick={() => handleResetClick(p)}
                                    className="p-1.5 bg-[#2D3142]/60 hover:bg-[#F0B429]/20 hover:text-[#F0B429] text-[#7B82A0] rounded-md transition-all cursor-pointer"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    title="Remove Participant from Roster"
                                    onClick={() => handleRemoveClick(p)}
                                    className="p-1.5 bg-[#2D3142]/60 hover:bg-[#EF4444]/20 hover:text-[#EF4444] text-[#7B82A0] rounded-md transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

            </div>
          </div>

        </section>

      </main>

      {/* Break Modal */}
      {showBreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 font-mono animate-fadeIn backdrop-blur-xs">
          <div className="bg-[#1A1D27] border border-[#2D3142] rounded-xl p-6 max-w-md w-full space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2D3142] pb-3">
              <h3 className="text-xs font-bold text-[#F0B429] uppercase flex items-center gap-1.5">
                <Coffee className="w-4 h-4" />
                <span>PAUSE TRADING FOR BREAK</span>
              </h3>
              <button onClick={() => setShowBreakModal(false)} className="text-[#7B82A0] hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-[#7B82A0] uppercase block mb-1">Break Duration (Minutes):</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(parseInt(e.target.value, 10) || 10)}
                  className="w-full h-8 bg-[#0F1117] border border-[#2D3142] rounded-md px-2.5 text-xs text-white focus:outline-none focus:border-[#F0B429]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#7B82A0] uppercase block mb-1">Break Announcement Note:</label>
                <textarea
                  rows={3}
                  value={breakNote}
                  onChange={(e) => setBreakNote(e.target.value)}
                  className="w-full bg-[#0F1117] border border-[#2D3142] rounded-md p-2 text-xs text-white focus:outline-none focus:border-[#F0B429] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2D3142]">
              <button
                type="button"
                onClick={() => setShowBreakModal(false)}
                className="px-3 py-1.5 rounded-lg bg-[#2D3142] text-[#7B82A0] hover:text-white text-xs font-bold cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handlePauseSession}
                className="px-4 py-1.5 rounded-lg bg-[#F0B429] text-black text-xs font-bold uppercase hover:bg-[#d9a120] cursor-pointer"
              >
                LOCK FLOOR & PAUSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Configurator Setup Modal (When Session is Idle or Admin Clicks Start) */}
      {showSessionConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 font-mono animate-fadeIn backdrop-blur-xs">
          <div className="bg-[#1A1D27] border border-[#2D3142] rounded-xl p-6 max-w-lg w-full space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2D3142] pb-3">
              <h3 className="text-xs font-bold text-[#F0B429] uppercase flex items-center gap-1.5">
                <Play className="w-4 h-4 fill-[#F0B429]" />
                <span>START NEW TOURNAMENT SESSION</span>
              </h3>
              <button onClick={() => setShowSessionConfigModal(false)} className="text-[#7B82A0] hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] text-[#7B82A0] uppercase block mb-1">Session Duration (Minutes):</label>
                <div className="flex items-center gap-2">
                  {[60, 120, 180].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setSessionDurationMins(m);
                        setCustomDurationInput('');
                      }}
                      className={`px-3 py-1.5 rounded-md font-bold text-xs ${
                        sessionDurationMins === m && !customDurationInput
                          ? 'bg-[#F0B429] text-black'
                          : 'bg-[#0F1117] border border-[#2D3142] text-[#7B82A0]'
                      }`}
                    >
                      {m / 60} hrs
                    </button>
                  ))}
                  <input
                    type="number"
                    placeholder="Custom mins"
                    value={customDurationInput}
                    onChange={(e) => setCustomDurationInput(e.target.value)}
                    className="w-28 h-8 bg-[#0F1117] border border-[#2D3142] rounded-md px-2 text-xs text-white focus:outline-none focus:border-[#F0B429]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#7B82A0] uppercase block mb-1">Auto-Liquidation Buffer (Mins Before End):</label>
                <div className="flex items-center gap-2">
                  {[2, 5, 10].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setLiquidationBufferMins(m);
                        setCustomBufferInput('');
                      }}
                      className={`px-3 py-1.5 rounded-md font-bold text-xs ${
                        liquidationBufferMins === m && !customBufferInput
                          ? 'bg-[#F0B429] text-black'
                          : 'bg-[#0F1117] border border-[#2D3142] text-[#7B82A0]'
                      }`}
                    >
                      {m} min
                    </button>
                  ))}
                  <input
                    type="number"
                    placeholder="Custom mins"
                    value={customBufferInput}
                    onChange={(e) => setCustomBufferInput(e.target.value)}
                    className="w-28 h-8 bg-[#0F1117] border border-[#2D3142] rounded-md px-2 text-xs text-white focus:outline-none focus:border-[#F0B429]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#7B82A0] uppercase block mb-1">Macro Volatility Interval (Minutes):</label>
                <div className="flex items-center gap-2">
                  {[10, 15, 20].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMacroCycleIntervalMins(m);
                        setCustomMacroInput('');
                      }}
                      className={`px-3 py-1.5 rounded-md font-bold text-xs ${
                        macroCycleIntervalMins === m && !customMacroInput
                          ? 'bg-[#F0B429] text-black'
                          : 'bg-[#0F1117] border border-[#2D3142] text-[#7B82A0]'
                      }`}
                    >
                      {m} min
                    </button>
                  ))}
                  <input
                    type="number"
                    placeholder="Custom mins"
                    value={customMacroInput}
                    onChange={(e) => setCustomMacroInput(e.target.value)}
                    className="w-28 h-8 bg-[#0F1117] border border-[#2D3142] rounded-md px-2 text-xs text-white focus:outline-none focus:border-[#F0B429]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#7B82A0] uppercase block mb-1">Volatility Preset:</label>
                <div className="flex items-center gap-2">
                  {['LOW', 'MEDIUM', 'HIGH'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setVolatilityLevel(lvl)}
                      className={`px-3 py-1.5 rounded-md font-bold text-xs uppercase ${
                        volatilityLevel === lvl
                          ? 'bg-[#F0B429] text-black'
                          : 'bg-[#0F1117] border border-[#2D3142] text-[#7B82A0]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#2D3142]">
              <button
                type="button"
                onClick={() => setShowSessionConfigModal(false)}
                className="px-3 py-1.5 rounded-lg bg-[#2D3142] text-[#7B82A0] hover:text-white text-xs font-bold cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={isStartingSession}
                onClick={handleStartSession}
                className="px-5 py-1.5 rounded-lg bg-[#F0B429] text-black text-xs font-bold uppercase hover:bg-[#d9a120] cursor-pointer"
              >
                {isStartingSession ? 'STARTING...' : 'START TOURNAMENT SESSION'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Single Participant Modal */}
      {showAddParticipantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 font-mono animate-fadeIn backdrop-blur-xs">
          <form onSubmit={handleAddSingleParticipant} className="bg-[#1A1D27] border border-[#2D3142] rounded-xl p-6 max-w-md w-full space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2D3142] pb-3">
              <h3 className="text-xs font-bold text-[#F0B429] uppercase flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" />
                <span>ADD PARTICIPANT TO ROSTER</span>
              </h3>
              <button type="button" onClick={() => setShowAddParticipantModal(false)} className="text-[#7B82A0] hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-[#7B82A0] uppercase block mb-1">Full Name:*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  className="w-full h-9 bg-[#0F1117] border border-[#2D3142] rounded-md px-2.5 text-xs text-white focus:outline-none focus:border-[#F0B429]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#7B82A0] uppercase block mb-1">Email Address:*</label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={newPartEmail}
                  onChange={(e) => setNewPartEmail(e.target.value)}
                  className="w-full h-9 bg-[#0F1117] border border-[#2D3142] rounded-md px-2.5 text-xs text-white focus:outline-none focus:border-[#F0B429]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#7B82A0] uppercase block mb-1">Phone Number (Password):*</label>
                <input
                  type="text"
                  required
                  placeholder="9876543210"
                  value={newPartPhone}
                  onChange={(e) => setNewPartPhone(e.target.value)}
                  className="w-full h-9 bg-[#0F1117] border border-[#2D3142] rounded-md px-2.5 text-xs text-white focus:outline-none focus:border-[#F0B429]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2D3142]">
              <button
                type="button"
                onClick={() => setShowAddParticipantModal(false)}
                className="px-3 py-1.5 rounded-lg bg-[#2D3142] text-[#7B82A0] hover:text-white text-xs font-bold cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={addingParticipant}
                className="px-4 py-1.5 rounded-lg bg-[#F0B429] text-black text-xs font-bold uppercase hover:bg-[#d9a120] cursor-pointer"
              >
                {addingParticipant ? 'ADDING...' : 'ADD PARTICIPANT'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upload Roster Preview Modal */}
      {showUploadPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 font-mono animate-fadeIn backdrop-blur-xs">
          <div className="bg-[#1A1D27] border border-[#2D3142] rounded-xl p-6 max-w-2xl w-full space-y-4 text-white shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-[#2D3142] pb-3 shrink-0">
              <div>
                <h3 className="text-xs font-bold text-[#F0B429] uppercase flex items-center gap-1.5">
                  <Upload className="w-4 h-4" />
                  <span>PREVIEW IMPORT ({uploadPreviewRows.length} ROWS FOUND)</span>
                </h3>
                <p className="text-[10px] text-[#7B82A0] mt-0.5">
                  {uploadPreviewRows.filter((r) => r.missingFields.length === 0).length} Ready to Import, {uploadPreviewRows.filter((r) => r.missingFields.length > 0).length} Invalid/Missing Data
                </p>
              </div>
              <button type="button" onClick={() => setShowUploadPreviewModal(false)} className="text-[#7B82A0] hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 text-xs">
              <div className="grid grid-cols-4 font-bold text-[#7B82A0] border-b border-[#2D3142] pb-1.5 text-[10.5px]">
                <span>NAME</span>
                <span>EMAIL</span>
                <span>PHONE</span>
                <span className="text-right">STATUS</span>
              </div>
              {uploadPreviewRows.slice(0, 100).map((r, idx) => {
                const hasError = r.missingFields.length > 0;
                return (
                  <div
                    key={idx}
                    className={`grid grid-cols-4 text-[11px] py-1.5 px-2 rounded border ${
                      hasError
                        ? 'bg-[#EF4444]/15 border-[#EF4444]/40 text-red-200'
                        : 'bg-[#0F1117]/60 border-[#2D3142]/40 text-slate-200'
                    }`}
                  >
                    <span className="truncate font-bold">{r.name}</span>
                    <span className="truncate font-mono">{r.email}</span>
                    <span className="truncate font-mono text-[#F0B429]">{r.phone}</span>
                    <span className="text-right font-mono font-bold text-[10px]">
                      {hasError ? (
                        <span className="text-[#EF4444] uppercase">Missing: {r.missingFields.join(', ')}</span>
                      ) : (
                        <span className="text-[#22C55E] uppercase">Ready</span>
                      )}
                    </span>
                  </div>
                );
              })}
              {uploadPreviewRows.length > 100 && (
                <div className="text-[10px] text-[#7B82A0] text-center pt-2 italic">
                  ...and {uploadPreviewRows.length - 100} more participants
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#2D3142] shrink-0">
              <span className="text-[10.5px] text-[#7B82A0]">
                Only valid rows without missing data will be imported. Duplicates skipped automatically.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadPreviewModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#2D3142] text-[#7B82A0] hover:text-white text-xs font-bold cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  disabled={uploadingRoster || uploadPreviewRows.filter((r) => r.missingFields.length === 0).length === 0}
                  onClick={handleConfirmImport}
                  className="px-4 py-1.5 rounded-lg bg-[#22C55E] text-black text-xs font-bold uppercase hover:bg-[#1eb053] cursor-pointer disabled:opacity-40"
                >
                  {uploadingRoster ? 'IMPORTING...' : 'CONFIRM IMPORT'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Trader Drill-Down Slide-Over Modal */}
      <AdminTraderDetailModal
        traderId={selectedTraderId}
        isOpen={isTraderModalOpen}
        onClose={() => setIsTraderModalOpen(false)}
      />

      {/* Reset All Confirmation Modal */}
      {showResetAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 font-mono animate-fadeIn backdrop-blur-xs">
          <div className="bg-[#1A1D27] border border-[#2D3142] rounded-xl p-6 max-w-md w-full space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2D3142] pb-3">
              <h3 className="text-xs font-bold text-[#F0B429] uppercase flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4" />
                <span>RESET ALL PARTICIPANTS</span>
              </h3>
              <button type="button" onClick={() => setShowResetAllModal(false)} className="text-[#7B82A0] hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-white font-bold">
                Reset ALL <span className="text-[#F0B429]">{participants.length}</span> participants back to 20,000 IC?
              </p>
              <p className="text-[11px] text-[#7B82A0]">
                This will wipe all holdings, transactions, and open limit orders across the entire event. Active trader dashboards will update immediately.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2D3142]">
              <button
                type="button"
                onClick={() => setShowResetAllModal(false)}
                className="px-3 py-1.5 rounded-lg bg-[#2D3142] text-[#7B82A0] hover:text-white text-xs font-bold cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={resettingAll}
                onClick={handleResetAllParticipants}
                className="px-4 py-1.5 rounded-lg bg-[#F0B429] text-black text-xs font-extrabold uppercase hover:bg-[#d9a120] cursor-pointer shadow-md"
              >
                {resettingAll ? 'RESETTING ALL...' : 'CONFIRM RESET ALL'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 font-mono animate-fadeIn backdrop-blur-xs">
          <div className="bg-[#1A1D27] border border-[#2D3142] rounded-xl p-6 max-w-md w-full space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2D3142] pb-3">
              <h3 className="text-xs font-bold text-[#EF4444] uppercase flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" />
                <span>DELETE ALL PARTICIPANTS</span>
              </h3>
              <button type="button" onClick={() => setShowDeleteAllModal(false)} className="text-[#7B82A0] hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-white font-bold">
                Permanently delete ALL <span className="text-[#EF4444]">{participants.length}</span> participant accounts?
              </p>
              <p className="text-[11px] text-[#7B82A0]">
                This will wipe the entire roster and remove all accounts from the database. The roster table will revert to empty state for a fresh upload.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2D3142]">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                className="px-3 py-1.5 rounded-lg bg-[#2D3142] text-[#7B82A0] hover:text-white text-xs font-bold cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={deletingAll}
                onClick={handleDeleteAllParticipants}
                className="px-4 py-1.5 rounded-lg bg-[#EF4444] text-white text-xs font-extrabold uppercase hover:bg-[#dc2626] cursor-pointer shadow-md"
              >
                {deletingAll ? 'DELETING ALL...' : 'CONFIRM DELETE ALL'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
