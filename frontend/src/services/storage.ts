import type { Farm, Crop, Expense, DiseaseHistoryItem } from '../types';

// Storage Keys
const STORAGE_KEYS = {
  FARMS: 'agrismart_farms',
  CROPS: 'agrismart_crops',
  EXPENSES: 'agrismart_expenses',
  DISEASE_HISTORY: 'agrismart_disease_history',
  DEMO_INITIALIZED: 'agrismart_demo_initialized_v2',
};

// Seed initial demonstration data so new visitors have instant rich context
export const seedInitialData = () => {
  const isInitialized = localStorage.getItem(STORAGE_KEYS.DEMO_INITIALIZED);
  if (isInitialized) return;

  const initialFarms: Farm[] = [
    {
      id: 'f1111111-1111-1111-1111-111111111111',
      user_id: 'demo-farmer-001',
      name: 'East Field Orchard',
      location_name: 'Guntur District, Andhra Pradesh',
      latitude: 16.3067,
      longitude: 80.4365,
      acreage: 4.5,
      soil_type: 'Loamy',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'f2222222-2222-2222-2222-222222222222',
      user_id: 'demo-farmer-001',
      name: 'North Riverine Basin',
      location_name: 'Krishna Delta, Andhra Pradesh',
      latitude: 16.5062,
      longitude: 80.6480,
      acreage: 6.0,
      soil_type: 'Black Cotton',
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    }
  ];

  const initialCrops: Crop[] = [
    {
      id: 'c1111111-1111-1111-1111-111111111111',
      farm_id: 'f1111111-1111-1111-1111-111111111111',
      name: 'Paddy (Rice)',
      variety: 'Sambha Mahsuri (BPT 5204)',
      sowing_date: new Date(Date.now() - 45 * 86400000).toISOString().split('T')[0],
      expected_harvest_date: new Date(Date.now() + 75 * 86400000).toISOString().split('T')[0],
      stage: 'VEGETATIVE',
      status: 'ACTIVE',
      created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    },
    {
      id: 'c2222222-2222-2222-2222-222222222222',
      farm_id: 'f1111111-1111-1111-1111-111111111111',
      name: 'Tomato',
      variety: 'Arka Rakshak',
      sowing_date: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0],
      expected_harvest_date: new Date(Date.now() + 70 * 86400000).toISOString().split('T')[0],
      stage: 'FLOWERING',
      status: 'ACTIVE',
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      id: 'c3333333-3333-3333-3333-333333333333',
      farm_id: 'f2222222-2222-2222-2222-222222222222',
      name: 'Cotton',
      variety: 'Bt Cotton II',
      sowing_date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
      expected_harvest_date: new Date(Date.now() + 110 * 86400000).toISOString().split('T')[0],
      stage: 'SOWING',
      status: 'ACTIVE',
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    }
  ];

  const initialExpenses: Expense[] = [
    {
      id: 'e1111111-1111-1111-1111-111111111111',
      farm_id: 'f1111111-1111-1111-1111-111111111111',
      crop_id: 'c1111111-1111-1111-1111-111111111111',
      category: 'TRACTOR',
      equipment_name: 'Mahindra 575 DI Tractor',
      amount: 2400,
      hours: 3.0,
      rate: 800,
      rate_per_hour: 800,
      date: new Date(Date.now() - 40 * 86400000).toISOString().split('T')[0],
      transaction_date: new Date(Date.now() - 40 * 86400000).toISOString().split('T')[0],
      notes: 'Initial deep field ploughing and bed preparation',
      description: 'Initial deep field ploughing and bed preparation',
      created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    },
    {
      id: 'e2222222-2222-2222-2222-222222222222',
      farm_id: 'f1111111-1111-1111-1111-111111111111',
      crop_id: 'c1111111-1111-1111-1111-111111111111',
      category: 'TRACTOR',
      equipment_name: 'Rotavator Attachment',
      amount: 1800,
      hours: 2.0,
      rate: 900,
      rate_per_hour: 900,
      date: new Date(Date.now() - 25 * 86400000).toISOString().split('T')[0],
      transaction_date: new Date(Date.now() - 25 * 86400000).toISOString().split('T')[0],
      notes: 'Soil pulverization and puddling',
      description: 'Soil pulverization and puddling',
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      id: 'e3333333-3333-3333-3333-333333333333',
      farm_id: 'f1111111-1111-1111-1111-111111111111',
      crop_id: 'c2222222-2222-2222-2222-222222222222',
      category: 'TRACTOR',
      equipment_name: 'Power Tiller',
      amount: 1400,
      hours: 2.0,
      rate: 700,
      rate_per_hour: 700,
      date: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
      transaction_date: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
      notes: 'Inter-cultivation ridging for tomato beds',
      description: 'Inter-cultivation ridging for tomato beds',
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    }
  ];

  localStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify(initialFarms));
  localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(initialCrops));
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(initialExpenses));
  localStorage.setItem(STORAGE_KEYS.DEMO_INITIALIZED, 'true');
};

