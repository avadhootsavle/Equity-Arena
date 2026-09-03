import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../services/api';
import { Mail, Zap, Shield, Sun, Moon, Phone, Lock } from 'lucide-react';

export function Login() {
  const [activeTab, setActiveTab] = useState('TRADER_SIGNIN'); // 'TRADER_SIGNIN', 'ADMIN'
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const countRef = useRef(0);
  const clickTimerRef = useRef(null);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Secret 5-click trigger handler on the header logo icon
  const handleSecretTriggerClick = () => {
    countRef.current += 1;
    const current = countRef.current;

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      countRef.current = 0;
    }, 3000);

    if (current >= 5) {
      setIsAdminUnlocked(true);
      setActiveTab('ADMIN');
      countRef.current = 0;
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    }
  };

  // Trader Sign In submit (Email + Phone Number)
  const handleTraderSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, phone })
      });

      login(data.token, data.user);
      navigate('/trader');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Hardened Admin Login submit
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiFetch('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      login(data.token, data.user);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Admin authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen relative overflow-x-hidden flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#F0B429] selection:text-black transition-colors ${
        isDark ? 'bg-[#06080D] text-[#F0F2FF]' : 'bg-[#0F131D] text-[#F0F2FF]'
      }`}
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 15% 25%, rgba(240,180,41,0.07) 0%, transparent 55%),
          radial-gradient(ellipse at 85% 85%, rgba(239,68,68,0.04) 0%, transparent 55%),
          repeating-linear-gradient(45deg, rgba(240,180,41,0.03) 0px, rgba(240,180,41,0.03) 1px, transparent 1px, transparent 24px),
          repeating-linear-gradient(-45deg, rgba(240,180,41,0.02) 0px, rgba(240,180,41,0.02) 1px, transparent 1px, transparent 24px)
        `
      }}
    >
      {/* BACKGROUND AMBER & RED RADIAL GLOWS */}
      <div className="absolute left-[-10%] top-[10%] w-[450px] h-[450px] bg-[#F0B429]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute right-[-10%] bottom-[10%] w-[450px] h-[450px] bg-red-500/05 rounded-full blur-[120px] pointer-events-none" />

      {/* HEADER */}
      <header className="flex items-center justify-between z-10 max-w-6xl mx-auto w-full shrink-0">
        <div className="flex items-center gap-3">
          <div
            onClick={handleSecretTriggerClick}
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-[#F0B429]/20 cursor-pointer transition-transform hover:scale-105 active:scale-95 overflow-hidden"
            title="Equity Arena"
          >
            <img src="/vite.svg" alt="Equity Arena Logo" className="w-10 h-10 object-cover" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-wider font-mono text-white">EQUITY ARENA</h1>
            <p className="text-[10px] text-[#7B82A0] font-mono tracking-widest uppercase">
              Ignite 8.0 • Trading Floor
            </p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-[#2D3142] bg-[#161B27] text-[#F0F2FF] hover:bg-[#1E2333] transition-all cursor-pointer shadow-sm"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* MAIN CONTAINER (VERTICALLY CENTERED) */}
      <main className="z-10 max-w-6xl mx-auto w-full my-auto py-6 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT HERO COLUMN */}
          <div className="md:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F0B429]/10 border border-[#F0B429]/30 text-[#F0B429] font-mono text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#F0B429] animate-pulse" />
              <span>OFFICIAL TOURNAMENT TRADING FLOOR</span>
            </div>

            {/* BOLD 64px 900 WEIGHT BRANDING */}
            <div className="space-y-0 font-black tracking-tight leading-none uppercase select-none">
              <div className="text-5xl sm:text-6xl lg:text-[64px] font-black text-white leading-none tracking-tight">
                EQUITY
              </div>
              <div className="text-5xl sm:text-6xl lg:text-[64px] font-black text-[#F0B429] leading-none tracking-tight mt-1">
                ARENA
              </div>
            </div>

            {/* 20px MUTED GREY SUBLINE */}
            <p className="text-[20px] font-mono font-bold text-[#94A3B8] tracking-wide mt-2">
              Trade. Think. Win.
            </p>

            {/* 15px SOFTER GREY DESCRIPTION */}
            <p className="text-[15px] text-[#7B82A0] font-sans leading-relaxed max-w-md">
              Log in with your registered Email and Phone Number to access your tournament trading portal.
            </p>

            {/* 3 STAT CARDS WITH DEPTH */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-2 font-mono">
              <div className="p-3.5 rounded-xl border border-[#F0B429]/30 bg-[#0F1117]/80 backdrop-blur-xs shadow-md">
                <div className="font-extrabold text-[#F0B429] text-base sm:text-lg mb-0.5 truncate font-mono">
                  20,000 IC
                </div>
                <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#7B82A0] font-mono truncate">
                  Starting Balance
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[#F0B429]/30 bg-[#0F1117]/80 backdrop-blur-xs shadow-md">
                <div className="font-extrabold text-[#22C55E] text-base sm:text-lg mb-0.5 truncate font-mono">
                  20 STOCKS
                </div>
                <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#7B82A0] font-mono truncate">
                  Live Exchange
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[#F0B429]/30 bg-[#0F1117]/80 backdrop-blur-xs shadow-md">
                <div className="font-extrabold text-[#3B82F6] text-base sm:text-lg mb-0.5 truncate font-mono">
                  3 HOURS
                </div>
                <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#7B82A0] font-mono truncate">
                  Live Session
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT LOGIN CARD */}
          <div className="md:col-span-6">
            <div
              className={`p-6 sm:p-8 rounded-2xl border transition-all shadow-[0_0_30px_rgba(240,180,41,0.08)] ${
                isDark
                  ? 'bg-[#0F1117] border-[#F0B429]/30 text-white'
                  : 'bg-white border-[#F0B429]/40 text-[#1A1D27]'
              }`}
            >
              {/* TAB BADGE: TRADER LOG IN & ADMIN */}
              <div className="flex items-center justify-between border-b border-[#2D3142]/60 pb-4 mb-6 font-mono">
                <div className="flex items-center gap-2">
                  <span className={`font-extrabold px-3.5 py-1.5 rounded-md text-xs uppercase tracking-wider shadow-sm inline-flex items-center gap-1.5 ${
                    activeTab === 'ADMIN'
                      ? 'bg-[#EF4444] text-white'
                      : 'bg-[#F0B429] text-black'
                  }`}>
                    {activeTab === 'ADMIN' ? (
                      <>
                        <Shield className="w-3.5 h-3.5 text-white" />
                        <span>ADMIN LOGIN</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-black text-black" />
                        <span>TRADER LOGIN</span>
                      </>
                    )}
                  </span>
                </div>

                {isAdminUnlocked && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(activeTab === 'ADMIN' ? 'TRADER_SIGNIN' : 'ADMIN');
                      setError('');
                      setEmail('');
                      setPassword('');
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'ADMIN'
                        ? 'bg-[#EF4444] text-white border border-[#EF4444]'
                        : 'bg-[#2D3142] text-[#7B82A0] hover:text-white'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>{activeTab === 'ADMIN' ? 'TRADER MODE' : 'ADMIN MODE'}</span>
                  </button>
                )}
              </div>

              {/* ERROR ALERT */}
              {error && (
                <div className="mb-6 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
                  {error}
                </div>
              )}

              {/* TRADER FORM (Email + Phone Number) */}
              {activeTab !== 'ADMIN' && (
                <form onSubmit={handleTraderSubmit} className="space-y-5 font-mono">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#7B82A0]">
                      Your Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-[16px] w-5 h-5 text-[#7B82A0]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={`w-full h-[52px] pl-11 pr-4 rounded-xl text-[15px] font-sans transition-all focus:outline-none focus:border-[#F0B429] focus:ring-2 focus:ring-[#F0B429]/30 ${
                          isDark
                            ? 'bg-[#161B27] border border-[#2D3142] text-white placeholder-[#555E78]'
                            : 'bg-slate-50 border border-[#CBD5E1] text-[#1A1D27] placeholder-[#94A3B8]'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#7B82A0]">
                      Your Phone Number (Login Password)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-[16px] w-5 h-5 text-[#7B82A0]" />
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="9876543210"
                        className={`w-full h-[52px] pl-11 pr-4 rounded-xl text-[15px] font-sans transition-all focus:outline-none focus:border-[#F0B429] focus:ring-2 focus:ring-[#F0B429]/30 ${
                          isDark
                            ? 'bg-[#161B27] border border-[#2D3142] text-white placeholder-[#555E78]'
                            : 'bg-slate-50 border border-[#CBD5E1] text-[#1A1D27] placeholder-[#94A3B8]'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-[52px] bg-[#F0B429] hover:bg-[#f5bc38] text-black font-extrabold text-[15px] font-mono uppercase tracking-wider rounded-xl shadow-lg shadow-[#F0B429]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.005] active:scale-[0.99] disabled:opacity-50 mt-6 cursor-pointer"
                  >
                    {loading ? (
                      'AUTHENTICATING...'
                    ) : (
                      <>
                        <Zap className="w-5 h-5 fill-black text-black" />
                        <span>LOG IN →</span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-center text-[#7B82A0] mt-4 font-mono">
                    Can't log in? Ask the event admin to check your registration.
                  </p>
                </form>
              )}

              {/* ADMIN FORM */}
              {activeTab === 'ADMIN' && (
                <form onSubmit={handleAdminSubmit} className="space-y-5 font-mono">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#7B82A0]">
                      Admin Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-[16px] w-5 h-5 text-[#7B82A0]" />
                      <input
                        type="email"
                        required
                        autoComplete="off"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="••••••••••••••••"
                        className={`w-full h-[52px] pl-11 pr-4 rounded-xl text-[15px] font-sans transition-all focus:outline-none focus:border-[#F0B429] focus:ring-2 focus:ring-[#F0B429]/30 ${
                          isDark
                            ? 'bg-[#161B27] border border-[#2D3142] text-white placeholder-[#555E78]'
                            : 'bg-slate-50 border border-[#CBD5E1] text-[#1A1D27] placeholder-[#94A3B8]'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#7B82A0]">
                      Admin Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-[16px] w-5 h-5 text-[#7B82A0]" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full h-[52px] pl-11 pr-4 rounded-xl text-[15px] font-sans transition-all focus:outline-none focus:border-[#F0B429] focus:ring-2 focus:ring-[#F0B429]/30 ${
                          isDark
                            ? 'bg-[#161B27] border border-[#2D3142] text-white placeholder-[#555E78]'
                            : 'bg-slate-50 border border-[#CBD5E1] text-[#1A1D27] placeholder-[#94A3B8]'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-[52px] bg-[#F0B429] hover:bg-[#f5bc38] text-black font-extrabold text-[15px] font-mono uppercase tracking-wider rounded-xl shadow-lg shadow-[#F0B429]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.005] active:scale-[0.99] disabled:opacity-50 mt-6 cursor-pointer"
                  >
                    {loading ? (
                      'AUTHENTICATING...'
                    ) : (
                      <>
                        <Shield className="w-5 h-5 text-black" />
                        <span>ADMIN ACCESS</span>
                      </>
                    )}
                  </button>
                </form>
              )}

            </div>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="z-10 max-w-6xl mx-auto w-full text-center text-xs font-mono text-[#7B82A0] pt-4 shrink-0">
        Equity Arena • Real-Time Stock Market Trading Terminal • Ignite 8.0
      </footer>
    </div>
  );
}
