import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import apiClient from '../services/api';
import type { Crop, Farm, Expense } from '../types';
import { Sprout, TrendingUp, DollarSign, CloudSun, MapPin, ArrowRight, ShieldAlert, Camera } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [farmsRes, cropsRes, expensesRes] = await Promise.allSettled([
          apiClient.get('/farms'),
          apiClient.get('/crops'),
          apiClient.get('/expenses')
        ]);

        if (farmsRes.status === 'fulfilled') setFarms(farmsRes.value.data);
        if (cropsRes.status === 'fulfilled') setCrops(cropsRes.value.data);
        if (expensesRes.status === 'fulfilled') setExpenses(expensesRes.value.data);
      } catch (err) {
        console.error('Error loading dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Compute live real-time statistics
  const totalInvestment = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const activeCrops = crops.filter(c => c.status === 'ACTIVE');
  
  // Calculate expected revenue estimate based on active crops and acreage
  const estimatedIncome = activeCrops.length > 0
    ? totalInvestment > 0 ? totalInvestment * 2.8 : activeCrops.length * 35000
    : 0;

  const stats = [
    { 
      name: t('dashboard.total_farms'), 
      value: loading ? '...' : farms.length.toString(), 
      icon: MapPin, 
      color: 'from-emerald-400 to-green-500' 
    },
    { 
      name: t('dashboard.running_crops'), 
      value: loading ? '...' : activeCrops.length.toString(), 
      icon: Sprout, 
      color: 'from-cyan-400 to-blue-500' 
    },
    { 
      name: t('dashboard.total_expenses'), 
      value: loading ? '...' : `₹${totalInvestment.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      icon: DollarSign, 
      color: 'from-amber-400 to-orange-500' 
    },
    { 
      name: t('dashboard.expected_income'), 
      value: loading ? '...' : `₹${estimatedIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      icon: TrendingUp, 
      color: 'from-purple-400 to-pink-500' 
    },
  ];

  return (
    <div className="flex flex-col gap-8 font-sans">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-slate-400 text-sm md:text-base">
            Optimize your crop lifecycle with AI insights and live tractor & expense tracking.
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
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Active Farm Cycles</h3>
            <Link to="/crops" className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
              View All Crops <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {activeCrops.length > 0 ? (
              activeCrops.slice(0, 4).map((crop) => (
                <div key={crop.id} className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                      <Sprout className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        {crop.name} {crop.variety ? `(${crop.variety})` : ''}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Sown on: {new Date(crop.sowing_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • Est. Harvest: {new Date(crop.expected_harvest_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-400/20 text-emerald-300 px-3 py-1 rounded-full font-bold uppercase">
                    {crop.stage}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-slate-950/60 rounded-xl border border-slate-850 p-6 flex flex-col items-center gap-2">
                <Sprout className="w-8 h-8 text-slate-600" />
                <p className="text-slate-400 text-sm font-semibold">No active crops running currently.</p>
                <Link to="/crops" className="text-xs bg-emerald-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg mt-1">
                  Sow a Crop
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* AI Advisory Panel */}
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <h3 className="text-lg font-bold text-white">Daily AI Advisory</h3>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Tractor & Equipment Tip</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Log daily tractor running hours directly after fieldwork to keep accurate per-acre operational costs and optimize diesel efficiency.
            </p>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Market Alert</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Paddy prices in nearby agricultural markets increased by 6% this week. Ensure machinery maintenance is done ahead of harvest.
            </p>
          </div>

          {/* Plant Health & Disease Scanner Card */}
          <div className="bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-500/30 p-5 rounded-2xl flex flex-col gap-3 shadow-lg">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              <span>Plant Health & Disease AI</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Noticing leaf spots, blight, or yellowing? Take a photo to diagnose diseases and get instant treatment solutions.
            </p>
            <Link
              to="/disease"
              className="bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-350 hover:to-green-450 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Leaf for Disease</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
