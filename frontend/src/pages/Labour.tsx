import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import type { Farm, Crop, Labour as LabourType } from '../types';
import { Plus, X, Edit, Trash2, Users, Briefcase, Calendar } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

const Labour: React.FC = () => {
  const { t } = useTranslation();

  const [labours, setLabours] = useState<LabourType[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected filters
  const [selectedFarmFilter, setSelectedFarmFilter] = useState('');

  // Modal forms
  const [showModal, setShowModal] = useState(false);
  const [editingLabour, setEditingLabour] = useState<LabourType | null>(null);

  // Form inputs
  const [farmId, setFarmId] = useState('');
  const [cropId, setCropId] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [workType, setWorkType] = useState('Weeding');
  const [daysWorked, setDaysWorked] = useState('');
  const [dailyWage, setDailyWage] = useState('');
  const [recordedDate, setRecordedDate] = useState(new Date().toISOString().split('T')[0]);

  const workTypes = [
    'Sowing',
    'Weeding',
    'Fertilizer Application',
    'Pesticide Spraying',
    'Irrigation Management',
    'Harvesting',
    'Pruning',
    'Ploughing / Land Prep',
    'Transport / Loading',
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const farmsRes = await apiClient.get('/farms');
      setFarms(farmsRes.data);

      const cropsRes = await apiClient.get('/crops');
      setCrops(cropsRes.data);

      if (farmsRes.data.length > 0 && !selectedFarmFilter) {
        setSelectedFarmFilter(farmsRes.data[0].id);
      }

      const url = selectedFarmFilter ? `/labour?farm_id=${selectedFarmFilter}` : '/labour';
      const response = await apiClient.get(url);
      setLabours(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load labour list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedFarmFilter]);

  const openCreateModal = () => {
    setEditingLabour(null);
    setFarmId(selectedFarmFilter || (farms.length > 0 ? farms[0].id : ''));
    setCropId('');
    setWorkerName('');
    setWorkType('Weeding');
    setDaysWorked('');
    setDailyWage('');
    setRecordedDate(new Date().toISOString().split('T')[0]);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (labour: LabourType) => {
    setEditingLabour(labour);
    setFarmId(labour.farm_id);
    setCropId('');
    setWorkerName(labour.worker_name);
    setWorkType(labour.work_type);
    setDaysWorked(labour.days_worked.toString());
    setDailyWage(labour.daily_wage.toString());
    setRecordedDate(labour.recorded_date);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const days = parseInt(daysWorked);
    const wage = parseFloat(dailyWage);

    if (isNaN(days) || isNaN(wage) || days <= 0 || wage <= 0) {
      setError('Please enter valid positive numbers for days and wages.');
      return;
    }

    const payload = {
      farm_id: farmId,
      crop_id: cropId || null,
      worker_name: workerName,
      work_type: workType,
      days_worked: days,
      daily_wage: wage,
      recorded_date: recordedDate,
    };

    try {
      if (editingLabour) {
        await apiClient.put(`/labour/${editingLabour.id}`, payload);
        setSuccess('Worker payout details updated.');
      } else {
        await apiClient.post('/labour/', payload);
        setSuccess('Worker payout details recorded and logged.');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to record worker parameters.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this worker log?')) {
      return;
    }
    try {
      await apiClient.delete(`/labour/${id}`);
      setSuccess('Labour log removed.');
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete labour log.');
    }
  };

  // Filter crops dropdown to match selected farm
  const filteredCrops = farmId ? crops.filter((c) => c.farm_id === farmId && c.status === 'ACTIVE') : crops;

  const totalLabourExpenditure = labours.reduce((acc, curr) => acc + Number(curr.total_cost), 0);

  return (
    <div className="flex flex-col gap-8 font-sans">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-xl gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-1">
            {t('nav.labour')}
          </h1>
          <p className="text-slate-400 text-sm">
            Maintain worker payroll sheets, assign tasks, and monitor overall labor investments.
          </p>
        </div>
        
        {farms.length > 0 && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-350 hover:to-green-455 text-slate-950 px-5 py-3 rounded-2xl font-bold shadow-lg transform transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer self-stretch sm:self-auto justify-center text-center"
          >
            <Plus className="w-5 h-5" />
            Add Labour Log
          </button>
        )}
      </div>

      {/* Filter and Stats Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Select Farm Filter */}
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl shadow-lg flex flex-col gap-2 justify-center col-span-2">
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Select Farm Context</label>
          <select
            value={selectedFarmFilter}
            onChange={(e) => setSelectedFarmFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
          >
            {farms.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Labor cost summary stats card */}
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold">Tally Labour Costs</p>
            <p className="text-2xl font-black text-white">₹{totalLabourExpenditure.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-2xl text-sm text-center">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 px-4 py-3 rounded-2xl text-sm text-center">
          {success}
        </div>
      )}

      {/* Main Labour log Table */}
      {loading ? (
        <div className="text-center py-12 text-emerald-400 font-bold">{t('common.loading')}</div>
      ) : labours.length === 0 ? (
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-12 text-center shadow-xl flex flex-col items-center gap-4">
          <Users className="w-12 h-12 text-slate-600" />
          <h3 className="text-xl font-bold text-white">No Worker Logged</h3>
          <p className="text-slate-500 max-w-sm text-sm">
            {farms.length === 0 ? 'Register a farm first to begin logging workers.' : 'No worker registers found matching selected filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-850 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-850">
                  <th className="py-4 px-6">Worker Name</th>
                  <th className="py-4 px-6">Task Type</th>
                  <th className="py-4 px-6 text-center">Days</th>
                  <th className="py-4 px-6 text-right">Daily Rate</th>
                  <th className="py-4 px-6 text-right">Total Cost</th>
                  <th className="py-4 px-6 text-center">Date</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/50">
                {labours.map((labour) => (
                  <tr key={labour.id} className="hover:bg-slate-850/30 text-sm text-slate-200 transition-colors">
                    <td className="py-4 px-6 font-bold text-white whitespace-nowrap">{labour.worker_name}</td>
                    <td className="py-4 px-6">
                      <span className="bg-slate-800 text-slate-300 font-semibold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 w-fit">
                        <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                        {labour.work_type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center font-semibold">{labour.days_worked}</td>
                    <td className="py-4 px-6 text-right font-medium">₹{labour.daily_wage.toFixed(2)}</td>
                    <td className="py-4 px-6 text-right font-black text-emerald-400">₹{labour.total_cost.toFixed(2)}</td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <span className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(labour.recorded_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEditModal(labour)}
                          className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 cursor-pointer transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(labour.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Labour Record Entry Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-6 animate-zoom-in">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white">
              {editingLabour ? 'Edit Worker Parameters' : 'Log Worker Payout'}
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Select Farm */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Target Farm</label>
                  <select
                    disabled={editingLabour !== null}
                    value={farmId}
                    onChange={(e) => {
                      setFarmId(e.target.value);
                      setCropId(''); // Reset crop selection
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer disabled:cursor-not-allowed"
                    required
                  >
                    <option value="" disabled>Select Farm</option>
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                {/* Auto Sync crop expenses (Available in creation mode only) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Link to Crop (Optional)</label>
                  <select
                    disabled={editingLabour !== null}
                    value={cropId}
                    onChange={(e) => setCropId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <option value="">Do not log as crop expense</option>
                    {filteredCrops.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.variety || 'No variety'})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Worker Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Worker Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anil Kumar"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Task Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Task Category</label>
                  <select
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                  >
                    {workTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Work Date</label>
                  <input
                    type="date"
                    required
                    value={recordedDate}
                    onChange={(e) => setRecordedDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Days Worked */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Days Worked</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5"
                    value={daysWorked}
                    onChange={(e) => setDaysWorked(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Daily Wage */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Daily Payout Rate (₹)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 400.00"
                    value={dailyWage}
                    onChange={(e) => setDailyWage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Wage preview */}
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex justify-between items-center mt-2">
                <span className="text-xs text-slate-500 font-semibold">Calculated Total Wages:</span>
                <span className="text-base font-black text-emerald-400">
                  ₹{((parseInt(daysWorked) || 0) * (parseFloat(dailyWage) || 0)).toFixed(2)}
                </span>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-350 hover:to-green-455 text-slate-950 font-bold py-3.5 px-4 rounded-2xl shadow-lg mt-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5"
              >
                {editingLabour ? 'Save Changes' : 'Record Worker'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Labour;
