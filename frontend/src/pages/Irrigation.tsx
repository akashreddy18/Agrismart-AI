import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import type { Farm, Crop } from '../types';
import { Plus, X, Trash2, Calendar, DollarSign, Droplet, Timer, CloudRain, AlertTriangle } from 'lucide-react';

interface IrrigationLog {
  id: string;
  crop_id: string;
  duration_minutes: number;
  water_consumed_liters: number | null;
  cost: number;
  irrigation_date: string;
}

const Irrigation: React.FC = () => {

  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [logs, setLogs] = useState<IrrigationLog[]>([]);

  const [selectedFarm, setSelectedFarm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState('');
  const [waterLiters, setWaterLiters] = useState('');
  const [cost, setCost] = useState('');
  const [irrigationDate, setIrrigationDate] = useState(new Date().toISOString().split('T')[0]);

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
      const response = await apiClient.get(`/irrigation/crop/${selectedCrop}`);
      setLogs(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch irrigation history.');
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
    setDurationMinutes('');
    setWaterLiters('');
    setCost('');
    setIrrigationDate(new Date().toISOString().split('T')[0]);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const dur = parseInt(durationMinutes);
    const water = waterLiters ? parseFloat(waterLiters) : null;
    const costVal = parseFloat(cost);

    if (isNaN(dur) || dur <= 0 || isNaN(costVal) || costVal < 0) {
      setError('Please provide valid duration and cost details.');
      return;
    }

    try {
      await apiClient.post('/irrigation/', {
        crop_id: selectedCrop,
        duration_minutes: dur,
        water_consumed_liters: water,
        cost: costVal,
        irrigation_date: irrigationDate,
      });

      setSuccess('Irrigation cycle logged and added to expenses!');
      setShowModal(false);
      fetchLogs();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to log irrigation event.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this irrigation record?')) {
      return;
    }
    try {
      await apiClient.delete(`/irrigation/${id}`);
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
          <h1 className="text-3xl font-extrabold text-white mb-1">Irrigation Management</h1>
          <p className="text-slate-400 text-sm">
            Track water consumption durations, diesel/electricity costs, and retrieve irrigation recommendations.
          </p>
        </div>
        {selectedCrop && (
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-350 hover:to-green-455 text-slate-950 px-5 py-3 rounded-2xl font-bold shadow-lg transform transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer self-stretch sm:self-auto justify-center text-center"
          >
            <Plus className="w-5 h-5" />
            Log Irrigation
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
          <p className="text-slate-500 text-sm">Please select a farm segment and an active crop cycle above to manage irrigation records.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Stats summary */}
            <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl flex items-center gap-4 max-w-sm">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold">Tally Pumping Expenses</p>
                <p className="text-xl font-black text-white">₹{totalCost.toLocaleString()}</p>
              </div>
            </div>

            {/* List Table */}
            {logs.length === 0 ? (
              <div className="bg-slate-900 border border-slate-850 rounded-3xl p-12 text-center shadow-xl">
                <p className="text-slate-500 text-sm">No irrigation events logged for this crop yet.</p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-850 rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-850">
                        <th className="py-4 px-6">Water Duration</th>
                        <th className="py-4 px-6 text-center">Estimated Water (L)</th>
                        <th className="py-4 px-6 text-center">Irrigation Date</th>
                        <th className="py-4 px-6 text-right">Pumping Cost</th>
                        <th className="py-4 px-6 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/50">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-850/30 text-sm text-slate-200 transition-colors">
                          <td className="py-4 px-6">
                            <span className="flex items-center gap-2 font-bold text-white">
                              <Timer className="w-4 h-4 text-emerald-400" />
                              {log.duration_minutes} Mins
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center font-semibold">{log.water_consumed_liters ? `${log.water_consumed_liters} L` : '—'}</td>
                          <td className="py-4 px-6 text-center whitespace-nowrap">
                            <span className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(log.irrigation_date).toLocaleDateString()}
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

          {/* AI Weather-Irrigation Integration Card */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl flex flex-col gap-5 h-fit">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-850 pb-3">
              <CloudRain className="w-5 h-5 text-emerald-400" />
              Smart Water Advisory
            </h3>

            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3 text-amber-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold">Weather Intercept Alert</h4>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  Weather telemetry indicates a 75% precipitation likelihood over your field coordinate within the next 24 hours.
                </p>
                <p className="text-xs text-amber-300 font-semibold mt-2">
                  Recommendation: Postpone pumping operations to conserve water and power costs.
                </p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex items-center gap-3">
              <Droplet className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Crop Stage Need</p>
                <p className="text-xs text-slate-200 mt-0.5">Vegetative crops require moderate moisture. Target 120 liters per acre daily.</p>
              </div>
            </div>
          </div>

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

            <h3 className="text-xl font-bold text-white">Log Irrigation Cycle</h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Duration (Minutes)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 60"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Estimated Water (Liters)</label>
                  <input
                    type="text"
                    placeholder="e.g. 500 (Optional)"
                    value={waterLiters}
                    onChange={(e) => setWaterLiters(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Pumping Cost (₹)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 150 (Electricity/Diesel)"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Irrigation Date</label>
                <input
                  type="date"
                  required
                  value={irrigationDate}
                  onChange={(e) => setIrrigationDate(e.target.value)}
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

export default Irrigation;
