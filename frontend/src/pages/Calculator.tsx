import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import type { Farm, Crop } from '../types';
import { Calculator as CalcIcon, Settings, Settings2, Play, Sprout } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

const Calculator: React.FC = () => {
  const { t } = useTranslation();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedFarm, setSelectedFarm] = useState('');
  
  // Configuration inputs
  const [dieselPrice, setDieselPrice] = useState('');
  const [mileage, setMileage] = useState('');
  const [driverCharge, setDriverCharge] = useState('');
  const [maintenanceCost, setMaintenanceCost] = useState('');
  const [calculatedHourlyCost, setCalculatedHourlyCost] = useState(0);

  // Calculation inputs
  const [selectedCrop, setSelectedCrop] = useState('');
  const [operationName, setOperationName] = useState('Ploughing');
  const [durationHours, setDurationHours] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchFarmsAndCrops = async () => {
    try {
      setLoading(true);
      const farmsRes = await apiClient.get('/farms');
      setFarms(farmsRes.data);

      const cropsRes = await apiClient.get('/crops');
      setCrops(cropsRes.data);

      if (farmsRes.data.length > 0) {
        setSelectedFarm(farmsRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load farms and crops context.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmsAndCrops();
  }, []);

  // Fetch tractor configuration when selected farm changes
  useEffect(() => {
    const fetchTractorConfig = async () => {
      if (!selectedFarm) return;
      try {
        setError('');
        const response = await apiClient.get(`/tractor/config/${selectedFarm}`);
        const config = response.data;
        
        setDieselPrice(config.diesel_price.toString());
        setMileage(config.mileage_liters_per_hour.toString());
        setDriverCharge(config.driver_charge_per_hour.toString());
        setMaintenanceCost(config.maintenance_cost_per_hour.toString());
        setCalculatedHourlyCost(config.calculated_cost_per_hour);
      } catch (err) {
        console.error(err);
        setError('Failed to retrieve tractor configurations.');
      }
    };
    fetchTractorConfig();
    setSelectedCrop('');
  }, [selectedFarm]);

  // Live preview calculation on input changes
  useEffect(() => {
    const diesel = parseFloat(dieselPrice) || 0;
    const lph = parseFloat(mileage) || 0;
    const driver = parseFloat(driverCharge) || 0;
    const maint = parseFloat(maintenanceCost) || 0;
    
    setCalculatedHourlyCost((diesel * lph) + driver + maint);
  }, [dieselPrice, mileage, driverCharge, maintenanceCost]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        farm_id: selectedFarm,
        diesel_price: parseFloat(dieselPrice),
        mileage_liters_per_hour: parseFloat(mileage),
        driver_charge_per_hour: parseFloat(driverCharge),
        maintenance_cost_per_hour: parseFloat(maintenanceCost),
      };

      const response = await apiClient.post('/tractor/config', payload);
      setCalculatedHourlyCost(response.data.calculated_cost_per_hour);
      setSuccess('Tractor hourly rates saved and updated.');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to save configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedCrop) {
      setError('Please select a target crop cycle.');
      return;
    }

    const hours = parseFloat(durationHours);
    if (isNaN(hours) || hours <= 0) {
      setError('Please provide a valid duration in hours.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/tractor/calculate', {
        farm_id: selectedFarm,
        crop_id: selectedCrop,
        hours,
        operation_name: operationName,
      });

      setSuccess(`Tractor cost logged successfully under crop expenses! Total: ₹${(hours * calculatedHourlyCost).toFixed(2)}`);
      setDurationHours('');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to submit tractor calculation.');
    } finally {
      setLoading(false);
    }
  };

  // Filter crops dropdown to match selected farm
  const filteredCrops = crops.filter((c) => c.farm_id === selectedFarm && c.status === 'ACTIVE');

  return (
    <div className="flex flex-col gap-8 font-sans">
      {/* Header Panel */}
      <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-xl">
        <h1 className="text-3xl font-extrabold text-white mb-1">
          {t('nav.calculator')}
        </h1>
        <p className="text-slate-400 text-sm">
          Configure local fuel and operator variables to automatically compute and log tractor expenses for crop operations.
        </p>
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

      {/* Select Farm Context Dropdown */}
      {farms.length > 0 && (
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl shadow-lg flex flex-col gap-2 max-w-md">
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Selected Farm</label>
          <select
            value={selectedFarm}
            onChange={(e) => setSelectedFarm(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer font-bold"
          >
            {farms.map((f) => (
              <option key={f.id} value={f.id}>{f.name} ({f.location_name})</option>
            ))}
          </select>
        </div>
      )}

      {farms.length === 0 && !loading ? (
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-12 text-center shadow-xl">
          <p className="text-slate-500 text-sm">You must register a farm segment before accessing the tractor config calculator.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Section 1: Hourly Config Parameters */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Settings2 className="w-5 h-5 text-emerald-400" />
              Tractor Cost Parameters
            </h3>

            <form onSubmit={handleSaveConfig} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Diesel Price (₹/L)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 98.20"
                    value={dieselPrice}
                    onChange={(e) => setDieselPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Fuel Use (L/Hr)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3.5"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Driver Charge (₹/Hr)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 150.00"
                    value={driverCharge}
                    onChange={(e) => setDriverCharge(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Maint. Rate (₹/Hr)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50.00"
                    value={maintenanceCost}
                    onChange={(e) => setMaintenanceCost(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Calculated preview box */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 mt-2 relative overflow-hidden">
                <div className="absolute w-[100px] h-[100px] bg-emerald-500/5 rounded-full blur-xl -bottom-5 -right-5"></div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Calculated Rate per Hour</p>
                <p className="text-3xl font-black text-emerald-400">₹{calculatedHourlyCost.toFixed(2)}/Hr</p>
                <p className="text-[10px] text-slate-400 italic text-center">
                  (Diesel Price × Fuel Use) + Driver Wage + Maintenance Rate
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-350 hover:to-green-455 text-slate-950 font-bold py-3.5 px-4 rounded-2xl shadow-lg mt-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Save Rate Parameters
              </button>
            </form>
          </div>

          {/* Section 2: Calculate operational cost */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <CalcIcon className="w-5 h-5 text-emerald-400" />
              Compute & Log Operation
            </h3>

            {calculatedHourlyCost === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950 border border-slate-850/50 rounded-2xl">
                <Settings className="w-8 h-8 text-slate-600 animate-spin-slow mb-3" />
                <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                  Configure and save your farm's tractor cost parameters on the left to activate operation calculations.
                </p>
              </div>
            ) : filteredCrops.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950 border border-slate-850/50 rounded-2xl">
                <Sprout className="w-8 h-8 text-slate-600 mb-3" />
                <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                  No active crop cycles found for this farm. SOW a crop on this farm first to register operational tractor costs.
                </p>
              </div>
            ) : (
              <form onSubmit={handleLogExpense} className="flex flex-col gap-5 flex-1 justify-between">
                <div className="flex flex-col gap-5">
                  {/* Select Crop */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Select Crop Cycle</label>
                    <select
                      value={selectedCrop}
                      onChange={(e) => setSelectedCrop(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                      required
                    >
                      <option value="" disabled>Select Crop</option>
                      {filteredCrops.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.variety || 'No variety'})</option>
                      ))}
                    </select>
                  </div>

                  {/* Operation Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Operation Name</label>
                    <select
                      value={operationName}
                      onChange={(e) => setOperationName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                    >
                      <option value="Ploughing">Ploughing</option>
                      <option value="Tilling">Tilling</option>
                      <option value="Sowing">Sowing</option>
                      <option value="Weeding">Weeding</option>
                      <option value="Harvesting">Harvesting</option>
                      <option value="Levelling">Levelling</option>
                    </select>
                  </div>

                  {/* Duration Hours */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Duration (Hours)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 5.5"
                      value={durationHours}
                      onChange={(e) => setDurationHours(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>

                {/* Calculation breakdown */}
                <div className="mt-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center bg-slate-950 border border-slate-850 p-4 rounded-xl">
                    <span className="text-xs text-slate-400 font-semibold">Preview Total Cost:</span>
                    <span className="text-lg font-black text-white">
                      ₹{((parseFloat(durationHours) || 0) * calculatedHourlyCost).toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-350 hover:to-green-455 text-slate-950 font-bold py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Play className="w-4 h-4" />
                    Log as Crop Expense
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default Calculator;
