import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import type { Crop, Expense } from '../types';
import { 
  Calendar, Clock, Plus, Trash2, Sprout 
} from 'lucide-react';

const Calculator: React.FC = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add Expense form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [visitDate, setVisitDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState<string>('');
  const [rate, setRate] = useState<string>('');

  // Fetch all crops on load
  const fetchCrops = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crops');
      setCrops(response.data);
      if (response.data.length > 0) {
        setSelectedCropId(response.data[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load crop cycles. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  // Fetch expenses whenever selected crop changes
  const fetchExpenses = async () => {
    if (!selectedCropId) return;
    try {
      setLoading(true);
      const response = await apiClient.get(`/expenses?crop_id=${selectedCropId}`);
      setExpenses(response.data.filter((exp: Expense) => exp.category === 'TRACTOR'));
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch tractor expenses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedCropId]);

  // Handle new tractor visit submission
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
      const calculatedCost = hoursVal * rateVal;

      const payload = {
        farm_id: selectedCrop.farm_id,
        crop_id: selectedCropId,
        category: 'TRACTOR',
        amount: calculatedCost,
        hours: hoursVal,
        rate_per_hour: rateVal,
        description: `Tractor Work (${hoursVal} hrs @ ₹${rateVal}/hr)`,
        transaction_date: visitDate
      };

      await apiClient.post('/expenses', payload);
      setSuccess('Tractor visit expense recorded successfully!');
      
      // Reset form states
      setHours('');
      setRate('');
      setVisitDate(new Date().toISOString().split('T')[0]);
      setShowAddForm(false);
      
      // Reload list
      await fetchExpenses();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to record tractor visit.');
    } finally {
      setLoading(false);
    }
  };

  // Delete a tractor expense entry
  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this tractor visit?')) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await apiClient.delete(`/expenses/${id}`);
      setSuccess('Tractor visit record deleted.');
      await fetchExpenses();
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete transaction record.');
    } finally {
      setLoading(false);
    }
  };

  // Compute stats
  const totalCost = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalHours = expenses.reduce((acc, curr) => acc + (curr.hours || 0), 0);
  const totalVisits = expenses.length;

  // Auto-calculated cost in form preview
  const liveCost = (parseFloat(hours) || 0) * (parseFloat(rate) || 0);

  const selectedCrop = crops.find(c => c.id === selectedCropId);

  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4 font-sans text-slate-100 flex flex-col gap-6">
      
      {/* Title Header Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center gap-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none"></div>
        <div className="w-12 h-12 bg-gradient-to-tr from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <Sprout className="w-7 h-7 text-emerald-950" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            🚜 Tractor Expense Tracker
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Simple and easy crop-wise logs for tractor visits, rates, and working hours.
          </p>
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-5 py-3.5 rounded-2xl text-xs sm:text-sm text-center shadow-md animate-shake">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 px-5 py-3.5 rounded-2xl text-xs sm:text-sm text-center shadow-md animate-fade-in">
          {success}
        </div>
      )}

      {/* Crop Selector Card */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md flex flex-col gap-3">
        <label className="text-emerald-400 text-xs font-bold uppercase tracking-wider pl-1">
          Select Crop Cycle
        </label>
        {crops.length > 0 ? (
          <select
            value={selectedCropId}
            onChange={(e) => {
              setSelectedCropId(e.target.value);
              setShowAddForm(false);
              setError('');
              setSuccess('');
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer font-bold transition-all duration-200 shadow-inner"
          >
            {crops.map((c) => (
              <option key={c.id} value={c.id}>
                🌾 {c.name} ({c.variety || 'Standard'}) — Sown on {new Date(c.sowing_date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}
              </option>
            ))}
          </select>
        ) : (
          <div className="text-slate-400 text-sm py-2 pl-1">
            No active crop cycles found. Go to the **Crops** tab to sow a crop first.
          </div>
        )}
      </div>

      {selectedCropId && selectedCrop && (
        <div className="flex flex-col gap-6">
          
          {/* Summary Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Total Expense Card */}
            <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/20 p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[120px] transition-transform hover:scale-[1.01] duration-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Tractor Expense</span>
                <span className="text-2xl">🚜</span>
              </div>
              <div>
                <h3 className="text-3xl font-black text-emerald-300">₹{totalCost.toLocaleString('en-IN')}</h3>
                <span className="text-slate-500 text-xs">Total Cost logged</span>
              </div>
            </div>

            {/* Total Hours Card */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-md flex flex-col justify-between min-h-[120px] transition-transform hover:scale-[1.01] duration-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Hours</span>
                <Clock className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-white">{totalHours} Hours</h3>
                <span className="text-slate-500 text-xs">Cumulative operational work</span>
              </div>
            </div>

            {/* Total Visits Card */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-md flex flex-col justify-between min-h-[120px] transition-transform hover:scale-[1.01] duration-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Visits</span>
                <Calendar className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-white">{totalVisits} Visits</h3>
                <span className="text-slate-500 text-xs">Tractor operations recorded</span>
              </div>
            </div>

          </div>

          {/* Add visit / Action Panel */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white pl-1">Tractor Log History</h2>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setError('');
                setSuccess('');
              }}
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-extrabold text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 cursor-pointer shadow-md shadow-emerald-500/10"
            >
              <Plus className="w-4 h-4" />
              {showAddForm ? 'Close Form' : 'Add Tractor Expense'}
            </button>
          </div>

          {/* Add form dialog card */}
          {showAddForm && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg animate-fade-in flex flex-col gap-5">
              <h3 className="text-md font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                ➕ New Tractor Entry
              </h3>

              <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                
                {/* Date */}
                <div className="flex flex-col gap-2">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    required
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Hours worked */}
                <div className="flex flex-col gap-2">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Hours Worked</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    placeholder="e.g. 5"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Rate per hour */}
                <div className="flex flex-col gap-2">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Rate / Hour (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 500"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Live Preview Cost & Submit Button */}
                <div className="md:col-span-3 border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm font-semibold pl-1">
                    Cost Preview: <span className="text-emerald-400 text-lg font-black">₹{liveCost.toLocaleString('en-IN')}</span>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 active:scale-95 disabled:opacity-50 text-emerald-950 font-black text-sm px-6 py-3 rounded-xl cursor-pointer transition-all duration-200 shadow-md shadow-emerald-500/10"
                  >
                    {loading ? 'Recording...' : '💾 Save Tractor Expense'}
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* Visits Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6 text-center">Hours</th>
                    <th className="py-4 px-6 text-right">Rate / Hour</th>
                    <th className="py-4 px-6 text-right">Cost</th>
                    <th className="py-4 px-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {expenses.length > 0 ? (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-850/30 transition-colors text-sm text-slate-200">
                        <td className="py-4 px-6 font-medium">
                          {new Date(exp.transaction_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-4 px-6 text-center text-slate-300 font-bold">
                          {exp.hours || 0} hrs
                        </td>
                        <td className="py-4 px-6 text-right text-slate-400">
                          ₹{(exp.rate_per_hour || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 px-6 text-right text-emerald-300 font-extrabold">
                          ₹{exp.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 px-6 text-center">
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
                      <td colSpan={5} className="py-10 text-center text-slate-500 text-sm">
                        No tractor visits logged for this crop yet. Add one to start tracking!
                      </td>
                    </tr>
                  )}

                  {/* Summary / Total Row */}
                  {expenses.length > 0 && (
                    <tr className="bg-slate-950/40 font-bold border-t-2 border-slate-800 text-sm text-white">
                      <td className="py-4 px-6 text-emerald-400 font-extrabold uppercase">TOTAL</td>
                      <td className="py-4 px-6 text-center text-emerald-400 font-black">{totalHours} hrs</td>
                      <td className="py-4 px-6 text-right"></td>
                      <td className="py-4 px-6 text-right text-emerald-300 font-black text-base">
                        ₹{totalCost.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-6"></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default Calculator;
