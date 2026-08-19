import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/api';
import type { Farm, Crop } from '../types';
import { 
  Send, Mic, MicOff, Volume2, Image, Sparkles,
  MapPin, CloudSun, Leaf, AlertCircle, RefreshCw
} from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isDiseaseReport?: boolean;
  diseaseData?: {
    disease: string;
    confidence: number;
    advisory: string;
  };
}

const Assistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: 'Hello! I am your AgriSmart AI agronomy assistant. Ask me questions about crops, soil health, fertilizer logs, weather warnings, or upload a leaf photo to diagnose diseases.',
      timestamp: new Date()
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Context variables
  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedFarm, setSelectedFarm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [currentWeatherDesc, setCurrentWeatherDesc] = useState('');
  
  // Voice support states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Disease upload variables
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFarmsAndCrops = async () => {
    try {
      const farmsRes = await apiClient.get('/farms');
      setFarms(farmsRes.data);
      if (farmsRes.data.length > 0) {
        setSelectedFarm(farmsRes.data[0].id);
      }

      const cropsRes = await apiClient.get('/crops');
      setCrops(cropsRes.data);
    } catch (err) {
      console.error("Failed to load user assets context", err);
    }
  };

  useEffect(() => {
    fetchFarmsAndCrops();
  }, []);

  // Fetch weather when farm changes
  useEffect(() => {
    const fetchWeatherContext = async () => {
      if (!selectedFarm) return;
      const farm = farms.find(f => f.id === selectedFarm);
      if (!farm) return;
      try {
        const response = await apiClient.get(
          `/weather/forecast?latitude=${farm.latitude}&longitude=${farm.longitude}`
        );
        setCurrentWeatherDesc(`${response.data.current.temp}°C, ${response.data.current.description}`);
      } catch (err) {
        console.error(err);
      }
    };
    fetchWeatherContext();
    // Pre-fill crop dropdown
    const farmCrops = crops.filter(c => c.farm_id === selectedFarm && c.status === 'ACTIVE');
    if (farmCrops.length > 0) {
      setSelectedCrop(farmCrops[0].id);
    } else {
      setSelectedCrop('');
    }
  }, [selectedFarm, farms, crops]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, uploadLoading]);

  // Voice Typing (Speech to Text)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const speechToText = event.results[0][0].transcript;
        setInputText(prev => prev + ' ' + speechToText);
        setIsListening(false);
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // Voice Readout (Text to Speech)
  const handleVoiceReadout = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop current speaking
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text to speech is not supported in this browser.");
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    // Add user message to UI
    const userMsg: ChatMessage = {
      sender: 'user',
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setLoading(true);

    try {
      const activeCropObj = crops.find(c => c.id === selectedCrop);
      const activeFarmObj = farms.find(f => f.id === selectedFarm);
      
      const payload = {
        prompt: text,
        crop_context: activeCropObj ? `${activeCropObj.name} (${activeCropObj.stage})` : undefined,
        weather_context: currentWeatherDesc ? `${currentWeatherDesc} on ${activeFarmObj?.name}` : undefined
      };

      const response = await apiClient.post('/assistant/chat', payload);
      
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: response.data.response,
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: 'Failed to process AI response. Please check your database connection or Gemini API key.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Upload leaf photo for disease detection
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Add user placeholder message
    setMessages(prev => [...prev, {
      sender: 'user',
      text: `[Uploaded Image: ${file.name}] Analyzing leaf diagnostics...`,
      timestamp: new Date()
    }]);

    setUploadLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/ml/detect-disease', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const { disease_detected, confidence, treatment_advisory } = response.data;

      setMessages(prev => [...prev, {
        sender: 'ai',
        text: `Leaf disease scan complete. Diagnosis: **${disease_detected}** (Confidence: ${(confidence * 100).toFixed(1)}%).`,
        isDiseaseReport: true,
        diseaseData: {
          disease: disease_detected,
          confidence,
          advisory: treatment_advisory
        },
        timestamp: new Date()
      }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: err.response?.data?.detail || 'Fungal CNN scan failed. Ensure model file exists and is trained.',
        timestamp: new Date()
      }]);
    } finally {
      setUploadLoading(false);
    }
  };

  const presetPrompts = [
    "What NPK balance do tomatoes need in flowering stage?",
    "When should I spray nitrogen to avoid rain runoff?",
    "Suggest organic pesticide for powdery mildew",
    "How often should I irrigate black cotton soil?"
  ];

  const filteredCrops = crops.filter(c => c.farm_id === selectedFarm && c.status === 'ACTIVE');

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 font-sans max-h-[82vh]">
      
      {/* Left Sidebar: Context Setup Panel (4 columns) */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-xl flex flex-col gap-6 h-fit">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            AI Context Settings
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Customize the regional metadata injected into your assistant prompt inquiries.
          </p>
        </div>

        {/* Selected Farm */}
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            Farm Location
          </label>
          <select
            value={selectedFarm}
            onChange={(e) => setSelectedFarm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer font-bold"
          >
            {farms.map((f) => (
              <option key={f.id} value={f.id}>{f.name} ({f.location_name})</option>
            ))}
          </select>
        </div>

        {/* Selected Crop */}
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1 flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-slate-500" />
            Crop Cycle
          </label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer font-bold"
            disabled={filteredCrops.length === 0}
          >
            {filteredCrops.length === 0 ? (
              <option value="">No Active Crops</option>
            ) : (
              filteredCrops.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.variety || 'No variety'})</option>
              ))
            )}
          </select>
        </div>

        {/* Weather Indicator */}
        {currentWeatherDesc && (
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex items-center gap-3">
            <CloudSun className="w-8 h-8 text-emerald-400" />
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Current Telemetry</p>
              <p className="text-sm font-bold text-white mt-0.5">{currentWeatherDesc}</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel: Chat Dialogue Console (8 columns) */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-850 rounded-3xl shadow-xl flex flex-col justify-between overflow-hidden h-[80vh]">
        
        {/* Chat History Viewport */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 max-h-[50vh] min-h-[45vh] custom-scrollbar">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
            >
              <div className={`p-4 rounded-2xl text-sm leading-relaxed border ${
                msg.sender === 'user'
                  ? 'bg-slate-800 border-slate-750 text-white rounded-tr-none'
                  : 'bg-emerald-950/20 border-emerald-900/30 text-slate-200 rounded-tl-none'
              }`}>
                {/* Format markdown simple text (bold) */}
                <p className="whitespace-pre-line">
                  {msg.text.split('**').map((chunk, i) => i % 2 === 1 ? <strong key={i} className="text-white font-extrabold">{chunk}</strong> : chunk)}
                </p>

                {/* Specific Leaf Disease Detection report widget */}
                {msg.isDiseaseReport && msg.diseaseData && (
                  <div className="mt-4 bg-slate-950/60 p-4 rounded-xl border border-emerald-900/40 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-emerald-400">Diagnosis Details</span>
                      <span className="text-[10px] font-bold text-slate-500">
                        Confidence: {(msg.diseaseData.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-2.5 text-xs text-slate-350 leading-relaxed border-t border-slate-850/50 pt-2">
                      <AlertCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p>{msg.diseaseData.advisory}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* TTS Readout action */}
              <div className="flex gap-2 items-center mt-1 px-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.sender === 'ai' && (
                  <button 
                    onClick={() => handleVoiceReadout(msg.text)}
                    className="p-1 rounded text-slate-500 hover:text-emerald-400 cursor-pointer"
                    title="Read Response Out Loud"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="self-start bg-slate-950/40 border border-slate-850 p-4 rounded-2xl rounded-tl-none max-w-[85%] flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="text-xs text-slate-400 font-medium">Formulating recommendation...</span>
            </div>
          )}

          {uploadLoading && (
            <div className="self-start bg-slate-950/40 border border-slate-850 p-4 rounded-2xl rounded-tl-none max-w-[85%] flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="text-xs text-slate-400 font-medium">Running leaf diagnosis CNN inference...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Prompt presets (No-print / floating chips) */}
        {messages.length === 1 && (
          <div className="px-6 pb-2 flex flex-wrap gap-2.5">
            {presetPrompts.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(preset)}
                className="text-[11px] font-bold bg-slate-950 border border-slate-850 text-slate-400 hover:text-emerald-400 px-3 py-1.5 rounded-full cursor-pointer hover:border-slate-800 transition-all duration-300"
              >
                {preset}
              </button>
            ))}
          </div>
        )}

        {/* Input Console Area */}
        <div className="bg-slate-950 border-t border-slate-850 p-4 flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 rounded-xl transition-all duration-300 cursor-pointer hover:bg-slate-850"
            title="Diagnose Leaf Spot (Attach Photo)"
          >
            <Image className="w-5 h-5" />
          </button>

          <button
            onClick={toggleListening}
            className={`p-3 border rounded-xl transition-all duration-300 cursor-pointer ${
              isListening 
                ? 'bg-red-500/10 border-red-500/35 text-red-400' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-slate-850'
            }`}
            title={isListening ? "Listening... click to stop" : "Voice Input (Speech to Text)"}
          >
            {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            placeholder={isListening ? "Listening... speak now" : "Ask about pest cycles, NPK ratios, or weather..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            className="p-3.5 bg-gradient-to-r from-emerald-400 to-green-500 text-slate-950 font-bold rounded-xl shadow-lg cursor-pointer transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default Assistant;
