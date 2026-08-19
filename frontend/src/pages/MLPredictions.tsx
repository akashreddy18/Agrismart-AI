import React, { useState } from 'react';
import apiClient from '../services/api';
import { 
  Sparkles, Sprout, 
  ChevronRight, BarChart3, AlertCircle, CheckCircle, Scale
} from 'lucide-react';

const MLPredictions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'recommend' | 'yield' | 'price'>('recommend');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Crop Recommendation States
  const [nVal, setNVal] = useState('90');
  const [pVal, setPVal] = useState('42');
  const [kVal, setKVal] = useState('43');
  const [tempVal, setTempVal] = useState('28');
  const [humVal, setHumVal] = useState('82');
  const [phVal, setPhVal] = useState('6.5');
  const [rainVal, setRainVal] = useState('200');
  const [recommendationResult, setRecommendationResult] = useState<{ crop: string; confidence: number } | null>(null);

  // 2. Yield Prediction States
  const [yieldCrop, setYieldCrop] = useState('Maize');
  const [yieldSoil, setYieldSoil] = useState('Loamy');
  const [yieldAcreage, setYieldAcreage] = useState('4.5');
  const [yieldRainfall, setYieldRainfall] = useState('150');
  const [yieldFertilizer, setYieldFertilizer] = useState('180');
  const [yieldResult, setYieldResult] = useState<{ total: number; perAcre: number } | null>(null);

  // 3. Price Prediction States
  const [priceCrop, setPriceCrop] = useState('Rice');
  const [priceMandi, setPriceMandi] = useState('Bowenpally Mandi');
  const [priceMonth, setPriceMonth] = useState('8');
  const [priceHistAvg, setPriceHistAvg] = useState('3000');
  const [priceResult, setPriceResult] = useState<{ qtl: number; kg: number } | null>(null);

  // Handlers
  const handleCropRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRecommendationResult(null);

    try {
      const payload = {
        N: parseFloat(nVal),
        P: parseFloat(pVal),
        K: parseFloat(kVal),
        temperature: parseFloat(tempVal),
        humidity: parseFloat(humVal),
        ph: parseFloat(phVal),
        rainfall: parseFloat(rainVal)
      };
      const response = await apiClient.post('/ml/recommend-crop', payload);
      setRecommendationResult({
        crop: response.data.recommended_crop,
        confidence: response.data.confidence
      });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to calculate crop recommendation.');
    } finally {
      setLoading(false);
    }
  };

  const handleYieldPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setYieldResult(null);

    try {
      const payload = {
        crop_name: yieldCrop,
        soil_type: yieldSoil,
        acreage: parseFloat(yieldAcreage),
        rainfall: parseFloat(yieldRainfall),
        fertilizer_usage: parseFloat(yieldFertilizer)
      };
      const response = await apiClient.post('/ml/predict-yield', payload);
      setYieldResult({
        total: response.data.predicted_yield_kg,
        perAcre: response.data.yield_per_acre_kg
      });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to predict yield.');
    } finally {
      setLoading(false);
    }
  };

  const handlePricePrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPriceResult(null);

    try {
      const payload = {
        crop_name: priceCrop,
        mandi_name: priceMandi,
        month: parseInt(priceMonth),
        historical_price_avg: parseFloat(priceHistAvg)
      };
      const response = await apiClient.post('/ml/predict-price', payload);
      setPriceResult({
        qtl: response.data.predicted_price_per_qtl,
        kg: response.data.price_per_kg
      });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to forecast crop prices.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 font-sans">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-1 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-emerald-400" />
            AI Machine Learning Insights
          </h1>
          <p className="text-slate-400 text-sm">
            Leverage pre-trained random forest classifiers, regressors, and data engines to optimize farm planning.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-850 gap-6">
        <button
          onClick={() => { setActiveTab('recommend'); setError(''); }}
          className={`pb-4 text-sm font-bold tracking-wide relative transition-colors cursor-pointer ${
            activeTab === 'recommend' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {activeTab === 'recommend' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full"></span>
          )}
          Crop Recommendation
        </button>

        <button
          onClick={() => { setActiveTab('yield'); setError(''); }}
          className={`pb-4 text-sm font-bold tracking-wide relative transition-colors cursor-pointer ${
            activeTab === 'yield' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {activeTab === 'yield' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full"></span>
          )}
          Yield Prediction
        </button>

        <button
          onClick={() => { setActiveTab('price'); setError(''); }}
          className={`pb-4 text-sm font-bold tracking-wide relative transition-colors cursor-pointer ${
            activeTab === 'price' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {activeTab === 'price' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full"></span>
          )}
          Price Forecasting
        </button>
      </div>

      {/* Main Form Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Input Form (7 columns) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-850 p-6 md:p-8 rounded-3xl shadow-xl">
          
          {activeTab === 'recommend' && (
            <form onSubmit={handleCropRecommendation} className="flex flex-col gap-6">
              <div className="border-b border-slate-850 pb-4">
                <h3 className="text-lg font-bold text-white">Soil & Weather Suitability Classifier</h3>
                <p className="text-xs text-slate-500 mt-1">Provide N-P-K soil ratings and seasonal coordinates to predict suitable crops.</p>
              </div>

              {/* NPK Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Nitrogen (N) (mg/kg)</label>
                  <input
                    type="number" step="any" min="0" max="200" required
                    value={nVal} onChange={(e) => setNVal(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Phosphorus (P) (mg/kg)</label>
                  <input
                    type="number" step="any" min="0" max="200" required
                    value={pVal} onChange={(e) => setPVal(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Potassium (K) (mg/kg)</label>
                  <input
                    type="number" step="any" min="0" max="300" required
                    value={kVal} onChange={(e) => setKVal(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Temp and Humidity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Temperature (°C)</label>
                  <input
                    type="number" step="any" min="-10" max="60" required
                    value={tempVal} onChange={(e) => setTempVal(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Humidity (%)</label>
                  <input
                    type="number" step="any" min="0" max="100" required
                    value={humVal} onChange={(e) => setHumVal(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* pH and Rain */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Soil pH (3.0 - 11.0)</label>
                  <input
                    type="number" step="any" min="3" max="11" required
                    value={phVal} onChange={(e) => setPhVal(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Rainfall index (mm)</label>
                  <input
                    type="number" step="any" min="0" max="500" required
                    value={rainVal} onChange={(e) => setRainVal(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-350 hover:to-green-455 text-slate-950 font-bold py-3.5 px-4 rounded-2xl shadow-lg mt-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {loading ? 'Analyzing Classifier...' : 'Recommend Optimal Crop'}
              </button>
            </form>
          )}

          {activeTab === 'yield' && (
            <form onSubmit={handleYieldPrediction} className="flex flex-col gap-6">
              <div className="border-b border-slate-850 pb-4">
                <h3 className="text-lg font-bold text-white">Harvest Yield Regressor</h3>
                <p className="text-xs text-slate-500 mt-1">Estimate total harvest output in kilograms based on farming and fertilizer usage.</p>
              </div>

              {/* Crop & Soil */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Crop Type</label>
                  <select
                    value={yieldCrop} onChange={(e) => setYieldCrop(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer font-bold"
                  >
                    <option value="Rice">Rice</option>
                    <option value="Banana">Banana</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Chickpea">Chickpea</option>
                    <option value="Maize">Maize</option>
                    <option value="Mango">Mango</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Soil Type</label>
                  <select
                    value={yieldSoil} onChange={(e) => setYieldSoil(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer font-bold"
                  >
                    <option value="Clay">Clay</option>
                    <option value="Black Cotton">Black Cotton</option>
                    <option value="Sandy">Sandy</option>
                    <option value="Red Soil">Red Soil</option>
                    <option value="Loamy">Loamy</option>
                    <option value="Silty">Silty</option>
                  </select>
                </div>
              </div>

              {/* Acreage, Rain, Fertilizer */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Acreage (Acres)</label>
                  <input
                    type="number" step="any" min="0.1" required
                    value={yieldAcreage} onChange={(e) => setYieldAcreage(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Rainfall (mm)</label>
                  <input
                    type="number" step="any" min="0" required
                    value={yieldRainfall} onChange={(e) => setYieldRainfall(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Fertilizer (Kg)</label>
                  <input
                    type="number" step="any" min="0" required
                    value={yieldFertilizer} onChange={(e) => setYieldFertilizer(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-350 hover:to-green-455 text-slate-950 font-bold py-3.5 px-4 rounded-2xl shadow-lg mt-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {loading ? 'Computing Regressor...' : 'Calculate Expected Yield'}
              </button>
            </form>
          )}

          {activeTab === 'price' && (
            <form onSubmit={handlePricePrediction} className="flex flex-col gap-6">
              <div className="border-b border-slate-850 pb-4">
                <h3 className="text-lg font-bold text-white">Mandi Pricing Trend Forecast</h3>
                <p className="text-xs text-slate-500 mt-1">Predict APMC wholesale rates based on historical index and seasonal months.</p>
              </div>

              {/* Crop & Mandi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Crop Type</label>
                  <select
                    value={priceCrop} onChange={(e) => setPriceCrop(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer font-bold"
                  >
                    <option value="Rice">Rice</option>
                    <option value="Banana">Banana</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Chickpea">Chickpea</option>
                    <option value="Maize">Maize</option>
                    <option value="Mango">Mango</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Target APMC Mandi</label>
                  <select
                    value={priceMandi} onChange={(e) => setPriceMandi(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer font-bold"
                  >
                    <option value="Guntur Mandi">Guntur Mandi</option>
                    <option value="Bowenpally Mandi">Bowenpally Mandi</option>
                    <option value="Bowenpally Market">Bowenpally Market</option>
                    <option value="Guntur Market">Guntur Market</option>
                    <option value="Hyderabad Mandi">Hyderabad Mandi</option>
                  </select>
                </div>
              </div>

              {/* Month & Hist Avg */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Target Month</label>
                  <select
                    value={priceMonth} onChange={(e) => setPriceMonth(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer font-bold"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2026, i, 1).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Historical Avg (₹/Qtl)</label>
                  <input
                    type="number" step="any" min="100" required
                    value={priceHistAvg} onChange={(e) => setPriceHistAvg(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-350 hover:to-green-455 text-slate-950 font-bold py-3.5 px-4 rounded-2xl shadow-lg mt-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {loading ? 'Forecasting...' : 'Forecast Wholesale Price'}
              </button>
            </form>
          )}

        </div>

        {/* Right Column: AI Analytics Reports (5 columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pl-1">Telemetry Output</h3>

          {/* Fallback Empty Panel */}
          {!loading && !recommendationResult && !yieldResult && !priceResult && (
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-12 text-center shadow-xl flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-slate-850 rounded-2xl flex items-center justify-center text-slate-600">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">No Calculation Made</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-[240px]">
                Fill out the input parameters on the left and submit to view AI output predictions.
              </p>
            </div>
          )}

          {/* Loading Panel */}
          {loading && (
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-12 text-center shadow-xl flex flex-col items-center gap-4">
              <RefreshCwSpinner />
              <h4 className="text-base font-bold text-emerald-400">Computing...</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Loading parameters and executing model inference on the server.
              </p>
            </div>
          )}

          {/* 1. Crop Recommendation Output */}
          {!loading && activeTab === 'recommend' && recommendationResult && (
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col gap-6 relative overflow-hidden animate-fade-in">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-green-500/0 rounded-bl-full"></div>
              
              <div className="border-b border-slate-850 pb-4">
                <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider">AI Classification Complete</span>
                <h3 className="text-xl font-bold text-white mt-1">Recommendation Analysis</h3>
              </div>

              <div className="flex items-center gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-850">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-400">
                  <Sprout className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Optimal Crop Suitability</p>
                  <p className="text-xl font-black text-white mt-0.5">{recommendationResult.crop}</p>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <span>Confidence Level:</span>
                  <span className="text-emerald-400">{(recommendationResult.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${recommendationResult.confidence * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex gap-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-850/50 text-xs text-slate-350 leading-relaxed">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p>
                  Our random forest classifier indicates that **{recommendationResult.crop}** is the most ecologically and chemically suited crop for the inputted N-P-K nutrient profiles.
                </p>
              </div>
            </div>
          )}

          {/* 2. Yield Prediction Output */}
          {!loading && activeTab === 'yield' && yieldResult && (
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col gap-6 relative overflow-hidden animate-fade-in">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-blue-500/0 rounded-bl-full"></div>

              <div className="border-b border-slate-850 pb-4">
                <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider">AI Regression Complete</span>
                <h3 className="text-xl font-bold text-white mt-1">Harvest Forecast Summary</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col gap-1">
                  <span className="text-[9px] text-slate-500 uppercase font-black">Total Yield</span>
                  <span className="text-lg font-black text-white mt-1">{yieldResult.total.toLocaleString()} kg</span>
                  <span className="text-[10px] text-slate-400">{(yieldResult.total / 1000).toFixed(2)} Metric Tons</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col gap-1">
                  <span className="text-[9px] text-slate-500 uppercase font-black">Yield Per Acre</span>
                  <span className="text-lg font-black text-cyan-400 mt-1">{yieldResult.perAcre.toLocaleString()} kg/ac</span>
                  <span className="text-[10px] text-slate-400">Productivity Index</span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex gap-3 text-xs text-slate-350 leading-relaxed">
                <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-white mb-1">Yield Telemetry Context</h5>
                  <p>
                    This regression model has predicted your harvest output using soil type and nutrient coefficient factors. Actual yields might vary up to 8% due to localized weather variations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. Price Prediction Output */}
          {!loading && activeTab === 'price' && priceResult && (
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col gap-6 relative overflow-hidden animate-fade-in">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-orange-500/0 rounded-bl-full"></div>

              <div className="border-b border-slate-850 pb-4">
                <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider">AI Forecast Complete</span>
                <h3 className="text-xl font-bold text-white mt-1">Wholesale Market Estimate</h3>
              </div>

              <div className="flex justify-between items-center bg-slate-950 p-5 rounded-2xl border border-slate-850">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-400">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Predicted Mandi Price</h4>
                    <p className="text-[10px] text-slate-500">APMC wholesale commodity index</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-white">₹{priceResult.qtl.toLocaleString()}/Qtl</p>
                  <span className="text-[10px] text-amber-400 font-bold">1 Quintal = 100 Kg</span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex justify-between items-center text-xs font-bold text-slate-400">
                <span>Estimated Price per Kilogram:</span>
                <span className="text-white text-sm font-black">₹{priceResult.kg.toFixed(2)}/Kg</span>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850/50 flex gap-2.5 text-xs text-slate-350 leading-relaxed">
                <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p>
                  This forecast accounts for cyclical monthly fluctuations, typical market arrivals premium at **{priceMandi}**, and historical pricing averages.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

const RefreshCwSpinner: React.FC = () => (
  <svg className="animate-spin h-8 w-8 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default MLPredictions;
