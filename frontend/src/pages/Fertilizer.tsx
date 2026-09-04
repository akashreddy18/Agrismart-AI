import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import type { Farm, Crop } from '../types';
import { Plus, X, Trash2, Calendar, DollarSign } from 'lucide-react';

interface FertilizerLog {
  id: string;
  crop_id: string;
  fertilizer_name: string;
  quantity_kg: number;
  cost: number;
  application_date: string;
}

const Fertilizer: React.FC = () => {

  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [logs, setLogs] = useState<FertilizerLog[]>([]);

  const [selectedFarm, setSelectedFarm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [fertilizerName, setFertilizerName] = useState('');
  const [quantityKg, setQuantityKg] = useState('');
  const [cost, setCost] = useState('');
  const [applicationDate, setApplicationDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const farmsRes = await apiClient.get('/farms');
      setFarms(farmsRes.data);

      const cropsRes = await apiClient.get('/crops');
      setCrops(cropsRes.data);

      if (farmsRes.data.length > 0 && !selectedFarm) {
        setSelectedFarm(farmsRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve farm listings.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    if (!selectedCrop) {
      setLogs([]);
      return;
    }
    try {
      const response = await apiClient.get(`/fertilizer/crop/${selectedCrop}`);
      setLogs(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch fertilizer history.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [selectedCrop]);

  const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFarm(e.target.value);
    setSelectedCrop('');
    setLogs([]);
  };

  const openModal = () => {
    setFertilizerName('');
    setQuantityKg('');
    setCost('');
    setApplicationDate(new Date().toISOString().split('T')[0]);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const qty = parseFloat(quantityKg);
    const costVal = parseFloat(cost);

    if (isNaN(qty) || isNaN(costVal) || qty <= 0 || costVal < 0) {
      setError('Please provide valid numbers for quantity and cost.');
      return;
    }

    try {
      await apiClient.post('/fertilizer/', {
        crop_id: selectedCrop,
        fertilizer_name: fertilizerName,
        quantity_kg: qty,
        cost: costVal,
        application_date: applicationDate,
      });

      setSuccess('Fertilizer application logged and added to crop expenses!');
      setShowModal(false);
      fetchLogs();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to log fertilizer event.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this fertilizer log?')) {
      return;
    }
    try {
      await apiClient.delete(`/fertilizer/${id}`);
      setSuccess('Log record removed.');
      fetchLogs();
    } catch (err) {
      console.error(err);
      setError('Failed to delete log entry.');
    }
  };

  const filteredCrops = crops.filter((c) => c.farm_id === selectedFarm && c.status === 'ACTIVE');
  const totalCost = logs.reduce((acc, curr) => acc + Number(curr.cost), 0);

  return (
    <div className="flex flex-col gap-8 font-sans">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-xl gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-1">Fertilizer Management</h1>
          <p className="text-slate-400 text-sm">
            Maintain historical logs of soil nutrients applied during crop growth phases.
          </p>
        </div>
        {selectedCrop && (
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-350 hover:to-green-455 text-slate-950 px-5 py-3 rounded-2xl font-bold shadow-lg transform transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer self-stretch sm:self-auto justify-center text-center"
          >
            <Plus className="w-5 h-5" />
            Log Application
          </button>
        )}
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

      {/* Select Farm and Crop context filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900 border border-slate-850 p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Target Farm</label>
          <select
            value={selectedFarm}
            onChange={handleFarmChange}
            className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
          >
            <option value="" disabled>Select Farm</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Target Active Crop</label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
            required
          >
            <option value="">Select active crop</option>
            {filteredCrops.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.variety || 'No variety'})</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-emerald-400 font-bold">Loading logs data...</div>
      ) : !selectedCrop ? (
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-12 text-center shadow-xl">
          <p className="text-slate-500 text-sm">Please select a farm segment and an active crop cycle above to manage logs.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Stat summary */}
          <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl flex items-center gap-4 max-w-sm">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">Tally Fertilizer Expenses</p>
              <p className="text-xl font-black text-white">₹{totalCost.toLocaleString()}</p>
            </div>
          </div>

          {/* List Table */}
          {logs.length === 0 ? (
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-12 text-center shadow-xl">
              <p className="text-slate-500 text-sm">No fertilizer applications logged for this crop yet.</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-850 rounded-2xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-850">
                      <th className="py-4 px-6">Nutrient / Fertilizer Name</th>
                      <th className="py-4 px-6 text-center">Applied Qty (kg)</th>
                      <th className="py-4 px-6 text-center">Application Date</th>
                      <th className="py-4 px-6 text-right">Cost</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/50">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-850/30 text-sm text-slate-200 transition-colors">
                        <td className="py-4 px-6 font-bold text-white whitespace-nowrap">{log.fertilizer_name}</td>
                        <td className="py-4 px-6 text-center font-semibold">{log.quantity_kg} kg</td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <span className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(log.application_date).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-black text-white">₹{log.cost.toFixed(2)}</td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-6 animate-zoom-in">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white">Log Nutrient Application</h3>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-2.5 rounded-2xl text-xs text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Fertilizer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Urea (46% N), DAP"
                  value={fertilizerName}
                  onChange={(e) => setFertilizerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Quantity (Kg)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50"
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Log Cost (₹)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 600"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Application Date</label>
                <input
                  type="date"
                  required
                  value={applicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-350 hover:to-green-455 text-slate-950 font-bold py-3.5 px-4 rounded-2xl shadow-lg mt-4 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Save Log Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fertilizer;
