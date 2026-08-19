export interface User {
  id: string;
  phone_number: string;
  email: string;
  full_name: string;
  preferred_lang: 'en' | 'hi' | 'te';
  created_at: string;
}

export interface Farm {
  id: string;
  user_id: string;
  name: string;
  location_name: string;
  latitude: number;
  longitude: number;
  acreage: number;
  soil_type: string;
  created_at: string;
}

export interface Crop {
  id: string;
  farm_id: string;
  name: string;
  variety: string | null;
  sowing_date: string;
  expected_harvest_date: string;
  stage: 'SOWING' | 'VEGETATIVE' | 'FLOWERING' | 'HARVEST_READY' | 'HARVESTED';
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
  created_at: string;
}

export interface Expense {
  id: string;
  farm_id: string;
  crop_id: string | null;
  category: 'SEEDS' | 'FERTILIZERS' | 'PESTICIDES' | 'LABOUR' | 'TRACTOR' | 'DIESEL' | 'IRRIGATION' | 'TRANSPORT' | 'OTHER';
  amount: number;
  description: string | null;
  transaction_date: string;
  created_at: string;
}

export interface Labour {
  id: string;
  farm_id: string;
  worker_name: string;
  work_type: string;
  days_worked: number;
  daily_wage: number;
  total_cost: number;
  recorded_date: string;
}

export interface TractorConfig {
  id: string;
  farm_id: string;
  diesel_price: number;
  mileage_liters_per_hour: number;
  driver_charge_per_hour: number;
  maintenance_cost_per_hour: number;
  calculated_cost_per_hour: number;
  updated_at: string;
}

export interface Sales {
  id: string;
  crop_id: string;
  quantity_kg: number;
  price_per_kg: number;
  buyer_name: string | null;
  transport_cost: number;
  total_income: number;
  net_income: number;
  roi: number;
  sale_date: string;
}
