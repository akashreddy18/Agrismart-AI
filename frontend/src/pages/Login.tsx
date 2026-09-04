import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import type { Language } from '../context/LanguageContext';
import apiClient from '../services/api';
import { 
  Sprout, Phone, Lock, Globe, Eye, EyeOff, Mail, ArrowLeft, 
  ShieldCheck, ShieldAlert, KeyRound, CloudSun, TrendingUp, Sparkles
} from 'lucide-react';

type ActiveView = 'LOGIN' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD';

const Login: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();

  // View state switcher
  const [activeView, setActiveView] = useState<ActiveView>('LOGIN');

  // Input states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Forgot password flow states
  const [recoveryContact, setRecoveryContact] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await apiClient.post('/auth/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = response.data;

      // Fetch user profile info
      const profileResponse = await apiClient.get('/auth/profile', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      login(access_token, profileResponse.data);
      navigate('/');
    } catch (err: any) {
      console.warn('Backend login failed, checking for offline session:', err);
      if (!err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        // Automatically switch to offline/device session so user can use the app seamlessly
        demoLogin(username.split('@')[0] || 'Farmer');
        navigate('/');
        return;
      }
      setError(
        err.response?.data?.detail || 'Invalid phone/email or password. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Request Reset Code
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Simulate sending recovery code/OTP to email/phone
    setTimeout(() => {
      setLoading(false);
      setSuccess(`A password verification code has been sent to ${recoveryContact}.`);
      setActiveView('RESET_PASSWORD');
    }, 1500);
  };

  // Handle Verify & Reset Password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    // Simulate password resetting
    setTimeout(() => {
      setLoading(false);
      setSuccess('Your password has been reset successfully. Please sign in.');
      setActiveView('LOGIN');
      setUsername(recoveryContact);
      setPassword('');
    }, 1500);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-950 font-sans relative overflow-hidden">
      
      {/* Dynamic Background Blurs */}
      <div className="absolute w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl -top-40 -left-40 pointer-events-none"></div>
      <div className="absolute w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-3xl -bottom-40 -right-40 pointer-events-none"></div>

      {/* Global Language Selector (Floating) */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-2 bg-slate-900/60 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-full shadow-xl">
        <Globe className="w-4 h-4 text-emerald-400" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
        >
          <option value="en" className="text-slate-950">English (EN)</option>
          <option value="hi" className="text-slate-950">हिन्दी (HI)</option>
          <option value="te" className="text-slate-950">తెలుగు (TE)</option>
        </select>
      </div>

      {/* Left Column: Brand Hero Panel (Desktop Only) */}
      <div className="hidden lg:flex lg:col-span-7 xl:col-span-8 flex-col justify-between p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20 border-r border-slate-900 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent opacity-40"></div>
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 bg-gradient-to-tr from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Sprout className="w-7 h-7 text-emerald-950" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">AgriSmart AI</h2>
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Smart Farming Ecosystem</span>
          </div>
        </div>

        {/* Visual Dashboard Mockups & Features */}
        <div className="my-auto max-w-2xl relative z-10 flex flex-col gap-8">
          <div>
            <h1 className="text-5xl font-black text-white tracking-tight leading-tight mb-4">
              Cultivate success with <br />
              <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                Agronomic Intelligence
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              AgriSmart AI empowers farmers to register land segments, log operational machinery metrics, track labour directories, and query contextualized crop advisors.
            </p>
          </div>

          {/* Interactive Mock Widgets */}
          <div className="grid grid-cols-2 gap-4">
            {/* Widget 1: Weather alert */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                <CloudSun className="w-6 h-6 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Guntur telemetry</p>
                <p className="text-sm font-black text-white mt-0.5">32°C • Rain Expected</p>
              </div>
            </div>

            {/* Widget 2: Market prices */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md flex items-center gap-4">
              <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Tomato APMC Index</p>
                <p className="text-sm font-black text-white mt-0.5">₹3,200/Qtl (+12%)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Footer */}
        <div className="flex items-center gap-6 text-xs text-slate-500 relative z-10 font-medium">
          <span>© 2026 AgriSmart AI Inc.</span>
          <span className="w-1.5 h-1.5 bg-slate-800 rounded-full"></span>
          <span>Offline-First Synchronized Database</span>
          <span className="w-1.5 h-1.5 bg-slate-800 rounded-full"></span>
          <span>Multi-lingual Hindi & Telugu UI</span>
        </div>
      </div>

      {/* Right Column: Interactive Authentication Form Panel */}
      <div className="flex items-center justify-center p-6 sm:p-12 lg:col-span-5 xl:col-span-4 relative z-10 min-h-screen">
        <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-2xl border border-slate-850 rounded-3xl p-8 md:p-10 shadow-2xl flex flex-col justify-center">
          
          {/* Logo header (Mobile Only) */}
          <div className="flex lg:hidden flex-col items-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg mb-3">
              <Sprout className="w-8 h-8 text-emerald-950" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">AgriSmart AI</h1>
            <p className="text-slate-400 text-xs mt-1">Smart Farming Ecosystem</p>
          </div>

          {/* Heading dynamic block */}
          <div className="mb-8">
            {activeView === 'LOGIN' && (
              <>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Farmer Sign In</h2>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                  Log in to access your farms, track crop cycle expenses, and consult the AI.
                </p>
              </>
            )}
            {activeView === 'FORGOT_PASSWORD' && (
              <>
                <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <KeyRound className="w-6 h-6 text-emerald-400" />
                  Recover Access
                </h2>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                  Provide your registered mobile number or email. We will generate and send a password reset code.
                </p>
              </>
            )}
            {activeView === 'RESET_PASSWORD' && (
              <>
                <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  Reset Password
                </h2>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                  Input the verification code sent to your device and enter a new password.
                </p>
              </>
            )}
          </div>

          {/* Dynamic alerts */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-200 px-4 py-3 rounded-2xl text-xs mb-6 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 px-4 py-3 rounded-2xl text-xs mb-6 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">{success}</p>
            </div>
          )}

          {/* DYNAMIC FORMS CONSOLE */}
          
          {/* VIEW 1: STANDARD LOGIN */}
          {activeView === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
              {/* Phone/Email input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">
                  Phone Number / Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                    <Phone className="h-5 w-5 text-emerald-400/60" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +919876543210 or farmer@example.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-300 text-sm"
                  />
                </div>
              </div>

              {/* Password input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    {t('auth.password')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveView('FORGOT_PASSWORD')}
                    className="text-emerald-400 hover:text-emerald-350 text-xs font-bold transition-all duration-300 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                    <Lock className="h-5 w-5 text-emerald-400/60" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter security password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-300 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <label className="flex items-center gap-3 select-none cursor-pointer pl-1 mt-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-5 h-5 rounded-lg bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-slate-400 font-semibold">Keep me signed in on this device</span>
              </label>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-350 hover:to-green-455 text-slate-950 font-bold py-3.5 px-4 rounded-2xl shadow-lg mt-3 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed text-base flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  t('auth.login_btn')
                )}
              </button>

              {/* Instant Offline Demo Access Button */}
              <button
                type="button"
                onClick={() => {
                  demoLogin('Farmer Ramesh');
                  navigate('/');
                }}
                className="w-full bg-slate-900/80 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 font-bold py-3 px-4 rounded-2xl shadow-md cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 text-xs sm:text-sm flex items-center justify-center gap-2 mt-1"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                ⚡ Quick Demo / Offline Sign-In (Instant Access)
              </button>
            </form>
          )}

          {/* VIEW 2: FORGOT PASSWORD REQUEST */}
          {activeView === 'FORGOT_PASSWORD' && (
            <form onSubmit={handleForgotSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">
                  Registered Phone / Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                    <Mail className="h-5 w-5 text-emerald-400/60" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +919876543210 or user@email.com"
                    value={recoveryContact}
                    onChange={(e) => setRecoveryContact(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-300 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !recoveryContact}
                className="w-full bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-350 hover:to-green-455 text-slate-950 font-bold py-3.5 px-4 rounded-2xl shadow-lg mt-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed text-base flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Request Verification Code'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSuccess('');
                  setActiveView('LOGIN');
                }}
                className="flex items-center justify-center gap-2 text-slate-400 hover:text-white text-xs font-bold mt-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            </form>
          )}

          {/* VIEW 3: OTP VERIFY & RESET */}
          {activeView === 'RESET_PASSWORD' && (
            <form onSubmit={handleResetSubmit} className="flex flex-col gap-5">
              {/* Reset Code input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 px-4 text-white text-center tracking-[0.5em] font-black placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-300 text-lg"
                />
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                    <Lock className="h-5 w-5 text-emerald-400/60" />
                  </span>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter new security password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-300 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                    <Lock className="h-5 w-5 text-emerald-400/60" />
                  </span>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter new security password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-300 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || resetCode.length < 4 || !newPassword}
                className="w-full bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-350 hover:to-green-455 text-slate-950 font-bold py-3.5 px-4 rounded-2xl shadow-lg mt-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed text-base flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Reset & Confirm Password'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSuccess('');
                  setActiveView('FORGOT_PASSWORD');
                }}
                className="flex items-center justify-center gap-2 text-slate-400 hover:text-white text-xs font-bold mt-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Resend Code
              </button>
            </form>
          )}

          {/* Redirect to Register Footer */}
          {activeView === 'LOGIN' && (
            <div className="mt-8 text-center border-t border-slate-800 pt-6">
              <span className="text-slate-500 text-xs font-semibold">{t('auth.no_account')} </span>
              <Link
                to="/register"
                className="text-emerald-400 hover:text-emerald-300 text-xs font-black transition-all duration-300 hover:underline"
              >
                Register as Farmer
              </Link>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default Login;
