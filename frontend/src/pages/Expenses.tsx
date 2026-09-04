import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import type { Expense, Farm, Crop } from '../types';
import { 
  Plus, X, Edit, Trash2, Receipt, DollarSign, Layers, 
  Calendar, BarChart3, TrendingUp, Printer
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import type { ChartData } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface FinanceSummary {
  total_investment: number;
  cost_per_acre: number;
  cost_per_kg: number;
  total_revenue: number;
  net_profit: number;
  roi: number;
}

const Expenses: React.FC = () => {
  const { t } = useTranslation();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected filters
  const [selectedFarmFilter, setSelectedFarmFilter] = useState('');
  const [selectedCropFilter, setSelectedCropFilter] = useState('');

  // Financial summary data
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form inputs
  const [farmId, setFarmId] = useState('');
  const [cropId, setCropId] = useState('');
  const [category, setCategory] = useState('SEEDS');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);

  const categories = [
    { value: 'SEEDS', label: 'Seeds' },
    { value: 'FERTILIZERS', label: 'Fertilizers' },
    { value: 'PESTICIDES', label: 'Pesticides' },
    { value: 'LABOUR', label: 'Labour' },
    { value: 'TRACTOR', label: 'Tractor' },
    { value: 'DIESEL', label: 'Diesel' },
    { value: 'IRRIGATION', label: 'Irrigation' },
    { value: 'TRANSPORT', label: 'Transport' },
    { value: 'OTHER', label: 'Other' },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const farmsRes = await apiClient.get('/farms');
      setFarms(farmsRes.data);

      const cropsRes = await apiClient.get('/crops');
      setCrops(cropsRes.data);

      let url = '/expenses';
      const params = [];
      if (selectedFarmFilter) params.push(`farm_id=${selectedFarmFilter}`);
      if (selectedCropFilter) params.push(`crop_id=${selectedCropFilter}`);
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const expensesRes = await apiClient.get(url);
      setExpenses(expensesRes.data);

      // If a crop is selected, load the advanced finance statistics summary from the finance service
      if (selectedCropFilter) {
        try {
          const financeRes = await apiClient.get(`/finance/summary/${selectedCropFilter}`);
          setFinanceSummary(financeRes.data);
        } catch (fErr) {
          console.error("Failed to load crop finance summary", fErr);
          setFinanceSummary(null);
        }
      } else {
        setFinanceSummary(null);
      }

    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch expense records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedFarmFilter, selectedCropFilter]);

  const openCreateModal = () => {
    setEditingExpense(null);
    setFarmId(selectedFarmFilter || (farms.length > 0 ? farms[0].id : ''));
    setCropId(selectedCropFilter || '');
    setCategory('SEEDS');
    setAmount('');
    setDescription('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setFarmId(expense.farm_id);
    setCropId(expense.crop_id || '');
    setCategory(expense.category);
    setAmount(expense.amount.toString());
    setDescription(expense.description || '');
    setTransactionDate(expense.transaction_date);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      farm_id: farmId,
      crop_id: cropId || null,
      category,
      amount: parseFloat(amount),
      description: description || null,
      transaction_date: transactionDate,
    };

    if (isNaN(payload.amount)) {
      setError('Please provide a valid expense amount.');
      return;
    }

    try {
      if (editingExpense) {
        await apiClient.put(`/expenses/${editingExpense.id}`, payload);
        setSuccess('Expense entry updated.');
      } else {
        await apiClient.post('/expenses/', payload);
        setSuccess('Expense entry recorded.');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to save expense log.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this expense log?')) {
      return;
    }
    try {
      await apiClient.delete(`/expenses/${id}`);
      setSuccess('Expense log removed.');
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete expense entry.');
    }
  };

  // Trigger browser printing window
  const handlePrint = () => {
    window.print();
  };

  // Filter crops dropdown to match selected farm
  const filteredCrops = farmId ? crops.filter((c) => c.farm_id === farmId) : crops;
  const filteredFilterCrops = selectedFarmFilter ? crops.filter((c) => c.farm_id === selectedFarmFilter) : crops;

  const totalInvestmentFallback = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

  // Compute category distributions
  const categoryTotals = expenses.reduce((acc, curr) => {
    const cat = curr.category;
    acc[cat] = (acc[cat] || 0) + Number(curr.amount);
    return acc;
  }, {} as Record<string, number>);

  const chartLabels = Object.keys(categoryTotals).map((cat) => {
    const found = categories.find((c) => c.value === cat);
    return found ? found.label : cat;
  });

  const chartDataValues = Object.values(categoryTotals);

  const doughnutData: ChartData<'doughnut'> = {
    labels: chartLabels,
    datasets: [
      {
        data: chartDataValues,
        backgroundColor: [
          'rgba(16, 185, 129, 0.45)', // Seeds - Emerald
          'rgba(20, 184, 166, 0.45)', // Fertilizers - Teal
          'rgba(6, 182, 212, 0.45)',  // Pesticides - Cyan
          'rgba(168, 85, 247, 0.45)', // Labour - Purple
          'rgba(245, 158, 11, 0.45)', // Tractor - Amber
          'rgba(239, 68, 68, 0.45)',  // Diesel - Red
          'rgba(59, 130, 246, 0.45)', // Irrigation - Blue
          'rgba(236, 72, 153, 0.45)', // Transport - Pink
          'rgba(100, 116, 139, 0.45)' // Other - Slate
        ],
        borderColor: [
          '#10b981',
          '#14b8a6',
          '#06b6d4',
          '#a855f7',
          '#f59e0b',
          '#ef4444',
          '#3b82f6',
          '#ec4899',
          '#64748b'
        ],
        borderWidth: 1.5,
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#94a3b8',
          font: {
            family: 'Outfit, sans-serif',
            size: 11,
            weight: 'bold' as const
          },
          padding: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return ` ₹${context.raw.toLocaleString()}`;
          }
        }
      }
    }
  };

  return (
    <div className="flex flex-col gap-8 font-sans print:p-0 print:bg-white print:text-black">
      
      {/* Print CSS overrides style block */}
      <style>{`
        @media print {
          aside, header, button, select, label, .no-print {
            display: none !important;
          }
          body, main, .print-container {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-title {
            display: block !important;
            text-align: center;
            margin-bottom: 2rem;
          }
          .print-card {
            border: 1px solid #ddd !important;
            background: none !important;
            color: black !important;
            box-shadow: none !important;
          }
          .print-table {
            color: black !important;
            border-collapse: collapse;
            width: 100%;
          }
          .print-table th, .print-table td {
            border: 1px solid #ddd !important;
            padding: 8px !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-xl gap-4 no-print">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-1">
            {t('nav.expenses')}
          </h1>
          <p className="text-slate-400 text-sm">
            Track expenditures on seeds, fertilizers, labour, tractor, transport, and verify cost efficiencies.
          </p>
        </div>
        
        <div className="flex gap-3 self-stretch sm:self-auto justify-end">
          {expenses.length > 0 && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 text-emerald-400 hover:text-emerald-300 border border-slate-700 px-4 py-3 rounded-2xl font-bold shadow-lg transition-all duration-300 cursor-pointer"
              title="Print Expense Report"
            >
              <Printer className="w-5 h-5" />
              <span className="hidden md:inline">Print Report</span>
            </button>
          )}

          {farms.length > 0 && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-350 hover:to-green-455 text-slate-950 px-5 py-3 rounded-2xl font-bold shadow-lg transform transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer justify-center text-center"
            >
              <Plus className="w-5 h-5" />
              Add Expense
            </button>
          )}
        </div>
      </div>

      {/* Printable Document Title (Hidden on screen, visible on print) */}
      <div className="hidden print-title text-center text-2xl font-bold border-b pb-4">
        <h1>AgriSmart AI — Farm Expense Statement</h1>
        <p className="text-sm mt-1 text-slate-600">Generated on: {new Date().toLocaleDateString()}</p>
        {selectedFarmFilter && (
          <p className="text-xs text-slate-500">Farm: {farms.find((f) => f.id === selectedFarmFilter)?.name}</p>
        )}
        {selectedCropFilter && (
          <p className="text-xs text-slate-500">Crop: {crops.find((c) => c.id === selectedCropFilter)?.name}</p>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl shadow-lg flex flex-col md:flex-row gap-4 no-print">
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Filter by Farm</label>
          <select
            value={selectedFarmFilter}
            onChange={(e) => {
              setSelectedFarmFilter(e.target.value);
              setSelectedCropFilter(''); // reset crop when farm changes
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer font-bold"
          >
            <option value="">All Farms</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Filter by Crop Cycle</label>
          <select
            value={selectedCropFilter}
            onChange={(e) => setSelectedCropFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer font-bold"
          >
            <option value="">All Crops</option>
            {filteredFilterCrops.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.variety || 'No variety'})</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-2xl text-sm text-center no-print">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 px-4 py-3 rounded-2xl text-sm text-center no-print">
          {success}
        </div>
      )}

      {/* Financial Analytics Summary Panels */}
      {financeSummary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 flex items-center justify-between print-card">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Investment</p>
              <p className="text-xl font-black text-white mt-1 print:text-black">₹{financeSummary.total_investment.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 no-print">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 flex items-center justify-between print-card">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cost Per Acre</p>
              <p className="text-xl font-black text-white mt-1 print:text-black">₹{financeSummary.cost_per_acre.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center text-cyan-400 no-print">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 flex items-center justify-between print-card">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cost Per Kilogram</p>
              <p className="text-xl font-black text-white mt-1 print:text-black">₹{financeSummary.cost_per_kg.toFixed(2)}</p>
            </div>
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-400 no-print">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 flex items-center justify-between print-card">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Profit Margin & ROI</p>
              <p className={`text-xl font-black mt-1 print:text-black ${financeSummary.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {financeSummary.roi.toFixed(1)}% ROI
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400 no-print">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 flex items-center gap-4 print-card">
          <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center text-emerald-400 no-print">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Total Scope Investment</p>
            <p className="text-xl font-black text-white print:text-black">₹{totalInvestmentFallback.toLocaleString()}</p>
          </div>
          <span className="text-[10px] text-slate-500 ml-auto hidden sm:inline italic no-print">
            Select a crop cycle to view cost-per-acre and yield calculations.
          </span>
        </div>
      )}

      {/* Split Grid for Category Chart and Ledger */}
      {expenses.length > 0 && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Donut Chart Display Widget */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-xl flex flex-col gap-4 no-print">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider pl-1 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Category Distribution
            </h3>
            
            <div className="h-[220px] relative mt-2">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>

          {/* Ledger Table */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-850 rounded-2xl shadow-xl overflow-hidden print-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse print-table">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-850">
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Description</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6 text-right">Amount</th>
                    <th className="py-4 px-6 text-center no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/50">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-850/30 text-sm text-slate-200 transition-colors">
                      <td className="py-4 px-6">
                        <span className="bg-slate-800 text-emerald-400 font-bold text-xs uppercase px-2.5 py-1 rounded-lg print:bg-none print:text-black print:p-0">
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 max-w-xs truncate">{expense.description || '—'}</td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium print:text-black">
                          <Calendar className="w-3.5 h-3.5 no-print" />
                          {new Date(expense.transaction_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-black text-white print:text-black">₹{expense.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td className="py-4 px-6 text-center whitespace-nowrap no-print">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEditModal(expense)}
                            className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 cursor-pointer transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Backup message when loading or empty */}
      {loading && (
        <div className="text-center py-12 text-emerald-400 font-bold no-print">{t('common.loading')}</div>
      )}
      
      {!loading && expenses.length === 0 && (
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-12 text-center shadow-xl flex flex-col items-center gap-4 no-print">
          <Receipt className="w-12 h-12 text-slate-600" />
          <h3 className="text-xl font-bold text-white">No Expense Logs</h3>
          <p className="text-slate-500 max-w-sm text-sm">
            {farms.length === 0 ? 'Register a farm first to begin logging costs.' : 'No expense entries found matching selected filters.'}
          </p>
        </div>
      )}

      {/* Expense Addition/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-6 animate-zoom-in">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white">
              {editingExpense ? 'Edit Expense Record' : 'Record New Expense'}
            </h3>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-2.5 rounded-2xl text-xs text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Select Farm */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Target Farm</label>
                  <select
                    disabled={editingExpense !== null}
                    value={farmId}
                    onChange={(e) => {
                      setFarmId(e.target.value);
                      setCropId(''); // Reset crop selection
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer disabled:cursor-not-allowed"
                    required
                  >
                    <option value="" disabled>Select Farm</option>
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                {/* Select Crop */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Target Crop (Optional)</label>
                  <select
                    value={cropId}
                    onChange={(e) => setCropId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                  >
                    <option value="">Farm General Expense</option>
                    {filteredCrops.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.variety || 'No variety'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Cost Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Cost Amount (₹)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3500.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Transaction Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Transaction Date</label>
                <input
                  type="date"
                  required
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider pl-1">Description / Memo</label>
                <input
                  type="text"
                  placeholder="e.g. Purchased NPK fertilizer from Guntur Cooperative"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-350 hover:to-green-455 text-slate-950 font-bold py-3.5 px-4 rounded-2xl shadow-lg mt-4 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5"
              >
                {editingExpense ? 'Save Changes' : 'Record Expense'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
