import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../services/api';
import { User, Lock, Mail, ArrowRight, Zap, Shield, Sun, Moon } from 'lucide-react';

export function Login() {
  const [activeTab, setActiveTab] = useState('TRADER_SIGNIN'); // 'TRADER_SIGNIN', 'TRADER_REGISTER', 'ADMIN'
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const clickTimerRef = useRef(null);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Secret 5-click trigger handler on the header badge icon
  const handleSecretTriggerClick = () => {
    const nextCount = clickCount + 1;
    setClickCount(nextCount);

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      setClickCount(0);
    }, 3000);

    if (nextCount >= 5) {
      setIsAdminUnlocked(true);
      setActiveTab('ADMIN');
      setClickCount(0);
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    }
  };

  // Trader Sign In / Register submit
  const handleTraderSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const isRegister = activeTab === 'TRADER_REGISTER';
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister ? { name, email, password } : { email, password };
      
      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      login(data.token, data.user);
      navigate('/trader');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Dedicated Hardened Admin Login submit
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
      className={`min-h-screen relative overflow-hidden transition-colors flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#F0B429] selection:text-black ${
        isDark ? 'bg-[#080B10] text-[#F0F2FF]' : 'bg-[#F0F2F7] text-[#1A1D27]'
      }`}
      style={{
        backgroundImage: `
          repeating-linear-gradient(45deg, rgba(240,180,41,${isDark ? '0.04' : '0.03'}) 0px, rgba(240,180,41,${isDark ? '0.04' : '0.03'}) 1px, transparent 1px, transparent 20px),
          repeating-linear-gradient(-45deg, rgba(240,180,41,${isDark ? '0.03' : '0.02'}) 0px, rgba(240,180,41,${isDark ? '0.03' : '0.02'}) 1px, transparent 1px, transparent 20px)
        `
      }}
    >
      {/* Subtle Red & Amber Glow Background Effects */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Right Red Glow */}
        <div
          className="absolute -right-20 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-60"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(180,20,20,0.12) 0%, transparent 70%)'
          }}
        />
        {/* Left Amber Glow */}
        <div
          className="absolute -left-20 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-60"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(240,180,41,0.09) 0%, transparent 70%)'
          }}
        />
      </div>

      {/* Top Bar: Theme Switcher */}
      <header className="relative z-20 flex justify-end items-center max-w-7xl mx-auto w-full">
        <button
          onClick={toggleTheme}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          className={`px-3.5 py-2 rounded-lg border text-xs font-mono font-bold transition-all flex items-center gap-2 shadow-sm ${
            isDark
              ? 'bg-[#0F1117] border-[#2D3142] text-white hover:border-[#F0B429]'
              : 'bg-white border-[#CBD5E1] text-[#1A1D27] hover:border-[#F0B429]'
          }`}
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-[#F0B429]" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </header>

      {/* Main Container: Split Screen Desktop / Single Column Mobile */}
      <main className="relative z-10 max-w-7xl mx-auto w-full my-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* ================= LEFT COLUMN: HERO PANEL (DESKTOP) ================= */}
          <div className="hidden md:flex md:col-span-7 flex-col justify-between p-6 lg:p-12 relative min-h-[520px]">
            {/* Top Amber Strand Light Diagonal Ray */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
              <div className="absolute -top-12 -right-12 w-[150%] h-[2px] bg-gradient-to-l from-[#F0B429]/40 via-[#F0B429]/20 to-transparent transform -rotate-12 origin-top-right" />
              
              {/* Bottom-left Angular Geometric Web Pattern */}
              <svg
                className="absolute bottom-0 left-0 w-72 h-72 text-[#F0B429]/10 pointer-events-none"
                viewBox="0 0 200 200"
                fill="none"
              >
                <path d="M0 200 L200 0 M0 150 L150 0 M0 100 L100 0 M0 50 L50 0 M50 200 L200 50 M100 200 L200 100" stroke="currentColor" strokeWidth="1" />
                <circle cx="0" cy="200" r="180" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="0" cy="200" r="120" stroke="currentColor" strokeWidth="1" />
                <circle cx="0" cy="200" r="60" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
              </svg>
            </div>

            {/* Content */}
            <div className="space-y-6 relative z-10">
              <button
                type="button"
                onClick={handleSecretTriggerClick}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#F0B429]/10 border border-[#F0B429]/30 text-[#F0B429] text-[13px] font-mono font-bold tracking-[0.2em] uppercase select-none hover:bg-[#F0B429]/20 transition-all cursor-pointer"
                title="Ignite 8.0 Exchange"
              >
                <span>◆</span>
                <span>IGNITE 8.0</span>
              </button>

              <div className="space-y-0 leading-none">
                <h1
                  className={`text-6xl lg:text-[76px] font-black tracking-tight uppercase ${
                    isDark ? 'text-white drop-shadow-[0_0_30px_rgba(240,180,41,0.35)]' : 'text-[#1A1D27]'
                  }`}
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  EQUITY
                </h1>
                <h1
                  className="text-6xl lg:text-[76px] font-black tracking-tight text-[#F0B429] uppercase drop-shadow-[0_0_30px_rgba(240,180,41,0.35)]"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  ARENA
                </h1>
              </div>

              <p className={`text-[18px] font-normal ${isDark ? 'text-[#7B82A0]' : 'text-[#374151]'}`}>
                Trade. Think. Win.
              </p>

              <p className={`text-[15px] font-normal leading-relaxed max-w-md ${isDark ? 'text-[#94A3B8]' : 'text-[#4B5563]'}`}>
                15 Indian stocks. 20,000 IC to start. One session to prove yourself.
              </p>
            </div>

            {/* Bottom Stats Row */}
            <div className={`pt-8 border-t ${isDark ? 'border-[#2D3142]/50 text-[#7B82A0]' : 'border-[#CBD5E1] text-[#6B7280]'} text-[12px] font-mono font-bold uppercase tracking-[0.15em] flex items-center gap-3 relative z-10`}>
              <span>15 STOCKS</span>
              <span className="text-[#F0B429]">•</span>
              <span>3 HOURS</span>
              <span className="text-[#F0B429]">•</span>
              <span>REAL-TIME PRICES</span>
            </div>
          </div>

          {/* ================= MOBILE HEADER (<768px) ================= */}
          <div className="md:hidden text-center space-y-2 mb-4">
            <button
              type="button"
              onClick={handleSecretTriggerClick}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#F0B429]/10 border border-[#F0B429]/30 text-[#F0B429] text-[12px] font-mono font-bold tracking-[0.2em] uppercase"
            >
              <span>◆</span>
              <span>IGNITE 8.0</span>
            </button>
            <h1
              className="text-4xl font-black uppercase tracking-tight"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              <span className={isDark ? 'text-white' : 'text-[#1A1D27]'}>EQUITY </span>
              <span className="text-[#F0B429]">ARENA</span>
            </h1>
            <p className={`text-sm ${isDark ? 'text-[#7B82A0]' : 'text-[#374151]'}`}>Trade. Think. Win.</p>
          </div>

          {/* ================= RIGHT COLUMN: FORM PANEL ================= */}
          <div className="md:col-span-5 w-full">
            <div
              className={`p-6 sm:p-8 lg:p-10 transition-all ${
                isDark
                  ? 'bg-[#0F1117] border border-[#1E2333] text-white shadow-2xl md:rounded-none rounded-2xl'
                  : 'bg-white border border-[#E2E6F0] text-[#1A1D27] shadow-[0_4px_24px_rgba(0,0,0,0.08)] md:rounded-none rounded-2xl'
              }`}
            >
              {/* TAB STRIP: SIGN IN / CREATE ACCOUNT */}
              <div className="flex items-center border-b border-[#2D3142]/60 mb-6 font-mono">
                <button
                  type="button"
                  onClick={() => { setActiveTab('TRADER_SIGNIN'); setError(''); }}
                  className={`py-3 px-5 text-[13px] font-bold uppercase tracking-wider transition-all border-b-2 ${
                    activeTab === 'TRADER_SIGNIN'
                      ? 'bg-[#F0B429] text-black border-[#F0B429] rounded-t-lg font-extrabold shadow-md'
                      : isDark
                      ? 'text-[#7B82A0] hover:text-white border-transparent'
                      : 'text-[#64748B] hover:text-[#1A1D27] border-transparent'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('TRADER_REGISTER'); setError(''); }}
                  className={`py-3 px-5 text-[13px] font-bold uppercase tracking-wider transition-all border-b-2 ${
                    activeTab === 'TRADER_REGISTER'
                      ? 'bg-[#F0B429] text-black border-[#F0B429] rounded-t-lg font-extrabold shadow-md'
                      : isDark
                      ? 'text-[#7B82A0] hover:text-white border-transparent'
                      : 'text-[#64748B] hover:text-[#1A1D27] border-transparent'
                  }`}
                >
                  Create Account
                </button>

                {isAdminUnlocked && (
                  <button
                    type="button"
                    onClick={() => { setActiveTab('ADMIN'); setError(''); }}
                    className={`py-3 px-4 text-[13px] font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${
                      activeTab === 'ADMIN'
                        ? 'bg-[#F0B429] text-black border-[#F0B429] rounded-t-lg font-extrabold shadow-md'
                        : isDark
                        ? 'text-[#7B82A0] hover:text-white border-transparent'
                        : 'text-[#64748B] hover:text-[#1A1D27] border-transparent'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin</span>
                  </button>
                )}
              </div>

              {/* ERROR ALERT */}
              {error && (
                <div className="mb-6 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
                  {error}
                </div>
              )}

              {/* TRADER FORM */}
              {activeTab !== 'ADMIN' && (
                <form onSubmit={handleTraderSubmit} className="space-y-5">
                  {activeTab === 'TRADER_REGISTER' && (
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-1.5 text-[#7B82A0]">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 w-5 h-5 text-[#7B82A0]" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your Name"
                          className={`w-full h-12 pl-11 pr-4 rounded-lg text-[16px] font-sans transition-all focus:outline-none focus:border-[#F0B429] focus:ring-2 focus:ring-[#F0B429]/20 ${
                            isDark
                              ? 'bg-[#161B27] border border-[#2D3142] text-white placeholder-[#555E78]'
                              : 'bg-white border border-[#CBD5E1] text-[#1A1D27] placeholder-[#94A3B8]'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-1.5 text-[#7B82A0]">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-[#7B82A0]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={`w-full h-12 pl-11 pr-4 rounded-lg text-[16px] font-sans transition-all focus:outline-none focus:border-[#F0B429] focus:ring-2 focus:ring-[#F0B429]/20 ${
                          isDark
                            ? 'bg-[#161B27] border border-[#2D3142] text-white placeholder-[#555E78]'
                            : 'bg-white border border-[#CBD5E1] text-[#1A1D27] placeholder-[#94A3B8]'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-1.5 text-[#7B82A0]">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-[#7B82A0]" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full h-12 pl-11 pr-4 rounded-lg text-[16px] font-sans transition-all focus:outline-none focus:border-[#F0B429] focus:ring-2 focus:ring-[#F0B429]/20 ${
                          isDark
                            ? 'bg-[#161B27] border border-[#2D3142] text-white placeholder-[#555E78]'
                            : 'bg-white border border-[#CBD5E1] text-[#1A1D27] placeholder-[#94A3B8]'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#F0B429] hover:bg-[#f5bc38] text-black font-extrabold text-[16px] font-mono uppercase tracking-wider rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-8"
                  >
                    {loading ? (
                      'AUTHENTICATING...'
                    ) : (
                      <>
                        <Zap className="w-5 h-5 fill-black text-black" />
                        <span>
                          {activeTab === 'TRADER_REGISTER'
                            ? 'START TRADING (20,000 IC CASH)'
                            : 'LOG IN'}
                        </span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ADMIN FORM */}
              {activeTab === 'ADMIN' && (
                <form onSubmit={handleAdminSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-1.5 text-[#7B82A0]">
                      Admin Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-[#7B82A0]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@test.com"
                        className={`w-full h-12 pl-11 pr-4 rounded-lg text-[16px] font-sans transition-all focus:outline-none focus:border-[#F0B429] focus:ring-2 focus:ring-[#F0B429]/20 ${
                          isDark
                            ? 'bg-[#161B27] border border-[#2D3142] text-white placeholder-[#555E78]'
                            : 'bg-white border border-[#CBD5E1] text-[#1A1D27] placeholder-[#94A3B8]'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-1.5 text-[#7B82A0]">
                      Admin Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-[#7B82A0]" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full h-12 pl-11 pr-4 rounded-lg text-[16px] font-sans transition-all focus:outline-none focus:border-[#F0B429] focus:ring-2 focus:ring-[#F0B429]/20 ${
                          isDark
                            ? 'bg-[#161B27] border border-[#2D3142] text-white placeholder-[#555E78]'
                            : 'bg-white border border-[#CBD5E1] text-[#1A1D27] placeholder-[#94A3B8]'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#F0B429] hover:bg-[#f5bc38] text-black font-extrabold text-[16px] font-mono uppercase tracking-wider rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-8"
                  >
                    {loading ? (
                      'AUTHENTICATING...'
                    ) : (
                      <>
                        <Shield className="w-5 h-5 text-black" />
                        <span>ADMIN LOG IN</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Watermark */}
      <footer className="relative z-10 text-center font-mono text-[11px] text-[#555E78] uppercase tracking-widest pt-4">
        EQUITY ARENA · IGNITE 8.0 · India Stock Exchange
      </footer>
    </div>
  );
}
