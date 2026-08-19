import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import apiClient from '../services/api';
import { Phone, Mail, Calendar, Settings, Edit2, Check, X, Lock } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, login } = useAuth();
  const { t } = useTranslation();

  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updatePayload: Record<string, string> = {
        full_name: fullName,
        email: email,
        phone_number: phoneNumber,
      };

      if (password) {
        updatePayload.password = password;
      }

      const token = localStorage.getItem('token') || '';
      const response = await apiClient.put('/auth/profile', updatePayload);
      
      // Update global context state
      login(token, response.data);
      
      setSuccess('Profile updated successfully!');
      setEditMode(false);
      setPassword('');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFullName(user?.full_name || '');
    setEmail(user?.email || '');
    setPhoneNumber(user?.phone_number || '');
    setPassword('');
    setError('');
    setEditMode(false);
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 font-sans">
      {/* Profile Header Card */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl p-8 shadow-xl flex flex-col items-center relative overflow-hidden">
        <div className="absolute w-[200px] h-[200px] bg-emerald-500/5 rounded-full blur-3xl -top-10 -left-10"></div>
        {/* Avatar */}
        <div className="w-24 h-24 bg-gradient-to-tr from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-slate-950 font-black text-4xl shadow-lg mb-4 relative z-10">
          {user?.full_name?.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-2xl font-bold text-white mb-1 relative z-10">{user?.full_name}</h2>
        <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider relative z-10">Farmer Profile</span>
      </div>

      {/* Profile Settings Form */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            Account Parameters
          </h3>
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-2 bg-slate-850 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-bold border border-slate-800 cursor-pointer transition-all duration-300"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Settings
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 bg-slate-850 hover:bg-slate-800 text-slate-400 px-3.5 py-1.5 rounded-full text-xs font-bold border border-slate-800 cursor-pointer transition-all duration-300"
              >
                <X className="w-3.5 h-3.5" />
                {t('common.cancel')}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-2.5 rounded-xl text-xs text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 px-4 py-2.5 rounded-xl text-xs text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleUpdate} className="flex flex-col gap-5">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">
              {t('auth.name')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                <Settings className="h-5 w-5 text-slate-500" />
              </span>
              <input
                type="text"
                disabled={!editMode}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 disabled:bg-slate-950/40 border border-slate-800 disabled:border-slate-850/50 rounded-2xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300"
                required
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">
              {t('auth.phone')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                <Phone className="h-5 w-5 text-slate-500" />
              </span>
              <input
                type="text"
                disabled={!editMode}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-slate-950 disabled:bg-slate-950/40 border border-slate-800 disabled:border-slate-850/50 rounded-2xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300"
                required
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">
              {t('auth.email')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                <Mail className="h-5 w-5 text-slate-500" />
              </span>
              <input
                type="email"
                disabled={!editMode}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 disabled:bg-slate-950/40 border border-slate-800 disabled:border-slate-850/50 rounded-2xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300"
                required
              />
            </div>
          </div>

          {/* Sowing member details / static info */}
          {!editMode ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">
                Account Created On
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                  <Calendar className="h-5 w-5 text-slate-500" />
                </span>
                <input
                  type="text"
                  disabled
                  value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  className="w-full bg-slate-950/30 border border-slate-850/50 rounded-2xl py-3 pl-11 pr-4 text-slate-400 text-sm cursor-not-allowed"
                />
              </div>
            </div>
          ) : (
            /* Update Password Input in Edit Mode */
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">
                New Password (Optional)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                  <Lock className="h-5 w-5 text-slate-500" />
                </span>
                <input
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300"
                />
              </div>
            </div>
          )}

          {/* Submit Action Buttons in Edit Mode */}
          {editMode && (
            <div className="flex gap-4 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 text-slate-950 font-bold py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
                {loading ? t('common.loading') : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profile;