// Initialize seed data on load
seedInitialData();

// --- FARMS REPOSITORY ---
export const getLocalFarms = (): Farm[] => {
  seedInitialData();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FARMS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read farms from local storage', err);
    return [];
  }
};

export const saveLocalFarm = (farmData: Partial<Farm> & { name: string; location_name: string; acreage: number; soil_type: string }): Farm => {
  const farms = getLocalFarms();
  if (farmData.id) {
    // Update existing
    const index = farms.findIndex(f => f.id === farmData.id);
    if (index !== -1) {
      farms[index] = {
        ...farms[index],
        ...farmData,
      } as Farm;
      localStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify(farms));
      return farms[index];
    }
  }

  // Create new farm
  const newFarm: Farm = {
    id: farmData.id || `farm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: farmData.user_id || 'demo-farmer-001',
    name: farmData.name,
    location_name: farmData.location_name,
    latitude: farmData.latitude ?? 16.306,
    longitude: farmData.longitude ?? 80.436,
    acreage: farmData.acreage,
    soil_type: farmData.soil_type,
    created_at: new Date().toISOString(),
  };

  farms.unshift(newFarm);
  localStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify(farms));
  return newFarm;
};

export const deleteLocalFarm = (farmId: string): void => {
  const farms = getLocalFarms().filter(f => f.id !== farmId);
  localStorage.setItem(STORAGE_KEYS.FARMS, JSON.stringify(farms));

  // Cascading delete: delete all crops belonging to this farm
  const remainingCrops = getLocalCrops().filter(c => c.farm_id !== farmId);
  localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(remainingCrops));

  // Cascading delete: delete all expenses belonging to this farm
  const remainingExpenses = getLocalExpenses().filter(e => e.farm_id !== farmId);
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(remainingExpenses));
};

// --- CROPS REPOSITORY ---
export const getLocalCrops = (farmId?: string): Crop[] => {
  seedInitialData();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CROPS);
    const crops: Crop[] = raw ? JSON.parse(raw) : [];
    if (farmId) {
      return crops.filter(c => c.farm_id === farmId);
    }
    return crops;
  } catch (err) {
    console.error('Failed to read crops from local storage', err);
    return [];
  }
};

export const saveLocalCrop = (cropData: Partial<Crop> & { farm_id: string; name: string; stage: string; status: string; sowing_date: string; expected_harvest_date: string }): Crop => {
  const crops = getLocalCrops();
  if (cropData.id) {
    const index = crops.findIndex(c => c.id === cropData.id);
    if (index !== -1) {
      crops[index] = {
        ...crops[index],
        ...cropData,
      } as Crop;
      localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(crops));
      return crops[index];
    }
  }

  const newCrop: Crop = {
    id: cropData.id || `crop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    farm_id: cropData.farm_id,
    name: cropData.name,
    variety: cropData.variety || null,
    sowing_date: cropData.sowing_date,
    expected_harvest_date: cropData.expected_harvest_date,
    stage: cropData.stage,
    status: cropData.status,
    created_at: new Date().toISOString(),
  };

  crops.unshift(newCrop);
  localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(crops));
  return newCrop;
};

