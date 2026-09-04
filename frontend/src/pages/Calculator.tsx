import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';
import type { Crop, Expense } from '../types';
import { 
  Calendar, Clock, Plus, Trash2, Sprout, 
  Search, AlertTriangle, X, Check, ArrowRight
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

import { 
  getLocalCrops, deleteLocalCrop,
  getLocalExpenses, saveLocalExpense, deleteLocalExpense
} from '../services/storage';

const QUICK_EQUIPMENT_PRESETS = [
  'Mahindra 575 DI Tractor',
  'John Deere 5310 Tractor',
  'Swaraj 744 FE Tractor',
  'Rotavator Attachment',
  'Disc Plough / Tiller',
  'Paddy Harvester',
  'Power Tiller',
  'Cultivator / Leveler'
];

interface DayGroup {
  date: string;
  totalCost: number;
  totalHours: number;
  entries: Expense[];
}

const Calculator: React.FC = () => {
  const { t } = useTranslation();

  const [crops, setCrops] = useState<Crop[]>(() => getLocalCrops());
  const [selectedCropId, setSelectedCropId] = useState<string>(() => {
    const initialCrops = getLocalCrops();
    return initialCrops.length > 0 ? initialCrops[0].id : '';
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const initialCrops = getLocalCrops();
    const firstCropId = initialCrops.length > 0 ? initialCrops[0].id : undefined;
    return getLocalExpenses(firstCropId).filter(e => e.category === 'TRACTOR');
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add Expense form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [visitDate, setVisitDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [equipmentName, setEquipmentName] = useState<string>('Mahindra 575 DI Tractor');
  const [hours, setHours] = useState<string>('');
  const [rate, setRate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // View switch: 'dayWise' | 'all'
  const [viewMode, setViewMode] = useState<'dayWise' | 'all'>('dayWise');
  const [searchTerm, setSearchTerm] = useState('');

  // Delete crop modal states
  const [showDeleteCropModal, setShowDeleteCropModal] = useState(false);
  const [deleteCropLoading, setDeleteCropLoading] = useState(false);

  // Fetch all crops on load
  const fetchCrops = async () => {
    try {
      setLoading(true);
      try {
        const response = await apiClient.get('/crops');
        if (Array.isArray(response.data) && response.data.length > 0) {
          setCrops(response.data);
          setSelectedCropId(prev => prev && response.data.some((c: Crop) => c.id === prev) ? prev : response.data[0].id);
          return;
        }
      } catch (e) {
        console.warn('Backend crops unavailable, using local store:', e);
      }
      const loaded = getLocalCrops();
      setCrops(loaded);
      if (loaded.length > 0) {
        setSelectedCropId(prev => prev && loaded.some(c => c.id === prev) ? prev : loaded[0].id);
      } else {
        setSelectedCropId('');
      }
    } catch (err: any) {
      console.error(err);
      const loaded = getLocalCrops();
      setCrops(loaded);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  // Fetch expenses whenever selected crop changes
  const fetchExpenses = async () => {
    if (!selectedCropId) {
      setExpenses([]);
      return;
    }
    try {
      setLoading(true);
      try {
        const response = await apiClient.get(`/expenses?crop_id=${selectedCropId}`);
        const tractorList = response.data.filter((exp: Expense) => exp.category === 'TRACTOR');
        if (tractorList.length > 0) {
          tractorList.forEach((exp: Expense) => saveLocalExpense(exp));
        }
      } catch (e) {
        console.warn('Backend expenses unavailable, using local store:', e);
      }
      const localTractor = getLocalExpenses(selectedCropId).filter(e => e.category === 'TRACTOR');
      setExpenses(localTractor);
    } catch (err: any) {
      console.error(err);
      const localTractor = getLocalExpenses(selectedCropId).filter(e => e.category === 'TRACTOR');
      setExpenses(localTractor);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedCropId]);

  // Handle new tractor entry submission
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const hoursVal = parseFloat(hours);
    const rateVal = parseFloat(rate);

    if (isNaN(hoursVal) || hoursVal <= 0) {
      setError('Please enter a valid number of hours.');
      return;
    }

    if (isNaN(rateVal) || rateVal <= 0) {
      setError('Please enter a valid rate per hour.');
      return;
    }

    const selectedCrop = crops.find(c => c.id === selectedCropId);
    if (!selectedCrop) {
      setError('No valid crop selected.');
      return;
    }

    setLoading(true);
    try {
      const calculatedCost = Math.round(hoursVal * rateVal * 100) / 100;
      const equip = equipmentName.trim() || 'Tractor';

      const payload = {
        farm_id: selectedCrop.farm_id,
        crop_id: selectedCropId,
        category: 'TRACTOR',
        amount: calculatedCost,
        hours: hoursVal,
        rate: rateVal,
        equipment_name: equip,
        notes: notes.trim() ? `${equip} - ${notes.trim()}` : equip,
        date: visitDate,
        transaction_date: visitDate
      };

      try {
        await apiClient.post('/expenses', {
          ...payload,
          rate_per_hour: rateVal,
          description: payload.notes
        });
      } catch (backendErr) {
        console.warn('Backend expense create failed, saving locally:', backendErr);
      }

      saveLocalExpense(payload);
      setSuccess(t('tractor.add_entry_success') || 'Tractor expense recorded successfully!');
      
      // Reset form fields
      setHours('');
      setRate('');
      setNotes('');
      setVisitDate(new Date().toISOString().split('T')[0]);
      setShowAddForm(false);
      
      // Reload list from storage
      const localTractor = getLocalExpenses(selectedCropId).filter(e => e.category === 'TRACTOR');
      setExpenses(localTractor);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      console.error(err);
      setError('Failed to record tractor entry.');
    } finally {
      setLoading(false);
    }
  };

  // Delete an individual tractor expense entry
  const handleDeleteExpense = async (id: string) => {
    const confirmMsg = t('tractor.delete_entry_confirm') || 'Are you sure you want to delete this tractor entry?';
    if (!window.confirm(confirmMsg)) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      try {
        await apiClient.delete(`/expenses/${id}`);
      } catch (backendErr) {
        console.warn('Backend delete failed, deleting locally:', backendErr);
      }
      deleteLocalExpense(id);
      setSuccess(t('tractor.delete_entry_success') || 'Tractor entry deleted.');
      const localTractor = getLocalExpenses(selectedCropId).filter(e => e.category === 'TRACTOR');
      setExpenses(localTractor);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete tractor record.');
    } finally {
      setLoading(false);
    }
  };

  // Delete entire crop cycle and purge its expenses
  const handleConfirmDeleteCrop = async () => {
    if (!selectedCropId) return;
    setError('');
    setSuccess('');
    setDeleteCropLoading(true);
    try {
      try {
        await apiClient.delete(`/crops/${selectedCropId}`);
      } catch (backendErr) {
        console.warn('Backend crop delete failed, deleting locally:', backendErr);
      }
      deleteLocalCrop(selectedCropId);
      setShowDeleteCropModal(false);
      setSuccess('Crop cycle and all associated tractor & equipment records have been permanently deleted.');
      const remainingCrops = getLocalCrops();
      setCrops(remainingCrops);
      if (remainingCrops.length > 0) {
        setSelectedCropId(remainingCrops[0].id);
      } else {
        setSelectedCropId('');
      }
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete crop cycle.');
    } finally {
      setDeleteCropLoading(false);
    }
  };

  // Selected Crop Object
  const selectedCrop = useMemo(() => crops.find(c => c.id === selectedCropId), [crops, selectedCropId]);

  // Compute Today's Date String (YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Summary Metrics calculations
  const totalCost = useMemo(() => expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0), [expenses]);
  const totalHours = useMemo(() => expenses.reduce((acc, curr) => acc + Number(curr.hours || 0), 0), [expenses]);
  const totalEntries = expenses.length;

  // Today's summary calculation
  const todayCost = useMemo(() => {
    return expenses
      .filter(exp => exp.transaction_date === todayStr)
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [expenses, todayStr]);

  const todayHours = useMemo(() => {
    return expenses
      .filter(exp => exp.transaction_date === todayStr)
      .reduce((acc, curr) => acc + Number(curr.hours || 0), 0);
  }, [expenses, todayStr]);

  // Auto-calculated live cost in form
  const liveCost = useMemo(() => {
    const h = parseFloat(hours);
    const r = parseFloat(rate);
    if (!isNaN(h) && !isNaN(r) && h > 0 && r > 0) {
      return Math.round(h * r * 100) / 100;
    }
    return 0;
  }, [hours, rate]);

  // Day-wise grouping calculation
  const dayGroups: DayGroup[] = useMemo(() => {
    const map = new Map<string, DayGroup>();

    // Sort expenses chronologically descending
    const sorted = [...expenses].sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());

    sorted.forEach(exp => {
      const d = exp.transaction_date;
      if (!map.has(d)) {
        map.set(d, {
          date: d,
          totalCost: 0,
          totalHours: 0,
          entries: []
        });
      }
      const group = map.get(d)!;
      group.totalCost += Number(exp.amount || 0);
      group.totalHours += Number(exp.hours || 0);
      group.entries.push(exp);
    });

    return Array.from(map.values());
  }, [expenses]);

  // Filtered day groups and entries for search
  const filteredDayGroups = useMemo(() => {
    if (!searchTerm.trim()) return dayGroups;
    const term = searchTerm.toLowerCase();
    return dayGroups.map(group => {
      const matchedEntries = group.entries.filter(e => 
        (e.equipment_name && e.equipment_name.toLowerCase().includes(term)) ||
        (e.description && e.description.toLowerCase().includes(term)) ||
        group.date.includes(term)
      );
      if (matchedEntries.length === 0) return null;
      return {
        ...group,
        entries: matchedEntries,
        totalCost: matchedEntries.reduce((acc, curr) => acc + Number(curr.amount || 0), 0),
        totalHours: matchedEntries.reduce((acc, curr) => acc + Number(curr.hours || 0), 0)
      };
    }).filter(Boolean) as DayGroup[];
  }, [dayGroups, searchTerm]);

  const filteredAllEntries = useMemo(() => {
    if (!searchTerm.trim()) return expenses;
    const term = searchTerm.toLowerCase();
    return expenses.filter(e => 
      (e.equipment_name && e.equipment_name.toLowerCase().includes(term)) ||
      (e.description && e.description.toLowerCase().includes(term)) ||
      e.transaction_date.includes(term)
    );
  }, [expenses, searchTerm]);

  return (
    <div className="max-w-5xl mx-auto p-2 sm:p-4 font-sans text-slate-100 flex flex-col gap-6">
      
      {/* Module Title Header Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="flex items-center gap-4 z-10">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-3xl">
            🚜
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              {t('tractor.title')}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              {t('tractor.subtitle')}
            </p>
          </div>
        </div>

        {selectedCrop && (
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setError('');
              setSuccess('');
            }}
            className="z-10 w-full sm:w-auto bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-slate-950 font-black text-sm px-5 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            {showAddForm ? (
              <>
                <X className="w-5 h-5" />
                {t('tractor.close_form')}
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                {t('tractor.add_expense_btn')}
              </>
            )}
          </button>
        )}
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-200 px-5 py-3.5 rounded-2xl text-xs sm:text-sm flex items-center justify-between shadow-md">
          <span>{error}</span>
          <button onClick={() => setError('')} className="p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 px-5 py-3.5 rounded-2xl text-xs sm:text-sm flex items-center justify-between shadow-md">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            {success}
          </span>
          <button onClick={() => setSuccess('')} className="p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Crop Selector Card */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-lg flex flex-col gap-3">
        <div className="flex justify-between items-center pl-1">
          <label className="text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
            <Sprout className="w-4 h-4" />
            {t('tractor.select_crop')}
          </label>
          {selectedCrop && (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
              {selectedCrop.stage} • {selectedCrop.status}
            </span>
          )}
        </div>

        {crops.length > 0 ? (
          <select
            value={selectedCropId}
            onChange={(e) => {
              setSelectedCropId(e.target.value);
              setShowAddForm(false);
              setError('');
              setSuccess('');
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 px-4 text-white text-sm sm:text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer transition-all duration-200 shadow-inner"
          >
            {crops.map((c) => (
              <option key={c.id} value={c.id}>
                🌾 {c.name} {c.variety ? `(${c.variety})` : ''} — Sown on {new Date(c.sowing_date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}
              </option>
            ))}
          </select>
        ) : (
          <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">{t('tractor.no_crops_title')}</h3>
              <p className="text-slate-400 text-xs mt-1">{t('tractor.no_crops_desc')}</p>
            </div>
            <Link
              to="/crops"
              className="mt-2 bg-emerald-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl hover:bg-emerald-300 transition-colors flex items-center gap-1.5"
            >
              {t('tractor.go_to_crops')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {selectedCropId && selectedCrop && (
        <div className="flex flex-col gap-6">

          {/* Tractor & Equipment Expense Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Today's Tractor Expense */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 rounded-2xl shadow-md flex flex-col justify-between min-h-[125px] hover:border-emerald-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-extrabold uppercase tracking-wider">
                  {t('tractor.today_expense')}
                </span>
                <span className="text-xl">📅</span>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-emerald-400">
                  ₹{todayCost.toLocaleString('en-IN')}
                </h3>
                <span className="text-slate-500 text-xs font-semibold">
                  {todayHours > 0 ? `${todayHours} ${t('tractor.hours_short')} today` : t('tractor.today_expense_sub')}
                </span>
              </div>
            </div>

            {/* Total Tractor Expense So Far */}
            <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 p-5 rounded-2xl shadow-lg flex flex-col justify-between min-h-[125px] hover:scale-[1.01] transition-transform">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 text-[11px] font-extrabold uppercase tracking-wider">
                  {t('tractor.total_expense')}
                </span>
                <span className="text-xl">💰</span>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  ₹{totalCost.toLocaleString('en-IN')}
                </h3>
                <span className="text-emerald-300/70 text-xs font-semibold">
                  {t('tractor.total_expense_sub')}
                </span>
              </div>
            </div>

            {/* Total Hours Used */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 rounded-2xl shadow-md flex flex-col justify-between min-h-[125px] hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-extrabold uppercase tracking-wider">
                  {t('tractor.total_hours')}
                </span>
                <Clock className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {totalHours} <span className="text-base text-slate-400">{t('tractor.hours_short')}</span>
                </h3>
                <span className="text-slate-500 text-xs font-semibold">
                  {t('tractor.total_hours_sub')}
                </span>
              </div>
            </div>

            {/* Crop Info Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 rounded-2xl shadow-md flex flex-col justify-between min-h-[125px] hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-extrabold uppercase tracking-wider truncate">
                  {selectedCrop.name}
                </span>
                <span className="text-xl">🌾</span>
              </div>
              <div>
                <h4 className="text-lg font-black text-white truncate">
                  {totalEntries} {t('tractor.total_records')}
                </h4>
                <span className="text-slate-500 text-xs font-semibold">
                  Sown: {new Date(selectedCrop.sowing_date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})}
                </span>
              </div>
            </div>

          </div>

          {/* Add Tractor Entry Form Modal / Card */}
          {showAddForm && (
            <div className="bg-slate-900 border-2 border-emerald-500/40 p-6 sm:p-7 rounded-3xl shadow-2xl animate-fade-in flex flex-col gap-6 relative">
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <span>🚜</span>
                    {t('tractor.form_title')}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm mt-1">
                    {t('tractor.form_subtitle')}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-col gap-2">
                <label className="text-slate-400 text-xs font-bold uppercase tracking-wider pl-1">
                  {t('tractor.presets_label')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_EQUIPMENT_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEquipmentName(preset)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer border ${
                        equipmentName === preset 
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20' 
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Form */}
              <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Crop Name (Read only indicator) */}
                <div className="flex flex-col gap-2">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {t('tractor.field_crop')}
                  </label>
                  <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-emerald-400 text-sm font-black truncate">
                    🌾 {selectedCrop.name} {selectedCrop.variety ? `(${selectedCrop.variety})` : ''}
                  </div>
                </div>

                {/* Date */}
                <div className="flex flex-col gap-2">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {t('tractor.field_date')}
                  </label>
                  <input
                    type="date"
                    required
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold"
                  />
                </div>

                {/* Equipment / Tractor Name */}
                <div className="flex flex-col gap-2">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {t('tractor.field_equipment')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('tractor.field_equipment_placeholder')}
                    value={equipmentName}
                    onChange={(e) => setEquipmentName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold"
                  />
                </div>

                {/* Hours worked */}
                <div className="flex flex-col gap-2">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {t('tractor.field_hours')}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    placeholder={t('tractor.field_hours_placeholder')}
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-base font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Rate per hour */}
                <div className="flex flex-col gap-2">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {t('tractor.field_rate')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder={t('tractor.field_rate_placeholder')}
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-base font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-2">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    {t('tractor.field_notes')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('tractor.field_notes_placeholder')}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Live Auto Calculation & Submit Section */}
                <div className="md:col-span-3 border-t border-slate-800/80 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/60 -mx-6 -mb-6 p-6 rounded-b-3xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xl font-bold">
                      ₹
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
                        {t('tractor.cost_preview')}
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                        ₹{liveCost.toLocaleString('en-IN')}
                      </span>
                      {liveCost > 0 && (
                        <span className="text-xs text-slate-400 ml-2 font-medium">
                          ({hours || 0} hrs × ₹{rate || 0})
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 disabled:opacity-50 text-slate-950 font-black text-base px-8 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    💾 {loading ? t('tractor.saving') : t('tractor.save_entry_btn')}
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* History Control Bar: Tabs & Search */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* View Switch Tabs */}
            <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-full sm:w-auto">
              <button
                onClick={() => setViewMode('dayWise')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  viewMode === 'dayWise'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4" />
                {t('tractor.view_day_wise')}
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  viewMode === 'all'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
                {t('tractor.view_all_entries')}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search equipment, notes, date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* VIEW 1: DAY-WISE EXPENSE HISTORY WITH AUTOMATIC DAILY TOTALS */}
          {viewMode === 'dayWise' && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center pl-1">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  {t('tractor.history_day_wise')}
                </h3>
                <span className="text-xs text-slate-400 font-bold">
                  {filteredDayGroups.length} Active Days
                </span>
              </div>

              {filteredDayGroups.length > 0 ? (
                filteredDayGroups.map((group) => {
                  const isToday = group.date === todayStr;
                  const dateFormatted = new Date(group.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <div
                      key={group.date}
                      className={`bg-slate-900 border rounded-3xl overflow-hidden shadow-lg transition-all ${
                        isToday ? 'border-emerald-500/40 shadow-emerald-500/5' : 'border-slate-800'
                      }`}
                    >
                      {/* Day Header Banner with Daily Total */}
                      <div className="bg-slate-950/80 border-b border-slate-800 px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg font-black text-white flex items-center gap-2">
                            📅 {dateFormatted}
                          </span>
                          {isToday && (
                            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/40 uppercase tracking-wider">
                              TODAY
                            </span>
                          )}
                        </div>

                        {/* Daily Total Badge (Automatically calculated) */}
                        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl">
                          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                            {t('tractor.daily_total')}:
                          </span>
                          <span className="text-emerald-400 text-base font-black">
                            ₹{group.totalCost.toLocaleString('en-IN')}
                          </span>
                          <span className="text-slate-400 text-xs font-semibold">
                            ({group.totalHours} {t('tractor.hours_short')})
                          </span>
                        </div>
                      </div>

                      {/* Entries for this day */}
                      <div className="p-4 sm:p-5 flex flex-col gap-3">
                        {group.entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="bg-slate-950/60 border border-slate-850 hover:border-slate-750 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl flex-shrink-0">
                                🚜
                              </div>
                              <div>
                                <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                                  {entry.equipment_name || 'Tractor Operation'}
                                </h4>
                                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                                  <span className="text-emerald-400 font-extrabold">
                                    {entry.hours} hrs × ₹{(entry.rate_per_hour || 0).toLocaleString('en-IN')}/hr
                                  </span>
                                  {entry.description && (
                                    <>
                                      <span className="text-slate-600">•</span>
                                      <span className="text-slate-300 italic">
                                        "{entry.description}"
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 self-end sm:self-center border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
                              <div className="text-right">
                                <span className="text-base sm:text-lg font-black text-emerald-300">
                                  ₹{entry.amount.toLocaleString('en-IN')}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteExpense(entry.id)}
                                className="p-2 text-slate-500 hover:text-red-400 rounded-xl hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer"
                                title="Delete Tractor Entry"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center flex flex-col items-center gap-3">
                  <span className="text-4xl">🚜</span>
                  <h4 className="text-white font-bold text-base">{t('tractor.no_entries')}</h4>
                  <p className="text-slate-500 text-xs max-w-md">{t('tractor.add_first_prompt')}</p>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: COMPLETE EXPENSE HISTORY TABLE */}
          {viewMode === 'all' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  {t('tractor.history_complete')}
                </h3>
                <span className="text-xs text-slate-400 font-bold">
                  {filteredAllEntries.length} {t('tractor.total_records')}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">{t('tractor.table_date')}</th>
                      <th className="py-4 px-6">{t('tractor.table_equipment')}</th>
                      <th className="py-4 px-6 text-center">{t('tractor.table_hours')}</th>
                      <th className="py-4 px-6 text-right">{t('tractor.table_rate')}</th>
                      <th className="py-4 px-6 text-right">{t('tractor.table_total')}</th>
                      <th className="py-4 px-6">{t('tractor.table_notes')}</th>
                      <th className="py-4 px-6 text-center">{t('tractor.table_action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {filteredAllEntries.length > 0 ? (
                      filteredAllEntries.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-850/40 transition-colors">
                          <td className="py-4 px-6 font-semibold text-slate-200 whitespace-nowrap">
                            {new Date(exp.transaction_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="py-4 px-6 font-bold text-white whitespace-nowrap">
                            {exp.equipment_name || 'Tractor'}
                          </td>
                          <td className="py-4 px-6 text-center text-slate-300 font-extrabold whitespace-nowrap">
                            {exp.hours || 0} hrs
                          </td>
                          <td className="py-4 px-6 text-right text-slate-400 whitespace-nowrap">
                            ₹{(exp.rate_per_hour || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-4 px-6 text-right text-emerald-300 font-black whitespace-nowrap">
                            ₹{exp.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-4 px-6 text-slate-400 text-xs max-w-xs truncate">
                            {exp.description || '—'}
                          </td>
                          <td className="py-4 px-6 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="p-2 text-slate-500 hover:text-red-400 rounded-xl hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer"
                              title="Delete Visit"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-500 text-sm">
                          {t('tractor.no_entries')}
                        </td>
                      </tr>
                    )}

                    {/* Summary Row */}
                    {filteredAllEntries.length > 0 && (
                      <tr className="bg-slate-950 font-black border-t-2 border-slate-800 text-sm text-white">
                        <td className="py-4 px-6 text-emerald-400 uppercase">
                          TOTAL ({filteredAllEntries.length})
                        </td>
                        <td className="py-4 px-6"></td>
                        <td className="py-4 px-6 text-center text-emerald-400 font-black">
                          {totalHours} hrs
                        </td>
                        <td className="py-4 px-6"></td>
                        <td className="py-4 px-6 text-right text-emerald-300 font-black text-base">
                          ₹{totalCost.toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 px-6"></td>
                        <td className="py-4 px-6"></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CROP LIFECYCLE COMPLETION & DELETE CROP OPTION (DANGER ZONE) */}
          <div className="bg-gradient-to-br from-red-950/20 via-slate-900 to-slate-900 border border-red-500/30 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mt-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  {t('tractor.crop_danger_zone')}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
                  {t('tractor.crop_danger_desc')}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDeleteCropModal(true)}
              className="bg-red-500/10 hover:bg-red-500/20 active:scale-95 text-red-400 hover:text-red-300 border border-red-500/40 font-black text-sm px-6 py-3 rounded-2xl transition-all cursor-pointer whitespace-nowrap self-stretch sm:self-auto text-center"
            >
              🗑️ {t('tractor.delete_crop_btn')}
            </button>
          </div>

        </div>
      )}

      {/* DELETE CROP CONFIRMATION MODAL */}
      {showDeleteCropModal && selectedCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDeleteCropModal(false)}></div>
          
          <div className="relative w-full max-w-lg bg-slate-900 border-2 border-red-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 animate-zoom-in z-10">
            <button
              onClick={() => setShowDeleteCropModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-red-400">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 flex items-center justify-center text-red-400 text-2xl">
                ⚠️
              </div>
              <div>
                <h3 className="text-xl font-black text-white">
                  {t('tractor.delete_crop_modal_title')}
                </h3>
                <p className="text-red-400 text-xs font-bold uppercase tracking-wider">
                  🌾 {selectedCrop.name} {selectedCrop.variety ? `(${selectedCrop.variety})` : ''}
                </p>
              </div>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed">
              {t('tractor.delete_crop_warning')}
            </p>

            {/* Deletion Summary Box */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col gap-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                {t('tractor.delete_crop_summary_label')}
              </span>
              <div className="flex justify-between text-sm py-1 border-b border-slate-850">
                <span className="text-slate-400">Total Tractor Expense:</span>
                <span className="text-red-400 font-black">₹{totalCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b border-slate-850">
                <span className="text-slate-400">Total Machinery Hours:</span>
                <span className="text-white font-bold">{totalHours} hrs</span>
              </div>
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-400">Total Entries / Records:</span>
                <span className="text-white font-bold">{totalEntries} records</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteCropModal(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold py-3 rounded-xl cursor-pointer transition-colors"
              >
                {t('tractor.cancel_btn')}
              </button>
              <button
                type="button"
                disabled={deleteCropLoading}
                onClick={handleConfirmDeleteCrop}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black py-3 rounded-xl cursor-pointer transition-colors shadow-lg shadow-red-600/30"
              >
                {deleteCropLoading ? 'Deleting...' : t('tractor.confirm_delete_crop_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Calculator;
