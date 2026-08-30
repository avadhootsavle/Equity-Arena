import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../services/api';
import { User, Lock, Mail, ArrowRight, Zap, Shield, Sun, Moon, Phone } from 'lucide-react';

export function Login() {
  const [activeTab, setActiveTab] = useState('TRADER_SIGNIN'); // 'TRADER_SIGNIN', 'ADMIN'
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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
      {/* HEADER */}
      <header className="flex items-center justify-between z-10 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div
            onClick={handleSecretTriggerClick}
            className="w-10 h-10 rounded-xl bg-[#F0B429] flex items-center justify-center shadow-lg shadow-[#F0B429]/20 cursor-pointer transition-transform hover:scale-105 active:scale-95"
            title="Equity Arena"
          >
            <Zap className="w-6 h-6 text-black fill-black" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-wider font-mono">EQUITY ARENA</h1>
            <p className="text-[10px] text-[#7B82A0] font-mono tracking-widest uppercase">
              Live Stock Market Simulation
            </p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className={`p-2.5 rounded-xl border transition-all ${
            isDark
              ? 'bg-[#161B27] border-[#2D3142] text-[#F0F2FF] hover:bg-[#1E2333]'
              : 'bg-white border-[#CBD5E1] text-[#1A1D27] hover:bg-[#F1F5F9]'
          }`}
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* MAIN CONTAINER */}
      <main className="z-10 max-w-5xl mx-auto w-full my-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* LEFT HERO COLUMN */}
          <div className="md:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F0B429]/10 border border-[#F0B429]/30 text-[#F0B429] font-mono text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#F0B429] animate-pulse" />
              <span>OFFICIAL TOURNAMENT TRADING FLOOR</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Trade Real-Time Markets with <span className="text-[#F0B429]">20,000 IC</span> Cash
            </h2>

            <p className="text-sm sm:text-base text-[#7B82A0] font-mono leading-relaxed">
              Log in with your registered Email and Phone Number to access your tournament trading portal.
            </p>

            {/* QUICK FEATURES */}
            <div className="grid grid-cols-2 gap-4 pt-4 font-mono text-xs">
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#121622] border-[#2D3142]' : 'bg-white border-[#E2E6F0]'}`}>
                <div className="font-extrabold text-[#F0B429] text-base mb-1">20,000 IC</div>
                <div className="text-[#7B82A0]">Starting Balance</div>
              </div>
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#121622] border-[#2D3142]' : 'bg-white border-[#E2E6F0]'}`}>
                <div className="font-extrabold text-[#22C55E] text-base mb-1">15 STOCKS</div>
                <div className="text-[#7B82A0]">Live Order Book</div>
              </div>
            </div>
          </div>

          {/* RIGHT LOGIN CARD */}
          <div className="md:col-span-6">
            <div
              className={`p-6 sm:p-8 rounded-2xl border shadow-2xl transition-all ${
                isDark
                  ? 'bg-[#0F1117] border-[#1E2333] text-white shadow-2xl'
                  : 'bg-white border-[#E2E6F0] text-[#1A1D27] shadow-[0_4px_24px_rgba(0,0,0,0.08)]'
              }`}
            >
              {/* TAB STRIP: TRADER LOG IN & ADMIN */}
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
                  Trader Login
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

              {/* TRADER FORM (Email + Phone Number) */}
              {activeTab !== 'ADMIN' && (
                <form onSubmit={handleTraderSubmit} className="space-y-5 font-mono">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#7B82A0]">
                      Your Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-[#7B82A0]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={`w-full h-12 pl-11 pr-4 rounded-lg text-[15px] font-sans transition-all focus:outline-none focus:border-[#F0B429] focus:ring-2 focus:ring-[#F0B429]/20 ${
                          isDark
                            ? 'bg-[#161B27] border border-[#2D3142] text-white placeholder-[#555E78]'
                            : 'bg-white border border-[#CBD5E1] text-[#1A1D27] placeholder-[#94A3B8]'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#7B82A0]">
                      Your Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 w-5 h-5 text-[#7B82A0]" />
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="9876543210"
                        className={`w-full h-12 pl-11 pr-4 rounded-lg text-[15px] font-sans transition-all focus:outline-none focus:border-[#F0B429] focus:ring-2 focus:ring-[#F0B429]/20 ${
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
                    className="w-full h-12 bg-[#F0B429] hover:bg-[#f5bc38] text-black font-extrabold text-[15px] font-mono uppercase tracking-wider rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-6 cursor-pointer"
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
                      <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-[#7B82A0]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@test.com"
                        className={`w-full h-12 pl-11 pr-4 rounded-lg text-[15px] font-sans transition-all focus:outline-none focus:border-[#F0B429] focus:ring-2 focus:ring-[#F0B429]/20 ${
                          isDark
                            ? 'bg-[#161B27] border border-[#2D3142] text-white placeholder-[#555E78]'
                            : 'bg-white border border-[#CBD5E1] text-[#1A1D27] placeholder-[#94A3B8]'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#7B82A0]">
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
                        className={`w-full h-12 pl-11 pr-4 rounded-lg text-[15px] font-sans transition-all focus:outline-none focus:border-[#F0B429] focus:ring-2 focus:ring-[#F0B429]/20 ${
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
                    className="w-full h-12 bg-[#F0B429] hover:bg-[#f5bc38] text-black font-extrabold text-[15px] font-mono uppercase tracking-wider rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-6 cursor-pointer"
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
      <footer className="z-10 max-w-6xl mx-auto w-full text-center text-xs font-mono text-[#7B82A0] pt-4">
        Equity Arena • Real-Time Stock Market Trading Terminal • Ignite 8.0
      </footer>
    </div>
  );
}
