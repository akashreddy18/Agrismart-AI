import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';
import type { Farm } from '../types';
import { MapPin, Trash2, Edit, Plus, X, Sprout, Layers, Compass } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

const Farms: React.FC = () => {
  const { t } = useTranslation();
  
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form modal states
  const [showModal, setShowModal] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  
  // Form input fields
  const [name, setName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [acreage, setAcreage] = useState('');
  const [soilType, setSoilType] = useState('Loamy');

  const fetchFarms = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/farms');
      setFarms(response.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch farms list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  const openCreateModal = () => {
    setEditingFarm(null);
    setName('');
    setLocationName('');
    setLatitude('16.306');
    setLongitude('80.436');
    setAcreage('');
    setSoilType('Loamy');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (farm: Farm) => {
    setEditingFarm(farm);
    setName(farm.name);
    setLocationName(farm.location_name);
    setLatitude(farm.latitude.toString());
    setLongitude(farm.longitude.toString());
    setAcreage(farm.acreage.toString());
    setSoilType(farm.soil_type);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      name,
      location_name: locationName,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      acreage: parseFloat(acreage),
      soil_type: soilType,
    };

    if (isNaN(payload.latitude) || isNaN(payload.longitude) || isNaN(payload.acreage)) {
      setError('Please provide valid numbers for coordinates and acreage.');
      return;
    }

    try {
      if (editingFarm) {
        // Edit mode
        await apiClient.put(`/farms/${editingFarm.id}`, payload);
        setSuccess('Farm updated successfully!');
      } else {
        // Create mode
        await apiClient.post('/farms/', payload);
        setSuccess('Farm registered successfully!');
      }
      setShowModal(false);
      fetchFarms();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to save farm details.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this farm? This will remove all associated crops and expenses.')) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await apiClient.delete(`/farms/${id}`);
      setSuccess('Farm deleted successfully!');
      fetchFarms();
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete farm.');
    }
  };

  return (
    <div className="flex flex-col gap-8 font-sans">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-1">
            {t('nav.farms')}
          </h1>
          <p className="text-slate-400 text-sm">
            Register and manage your field coordinates, dimensions, and soil compositions.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-350 hover:to-green-450 text-slate-950 px-5 py-3 rounded-2xl font-bold shadow-lg transform transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Farm
        </button>
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
      ) : farms.length === 0 ? (
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-12 text-center shadow-xl flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-slate-850 rounded-2xl flex items-center justify-center text-slate-500">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">No Farms Registered</h3>
          <p className="text-slate-500 max-w-sm text-sm">
            You haven't registered any farm segment yet. Click the "Add Farm" button above to register your first field.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm) => (
            <div
              key={farm.id}
              className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-800 hover:scale-[1.01] transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute w-[150px] h-[150px] bg-emerald-500/5 rounded-full blur-2xl -top-10 -right-10"></div>
              
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white truncate max-w-[70%]">{farm.name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(farm)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-emerald-400 cursor-pointer transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(farm.id)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                  <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">{farm.location_name}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 bg-slate-950 p-4 rounded-xl border border-slate-850/80">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Acreage</p>
                      <p className="text-sm text-slate-200 font-bold">{farm.acreage} Acres</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Soil Type</p>
                      <p className="text-sm text-slate-200 font-bold">{farm.soil_type}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Link
                    to={`/crops?farm_id=${farm.id}`}
                    className="w-full bg-slate-850 hover:bg-slate-800 border border-slate-800 text-emerald-400 hover:text-emerald-300 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer"
                  >
                    <Sprout className="w-3.5 h-3.5" />
                    Manage Crops
                  </Link>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span>GPS: {farm.latitude.toFixed(4)}, {farm.longitude.toFixed(4)}</span>
                <span>Registered: {new Date(farm.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog Form */}
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
              {editingFarm ? 'Edit Farm Configurations' : 'Register New Farm Segment'}
            </h3>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-2.5 rounded-2xl text-xs text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Farm Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. East Field Orchard"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Location Details</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Guntur District, AP"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Latitude</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 16.3067"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Longitude</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 80.4365"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Acreage (Size)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 4.5"
                    value={acreage}
                    onChange={(e) => setAcreage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Soil Type</label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                  >
                    <option value="Loamy">Loamy</option>
                    <option value="Clay">Clay</option>
                    <option value="Sandy">Sandy</option>
                    <option value="Black Cotton">Black Cotton</option>
                    <option value="Red Soil">Red Soil</option>
                    <option value="Silty">Silty</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-350 hover:to-green-455 text-slate-950 font-bold py-3.5 px-4 rounded-2xl shadow-lg mt-4 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5"
              >
                {editingFarm ? 'Save Changes' : 'Register Farm'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Farms;
