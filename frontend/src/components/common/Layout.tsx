import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import type { Language } from '../../context/LanguageContext';
import {
  Sprout,
  LayoutDashboard,
  Map,
  Receipt,
  Calculator,
  Users,
  Compass,
  MessageSquare,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Globe,
  Droplet,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: t('nav.dashboard'), path: '/', icon: LayoutDashboard },
    { name: t('nav.farms'), path: '/farms', icon: Map },
    { name: t('nav.expenses'), path: '/expenses', icon: Receipt },
    { name: t('nav.calculator'), path: '/calculator', icon: Calculator },
    { name: t('nav.disease'), path: '/disease', icon: ShieldAlert },
    { name: t('nav.labour'), path: '/labour', icon: Users },
    { name: t('nav.fertilizer'), path: '/fertilizer', icon: Sprout },
    { name: t('nav.irrigation'), path: '/irrigation', icon: Droplet },
    { name: t('nav.market'), path: '/market', icon: Compass },
    { name: t('nav.predictions'), path: '/predictions', icon: Sparkles },
    { name: t('nav.assistant'), path: '/assistant', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900 border-r border-slate-800 p-6 flex-shrink-0">
        <div className="flex items-center gap-3 mb-10 pl-2">
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-md">
            <Sprout className="w-6 h-6 text-emerald-950" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">AgriSmart AI</h2>
            <span className="text-xs text-emerald-400 font-medium">Smart Farming</span>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/10 border-l-4 border-emerald-400 text-emerald-300'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : ''}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 pt-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
              <UserIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user?.full_name}</p>
              <Link to="/profile" className="text-xs text-slate-500 hover:text-emerald-400 transition-colors">
                View Profile
              </Link>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 rounded-2xl font-semibold text-red-400 hover:bg-red-500/10 transition-all duration-300 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
          
          <aside className="relative flex flex-col w-72 bg-slate-900 h-full p-6 border-r border-slate-800 animate-slide-in">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-8 pl-2 mt-4">
              <div className="w-9 h-9 bg-gradient-to-tr from-emerald-400 to-green-500 rounded-lg flex items-center justify-center">
                <Sprout className="w-5 h-5 text-emerald-950" />
              </div>
              <h2 className="text-lg font-bold text-white">AgriSmart AI</h2>
            </div>

            <nav className="flex-1 flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border-l-4 border-emerald-400'
                        : 'text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-slate-800 pt-4 flex flex-col gap-3">
              <div className="flex items-center gap-3 pl-2">
                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-white truncate">{user?.full_name}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 px-4 py-3 rounded-xl font-semibold text-red-400 hover:bg-red-500/10 transition-all duration-300 cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                {t('nav.logout')}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between lg:justify-end gap-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-200"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            {/* Global Language Selector */}
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full">
              <Globe className="w-4 h-4 text-emerald-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="en" className="text-slate-950">EN</option>
                <option value="hi" className="text-slate-950">HI</option>
                <option value="te" className="text-slate-950">TE</option>
              </select>
            </div>

            {/* Profile trigger */}
            <div
              onClick={() => navigate('/profile')}
              className="hidden sm:flex items-center gap-2 bg-slate-800 hover:bg-slate-750 px-3.5 py-1.5 rounded-full border border-slate-700 cursor-pointer transition-all duration-300"
            >
              <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-emerald-950 font-bold text-xs">
                {user?.full_name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-slate-200">{user?.full_name}</span>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-950">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