export const deleteLocalCrop = (cropId: string): void => {
  const crops = getLocalCrops().filter(c => c.id !== cropId);
  localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(crops));

  // Delete all associated expenses & tractor entries for this crop
  const remainingExpenses = getLocalExpenses().filter(e => e.crop_id !== cropId);
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(remainingExpenses));

  // Delete all disease history for this crop
  const remainingDisease = getLocalDiseaseHistory().filter(d => d.crop_id !== cropId);
  localStorage.setItem(STORAGE_KEYS.DISEASE_HISTORY, JSON.stringify(remainingDisease));
};

// --- EXPENSES REPOSITORY ---
export const getLocalExpenses = (cropId?: string, farmId?: string): Expense[] => {
  seedInitialData();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    const expenses: Expense[] = raw ? JSON.parse(raw) : [];
    return expenses.filter(e => {
      if (cropId && e.crop_id !== cropId) return false;
      if (farmId && e.farm_id !== farmId) return false;
      return true;
    });
  } catch (err) {
    console.error('Failed to read expenses from local storage', err);
    return [];
  }
};

export const saveLocalExpense = (expenseData: Partial<Expense> & { farm_id: string; amount: number; category: string; date?: string; transaction_date?: string }): Expense => {
  const expenses = getLocalExpenses();
  const txDate = expenseData.transaction_date || expenseData.date || new Date().toISOString().split('T')[0];

  if (expenseData.id) {
    const index = expenses.findIndex(e => e.id === expenseData.id);
    if (index !== -1) {
      expenses[index] = {
        ...expenses[index],
        ...expenseData,
        transaction_date: txDate,
        date: txDate,
      } as Expense;
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
      return expenses[index];
    }
  }

  const newExpense: Expense = {
    id: expenseData.id || `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    farm_id: expenseData.farm_id,
    crop_id: expenseData.crop_id || null,
    category: expenseData.category,
    equipment_name: expenseData.equipment_name || null,
    amount: expenseData.amount,
    hours: expenseData.hours,
    rate: expenseData.rate || expenseData.rate_per_hour,
    rate_per_hour: expenseData.rate_per_hour || expenseData.rate,
    date: txDate,
    transaction_date: txDate,
    notes: expenseData.notes || expenseData.description || null,
    description: expenseData.description || expenseData.notes || null,
    created_at: new Date().toISOString(),
  };

  expenses.unshift(newExpense);
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  return newExpense;
};

export const deleteLocalExpense = (expenseId: string): void => {
  const expenses = getLocalExpenses().filter(e => e.id !== expenseId);
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
};

// --- DISEASE HISTORY REPOSITORY ---
export const getLocalDiseaseHistory = (cropId?: string): DiseaseHistoryItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DISEASE_HISTORY);
    const history: DiseaseHistoryItem[] = raw ? JSON.parse(raw) : [];
    if (cropId) {
      return history.filter(h => h.crop_id === cropId);
    }
    return history;
  } catch (err) {
    console.error('Failed to read disease history from local storage', err);
    return [];
  }
};

export const saveLocalDiseaseHistory = (item: DiseaseHistoryItem): void => {
  const history = getLocalDiseaseHistory();
  const index = history.findIndex(h => h.id === item.id);
  if (index !== -1) {
    history[index] = item;
  } else {
    history.unshift(item);
  }
  localStorage.setItem(STORAGE_KEYS.DISEASE_HISTORY, JSON.stringify(history));
};

export const deleteLocalDiseaseHistory = (id: string): void => {
  const history = getLocalDiseaseHistory().filter(h => h.id !== id);
  localStorage.setItem(STORAGE_KEYS.DISEASE_HISTORY, JSON.stringify(history));
};
