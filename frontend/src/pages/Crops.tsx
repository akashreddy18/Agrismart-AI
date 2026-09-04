import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import apiClient from '../services/api';
import type { Crop, Farm } from '../types';
import { Sprout, Calendar, Plus, X, Edit, Trash2, ArrowLeft, Layers, CheckCircle, Activity } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

const Crops: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const farmIdParam = searchParams.get('farm_id');

  const [crops, setCrops] = useState<Crop[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal forms
  const [showModal, setShowModal] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);

  // Inputs
  const [farmId, setFarmId] = useState(farmIdParam || '');
  const [name, setName] = useState('');
  const [variety, setVariety] = useState('');
  const [sowingDate, setSowingDate] = useState('');
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('');
  const [stage, setStage] = useState('SOWING');
  const [status, setStatus] = useState('ACTIVE');

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch farms to populate dropdowns
      const farmsRes = await apiClient.get('/farms');
      setFarms(farmsRes.data);

      // Fetch crops (can pass farm_id as query param)
      const url = farmIdParam ? `/crops?farm_id=${farmIdParam}` : '/crops';
      const cropsRes = await apiClient.get(url);
      setCrops(cropsRes.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch crops or farms databases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [farmIdParam]);

  const openCreateModal = () => {
    setEditingCrop(null);
    setFarmId(farmIdParam || (farms.length > 0 ? farms[0].id : ''));
    setName('');
    setVariety('');
    setSowingDate(new Date().toISOString().split('T')[0]);
    
    // Automatically add 90 days as default expected harvest date
    const harvestDate = new Date();
    harvestDate.setDate(harvestDate.getDate() + 90);
    setExpectedHarvestDate(harvestDate.toISOString().split('T')[0]);
    
    setStage('SOWING');
    setStatus('ACTIVE');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (crop: Crop) => {
    setEditingCrop(crop);
    setFarmId(crop.farm_id);
    setName(crop.name);
    setVariety(crop.variety || '');
    setSowingDate(crop.sowing_date);
    setExpectedHarvestDate(crop.expected_harvest_date);
    setStage(crop.stage);
    setStatus(crop.status);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      farm_id: farmId,
      name,
      variety: variety || null,
      sowing_date: sowingDate,
      expected_harvest_date: expectedHarvestDate,
      stage,
      status,
    };

    try {
      if (editingCrop) {
        await apiClient.put(`/crops/${editingCrop.id}`, payload);
        setSuccess('Crop lifecycle logs updated successfully!');
      } else {
        await apiClient.post('/crops/', payload);
        setSuccess('New crop record registered successfully!');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to submit crop changes.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this crop cycle record? This will clear its expense parameters.')) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await apiClient.delete(`/crops/${id}`);
      setSuccess('Crop record removed.');
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete crop record.');
    }
  };

  const getStageColor = (cropStage: string) => {
    switch (cropStage) {
      case 'SOWING': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'VEGETATIVE': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'FLOWERING': return 'bg-pink-500/20 text-pink-400 border border-pink-500/30';
      case 'HARVEST_READY': return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
      case 'HARVESTED': return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  const selectedFarmName = farmIdParam ? farms.find(f => f.id === farmIdParam)?.name : '';

  return (
    <div className="flex flex-col gap-8 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-xl gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {farmIdParam && (
              <Link to="/farms" className="text-emerald-400 hover:text-emerald-350 p-1 rounded-lg bg-slate-850 border border-slate-800 mr-2">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            )}
            <h1 className="text-3xl font-extrabold text-white">
              Crop Lifecycle
            </h1>
          </div>
          <p className="text-slate-400 text-sm pl-0 sm:pl-8">
            {farmIdParam ? `Managing crop history specifically for farm segment: "${selectedFarmName}"` : 'Tracking and recording all active crops and lifecycle growth stages.'}
          </p>
        </div>
        
        {farms.length > 0 && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-350 hover:to-green-455 text-slate-950 px-5 py-3 rounded-2xl font-bold shadow-lg transform transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer self-stretch sm:self-auto text-center justify-center"
          >
            <Plus className="w-5 h-5" />
            Sow Crop
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

      {loading ? (
        <div className="text-center py-12 text-emerald-400 font-bold">
          {t('common.loading')}
        </div>
      ) : crops.length === 0 ? (
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-12 text-center shadow-xl flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-slate-850 rounded-2xl flex items-center justify-center text-slate-500">
            <Sprout className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">No Crops Registered</h3>
          <p className="text-slate-500 max-w-sm text-sm">
            {farms.length === 0 
              ? 'You must register a farm segment before sowing crops. Go to the "My Farms" page to get started.' 
              : 'You haven\'t logged any crop lifecycles. Click the "Sow Crop" button above to log your first seed.'}
          </p>
          {farms.length === 0 && (
            <Link to="/farms" className="bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl font-bold text-sm">
              Go to Farms
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {crops.map((crop) => {
            const parentFarm = farms.find((f) => f.id === crop.farm_id);
            return (
              <div
                key={crop.id}
                className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-800 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute w-[150px] h-[150px] bg-emerald-500/5 rounded-full blur-2xl -top-10 -right-10"></div>
                
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-white truncate">{crop.name}</h3>
                      {crop.variety && (
                        <p className="text-xs text-emerald-400 font-semibold tracking-wider">{crop.variety}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(crop)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-emerald-400 cursor-pointer transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(crop.id)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 mb-4 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    Farm: {parentFarm?.name || 'Unknown'}
                  </div>

                  <div className="flex items-center justify-between mt-6 bg-slate-950 p-4 rounded-xl border border-slate-850/80 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-wider">Sowing Date</span>
                      <span className="text-xs font-bold text-slate-200 mt-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(crop.sowing_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-wider">Est. Harvest</span>
                      <span className="text-xs font-bold text-slate-200 mt-1 flex items-center gap-1 justify-end">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(crop.expected_harvest_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${getStageColor(crop.stage)}`}>
                    {crop.stage}
                  </span>
                  
                  <span className={`text-xs font-bold flex items-center gap-1 ${
                    crop.status === 'ACTIVE' ? 'text-emerald-400' : crop.status === 'COMPLETED' ? 'text-indigo-400' : 'text-red-400'
                  }`}>
                    {crop.status === 'COMPLETED' && <CheckCircle className="w-4 h-4" />}
                    {crop.status}
                  </span>
                </div>

                <Link
                  to={`/disease?crop_id=${crop.id}`}
                  className="w-full mt-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  {t('nav.disease')} / Check Health
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-over form modal */}
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
              {editingCrop ? 'Update Crop Milestones' : 'Sow Crop Lifecycle'}
            </h3>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-2.5 rounded-2xl text-xs text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Select Farm */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Target Farm</label>
                <select
                  disabled={editingCrop !== null}
                  value={farmId}
                  onChange={(e) => setFarmId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.name} ({farm.location_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Crop Name & Variety */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Crop Type</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cotton, Wheat"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Variety (Seed)</label>
                  <input
                    type="text"
                    placeholder="e.g. Bt Cotton"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Sowing Date</label>
                  <input
                    type="date"
                    required
                    value={sowingDate}
                    onChange={(e) => setSowingDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Est. Harvest Date</label>
                  <input
                    type="date"
                    required
                    value={expectedHarvestDate}
                    onChange={(e) => setExpectedHarvestDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Stage & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Growth Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                  >
                    <option value="SOWING">Sowing</option>
                    <option value="VEGETATIVE">Vegetative</option>
                    <option value="FLOWERING">Flowering</option>
                    <option value="HARVEST_READY">Harvest Ready</option>
                    <option value="HARVESTED">Harvested</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-350 hover:to-green-455 text-slate-950 font-bold py-3.5 px-4 rounded-2xl shadow-lg mt-4 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5"
              >
                {editingCrop ? 'Save Changes' : 'Sow Crop'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Crops;
