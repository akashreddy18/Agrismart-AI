import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { 
  Landmark, ShoppingBag, Sparkles
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import type { ChartData } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend);

interface MarketPrice {
  crop_name: string;
  variety: string;
  mandi_name: string;
  price_per_qtl: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  percentage_change: number;
  volume_tons: number;
  last_updated: string;
}

interface HoldingDetail {
  holding_days: number;
  projected_price_per_kg: number;
  storage_cost: number;
  projected_revenue: number;
  net_profit: number;
}

interface SmartSellingResponse {
  recommendation: string;
  immediate_revenue: number;
  holding_details: HoldingDetail[];
}

const Market: React.FC = () => {
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<MarketPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI Recommendation inputs
  const [expectedYield, setExpectedYield] = useState('5000');
  const [storageCost, setStorageCost] = useState('25');
  const [priceTrend, setPriceTrend] = useState('UP');

  // AI Recommendation output
  const [recommendation, setRecommendation] = useState<SmartSellingResponse | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/market/prices');
      setMarketPrices(response.data);
      if (response.data.length > 0) {
        setSelectedCrop(response.data[0]);
      }
    } catch (err) {
      console.error(err);
      setError('Could not retrieve live mandi commodity prices index.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  const handleGetRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrop) return;

    setRecLoading(true);
    setRecommendation(null);
    try {
      const payload = {
        crop_name: selectedCrop.crop_name,
        expected_yield_kg: parseFloat(expectedYield),
        current_market_price_per_kg: selectedCrop.price_per_qtl / 100.0,
        storage_cost_per_day: parseFloat(storageCost),
        expected_price_trend: priceTrend
      };

      const response = await apiClient.post('/ml/smart-selling', payload);
      setRecommendation(response.data);
    } catch (err: any) {
      console.error(err);
      setError('ML service recommendation calculation failed.');
    } finally {
      setRecLoading(false);
    }
  };

  // Generate synthetic price trend dataset for selected crop (30-day period)
  const generateTrendData = (): ChartData<'line'> => {
    if (!selectedCrop) return { labels: [], datasets: [] };

    const labels = Array.from({ length: 15 }, (_, i) => `Day ${i + 1}`);
    const basePrice = selectedCrop.price_per_qtl;
    const isUp = selectedCrop.trend === 'UP';
    const isDown = selectedCrop.trend === 'DOWN';

    // Generate pricing coordinates with noise
    const prices = labels.map((_, idx) => {
      const slope = isUp ? (idx * 15) : isDown ? (-idx * 12) : 0;
      const noise = Math.sin(idx) * 40;
      return basePrice - 150 + slope + noise;
    });

    return {
      labels,
      datasets: [
        {
          label: `${selectedCrop.crop_name} (₹/Qtl)`,
          data: prices,
          borderColor: isUp ? '#10b981' : isDown ? '#ef4444' : '#64748b',
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3
        }
      ]
    };
  };

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => ` ₹${Math.round(context.raw).toLocaleString()}/Qtl`
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.02)'
        },
        ticks: {
          color: '#64748b',
          font: { size: 10 }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.03)'
        },
        ticks: {
          color: '#64748b',
          font: { size: 10 }
        }
      }
    }
  };

  return (
    <div className="flex flex-col gap-8 font-sans">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-1">
            APMC Commodity Market Prices
          </h1>
          <p className="text-slate-400 text-sm">
            Live mandi arrivals, seasonal price fluctuation curves, and AI sell-hold recommendations.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-2xl text-sm text-center">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-emerald-400 font-bold">Loading market feeds...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel: Mandi Price Cards List (5 columns) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pl-1">Live Mandi Index</h3>
            
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[580px] pr-2 custom-scrollbar">
              {marketPrices.map((price, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedCrop(price)}
                  className={`bg-slate-900 border rounded-2xl p-5 shadow-lg flex justify-between items-center cursor-pointer transition-all duration-300 ${
                    selectedCrop?.crop_name === price.crop_name
                      ? 'border-emerald-400/50 bg-gradient-to-r from-slate-900 to-emerald-950/10'
                      : 'border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      price.trend === 'UP' ? 'bg-emerald-500/10 text-emerald-400' : price.trend === 'DOWN' ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm">{price.crop_name}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                        {price.mandi_name}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-black text-white">₹{price.price_per_qtl.toLocaleString()}/Qtl</p>
                    <span className={`text-[10px] font-bold mt-1 inline-block ${
                      price.trend === 'UP' ? 'text-emerald-400' : price.trend === 'DOWN' ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {price.trend === 'UP' ? '+' : ''}{price.percentage_change}% {price.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Charting & AI Analytics (7 columns) */}
          {selectedCrop && (
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Selected Crop details & Trend Chart */}
              <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col gap-6">
                <div className="flex justify-between items-start border-b border-slate-850 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-emerald-400" />
                      {selectedCrop.crop_name} Pricing Trend
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Variety: {selectedCrop.variety} • Mandi Volume: {selectedCrop.volume_tons} Tons
                    </p>
                  </div>
                  
                  <span className="bg-slate-950 border border-slate-850 text-slate-350 px-3.5 py-1.5 rounded-xl text-xs font-bold">
                    ₹{(selectedCrop.price_per_qtl / 100.0).toFixed(2)}/Kg
                  </span>
                </div>

                {/* Chart Box */}
                <div className="h-[200px] relative">
                  <Line data={generateTrendData()} options={trendChartOptions} />
                </div>
              </div>

              {/* AI Smart Selling Recommendation Console */}
              <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col gap-6">
                <h3 className="text-lg font-bold text-white border-b border-slate-850 pb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  AI Crop Smart Selling advisor
                </h3>

                <form onSubmit={handleGetRecommendation} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Harvest Volume (Kg)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 5000"
                      value={expectedYield}
                      onChange={(e) => setExpectedYield(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Storage Cost (₹/Day)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 25"
                      value={storageCost}
                      onChange={(e) => setStorageCost(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Price Trend Index</label>
                    <select
                      value={priceTrend}
                      onChange={(e) => setPriceTrend(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer font-bold"
                    >
                      <option value="UP">Upward (Bullish)</option>
                      <option value="DOWN">Downward (Bearish)</option>
                      <option value="STABLE">Stable (Flat)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={recLoading}
                    className="md:col-span-3 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-350 hover:to-green-455 text-slate-950 font-bold py-3.5 px-4 rounded-2xl shadow-lg mt-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 text-center"
                  >
                    {recLoading ? 'Computing Recommendations...' : 'Analyze Market Opportunities'}
                  </button>
                </form>

                {/* AI Advice Result Block */}
                {recommendation && (
                  <div className="flex flex-col gap-5 bg-slate-950 p-6 rounded-2xl border border-slate-850/60 mt-2">
                    
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">AI Selling Advisory</span>
                      <p className="text-sm font-bold text-white mt-1 leading-relaxed">{recommendation.recommendation}</p>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-850 pt-4">
                      <span className="text-xs text-slate-500 font-bold">Immediate Sale Valuation:</span>
                      <span className="text-sm font-black text-slate-200">₹{recommendation.immediate_revenue.toLocaleString()}</span>
                    </div>

                    {/* Holding matrix details */}
                    <div className="mt-2 flex flex-col gap-3">
                      <p className="text-xs font-bold text-slate-400">Holding Projections Matrix</p>
                      
                      <div className="grid grid-cols-3 gap-3">
                        {recommendation.holding_details.map((detail, dIdx) => (
                          <div key={dIdx} className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col gap-1">
                            <span className="text-[9px] text-slate-500 uppercase font-black">{detail.holding_days} Days Store</span>
                            <span className="text-xs font-black text-white mt-1">₹{detail.projected_price_per_kg.toFixed(2)}/kg</span>
                            <p className="text-[10px] text-slate-400 mt-1">Net profit:<br />₹{detail.net_profit.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default Market;
