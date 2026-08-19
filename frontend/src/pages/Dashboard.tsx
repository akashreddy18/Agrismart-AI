import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { Sprout, TrendingUp, DollarSign, CloudSun, MapPin } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  // Mock stats for dashboard visualization
  const stats = [
    { name: t('dashboard.total_farms'), value: '2', icon: MapPin, color: 'from-emerald-400 to-green-500' },
    { name: t('dashboard.running_crops'), value: '3', icon: Sprout, color: 'from-cyan-400 to-blue-500' },
    { name: t('dashboard.total_expenses'), value: '₹14,250.00', icon: DollarSign, color: 'from-amber-400 to-orange-500' },
    { name: t('dashboard.expected_income'), value: '₹45,000.00', icon: TrendingUp, color: 'from-purple-400 to-pink-500' },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-slate-400 text-sm md:text-base">
            Optimize your crop lifecycle with AI insights and tracking systems.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 px-5 py-4 rounded-2xl md:self-center">
          <CloudSun className="w-10 h-10 text-emerald-400 animate-pulse" />
          <div>
            <p className="text-xs text-emerald-400 font-semibold tracking-wider uppercase">Guntur, India</p>
            <p className="text-lg font-bold text-white">32°C • Partly Cloudy</p>
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-850 rounded-2xl p-6 flex items-center justify-between shadow-lg hover:border-slate-800 hover:scale-[1.02] transition-all duration-300"
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-400 font-semibold">{stat.name}</span>
                <span className="text-2xl font-black text-white">{stat.value}</span>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${stat.color} flex items-center justify-center shadow-md`}>
                <Icon className="w-6 h-6 text-slate-950" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Crops Widget */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <h3 className="text-lg font-bold text-white">Active Farm Cycles</h3>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Tomato (Arka Rakshak)</h4>
                  <p className="text-xs text-slate-500">Sown on: 2026-07-01 • Expected Harvest: Oct 15</p>
                </div>
              </div>
              <span className="text-xs bg-emerald-400/20 text-emerald-300 px-3 py-1 rounded-full font-bold uppercase">
                Vegetative
              </span>
            </div>

            <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Maize (Hybrid HQPM1)</h4>
                  <p className="text-xs text-slate-500">Sown on: 2026-06-15 • Expected Harvest: Sep 30</p>
                </div>
              </div>
              <span className="text-xs bg-cyan-400/20 text-cyan-300 px-3 py-1 rounded-full font-bold uppercase">
                Flowering
              </span>
            </div>
          </div>
        </div>

        {/* AI Advisory Panel */}
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <h3 className="text-lg font-bold text-white">Daily AI Advisory</h3>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Weather Warning</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Expect rain showers starting tomorrow afternoon. Postpone any planned pesticide spray schedules until Thursday to avoid run-off.
            </p>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Market Alert</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tomato prices in Bowenpally market increased by 8% this morning. If your crop is ready, consider harvesting early.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
