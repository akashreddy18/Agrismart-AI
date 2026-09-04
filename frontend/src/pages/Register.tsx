import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import type { Language } from '../context/LanguageContext';
import apiClient from '../services/api';
import { Sprout, Phone, Lock, User, Mail, Globe } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const { demoLogin } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/auth/register', {
        phone_number: phoneNumber,
        email: email,
        password: password,
        full_name: fullName,
        preferred_lang: language,
      });

      navigate('/login');
    } catch (err: any) {
      console.warn('Backend registration failed or offline:', err);
      if (!err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        // Fallback to offline account creation
        demoLogin(fullName.trim() || 'Farmer');
        navigate('/');
        return;
      }
      setError(
        err.response?.data?.detail || 'Registration failed. Please verify your details.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-emerald-900 via-green-800 to-teal-950 p-4 relative overflow-hidden font-sans">
      {/* Background Accents */}
      <div className="absolute w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl -top-20 -left-20"></div>
      <div className="absolute w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-3xl -bottom-20 -right-20"></div>

      {/* Language Selector Top Right */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full shadow-lg">
        <Globe className="w-4 h-4 text-emerald-300" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="bg-transparent text-white font-medium text-sm focus:outline-none cursor-pointer"
        >
          <option value="en" className="text-emerald-950">English</option>
          <option value="hi" className="text-emerald-950">हिन्दी</option>
          <option value="te" className="text-emerald-950">తెలుగు</option>
        </select>
      </div>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 flex flex-col items-center">
        {/* Logo */}
        <div className="w-14 h-14 bg-gradient-to-tr from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg mb-3">
          <Sprout className="w-8 h-8 text-emerald-950" />
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">AgriSmart AI</h1>
        <p className="text-emerald-200/80 text-xs mb-6 text-center">
          {t('auth.register_btn')}
        </p>

        {error && (
          <div className="w-full bg-red-500/20 border border-red-500/30 text-red-100 px-4 py-2.5 rounded-xl text-xs mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white text-xs font-semibold uppercase tracking-wider pl-1">
              {t('auth.name')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-5 w-5 text-emerald-300/70" />
              </span>
              <input
                type="text"
                required
                placeholder={t('auth.name')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-white placeholder-emerald-200/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition-all duration-300 text-sm"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white text-xs font-semibold uppercase tracking-wider pl-1">
              {t('auth.phone')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Phone className="h-5 w-5 text-emerald-300/70" />
              </span>
              <input
                type="text"
                required
                placeholder={t('auth.phone')}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-white placeholder-emerald-200/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition-all duration-300 text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white text-xs font-semibold uppercase tracking-wider pl-1">
              {t('auth.email')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-emerald-300/70" />
              </span>
              <input
                type="email"
                required
                placeholder={t('auth.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-white placeholder-emerald-200/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition-all duration-300 text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white text-xs font-semibold uppercase tracking-wider pl-1">
              {t('auth.password')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-emerald-300/70" />
              </span>
              <input
                type="password"
                required
                placeholder={t('auth.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-white placeholder-emerald-200/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition-all duration-300 text-sm"
              />
            </div>
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 text-emerald-950 font-bold py-3 px-4 rounded-2xl shadow-lg transform transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed mt-3 text-base"
          >
            {loading ? t('common.loading') : t('auth.register_btn')}
          </button>
        </form>

        {/* Login redirect */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-emerald-300 hover:text-emerald-200 text-xs font-medium transition-all duration-300 hover:underline"
          >
            {t('auth.has_account')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
