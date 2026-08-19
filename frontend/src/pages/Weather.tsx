import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import type { Farm } from '../types';
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, Info, Compass } from 'lucide-react';

interface CurrentWeather {
  temp: number;
  humidity: number;
  wind_speed: number;
  rain_probability: number;
  description: string;
}

interface DailyForecast {
  date: string;
  temp_min: number;
  temp_max: number;
  rain_probability: number;
  advisory: string;
}

interface ForecastResponse {
  current: CurrentWeather;
  forecast: DailyForecast[];
}

const Weather: React.FC = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState('');
  const [weatherData, setWeatherData] = useState<ForecastResponse | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFarms = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/farms');
      setFarms(response.data);
      if (response.data.length > 0) {
        setSelectedFarm(response.data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch farm coordinates.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async () => {
    if (!selectedFarm) return;
    const farm = farms.find((f) => f.id === selectedFarm);
    if (!farm) return;

    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get(
        `/weather/forecast?latitude=${farm.latitude}&longitude=${farm.longitude}`
      );
      setWeatherData(response.data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve weather telemetry for this farm coordinate.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  useEffect(() => {
    fetchWeather();
  }, [selectedFarm, farms]);

  const getWeatherIcon = (desc: string, size = 24) => {
    const d = desc.toLowerCase();
    if (d.includes('rain') || d.includes('shower')) {
      return <CloudRain size={size} className="text-cyan-400" />;
    } else if (d.includes('cloud') || d.includes('overcast') || d.includes('fog')) {
      return <Cloud size={size} className="text-slate-400" />;
    } else {
      return <Sun size={size} className="text-amber-400 animate-pulse" />;
    }
  };

  return (
    <div className="flex flex-col gap-8 font-sans">
      {/* Header Panel */}
      <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-1">Weather Integration</h1>
          <p className="text-slate-400 text-sm">
            Localized forecasts and AI weather-agronomy advisories mapped to your coordinates.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-2xl text-sm text-center">
          {error}
        </div>
      )}

      {/* Select Farm Selector */}
      {farms.length > 0 && (
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1 flex flex-col gap-2 max-w-sm">
            <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Select Farm Location</label>
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

          {selectedFarm && (
            <div className="flex items-center gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-850">
              <Compass className="w-6 h-6 text-emerald-400" />
              <div className="text-xs">
                <p className="text-slate-400 font-semibold">Farm GPS Coordinates</p>
                <p className="text-white mt-0.5 font-bold">
                  Lat: {farms.find(f => f.id === selectedFarm)?.latitude.toFixed(4)}°, 
                  Lng: {farms.find(f => f.id === selectedFarm)?.longitude.toFixed(4)}°
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {farms.length === 0 && !loading ? (
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-12 text-center shadow-xl">
          <p className="text-slate-500 text-sm">Please register a farm coordinate segment first to load weather advisory reports.</p>
        </div>
      ) : loading && !weatherData ? (
        <div className="text-center py-12 text-emerald-400 font-bold">Loading weather telemetry...</div>
      ) : weatherData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Current Weather Card */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-green-500/0 rounded-bl-full"></div>
            
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Current Telemetry</h3>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-4">
                {getWeatherIcon(weatherData.current.description, 48)}
                <div>
                  <p className="text-3xl font-black text-white">{weatherData.current.temp}°C</p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mt-0.5">
                    {weatherData.current.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex items-center gap-3">
                <Droplets className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Humidity</p>
                  <p className="text-sm font-black text-slate-200">{weatherData.current.humidity}%</p>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex items-center gap-3">
                <Wind className="w-5 h-5 text-teal-400" />
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Wind</p>
                  <p className="text-sm font-black text-slate-200">{weatherData.current.wind_speed} km/h</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex items-center gap-3 mt-2">
              <CloudRain className="w-5 h-5 text-cyan-400 animate-bounce" />
              <div className="flex-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Rain Probability</p>
                <div className="flex items-center justify-between gap-4 mt-1">
                  <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-cyan-400 h-full rounded-full" 
                      style={{ width: `${weatherData.current.rain_probability * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-black text-slate-200">
                    {Math.round(weatherData.current.rain_probability * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 7-Day Forecast & Advisories */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-emerald-400" />
              7-Day Crop Forecast & Agronomy Advisories
            </h3>

            <div className="flex flex-col gap-4 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar">
              {weatherData.forecast.map((day, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-750 transition-all duration-300"
                >
                  <div className="flex items-center gap-3.5 min-w-[120px]">
                    {getWeatherIcon(day.rain_probability > 0.60 ? 'rain' : 'sunny', 20)}
                    <div>
                      <p className="text-sm font-black text-white">
                        {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold">
                        {day.temp_min}°C - {day.temp_max}°C
                      </p>
                    </div>
                  </div>

                  {/* Rain Prob */}
                  <div className="text-xs flex flex-col gap-1 min-w-[80px]">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Rain index</span>
                    <span className={`font-black ${day.rain_probability > 0.50 ? 'text-cyan-400' : 'text-slate-400'}`}>
                      {Math.round(day.rain_probability * 100)}%
                    </span>
                  </div>

                  {/* AI Advice widget */}
                  <div className="flex-1 bg-slate-900/60 p-3 rounded-xl border border-slate-850/50 flex gap-2.5 text-xs text-slate-300 items-start">
                    <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed font-medium">{day.advisory}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : null}
    </div>
  );
};

export default Weather;
