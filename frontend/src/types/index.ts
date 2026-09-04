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
  hours?: number;
  rate_per_hour?: number;
  equipment_name?: string | null;
  transaction_date: string;
  created_at: string;
}

export interface TractorDayEntry {
  id: string;
  farm_id: string;
  crop_id: string;
  equipment_name: string;
  hours: number;
  rate_per_hour: number;
  amount: number;
  description: string | null;
  transaction_date: string;
  created_at?: string | null;
}

export interface TractorDaySummary {
  date: string;
  total_cost: number;
  total_hours: number;
  entries: TractorDayEntry[];
}

export interface TractorCropSummary {
  crop_id: string;
  crop_name: string;
  crop_variety: string | null;
  sowing_date: string | null;
  status: string;
  today_expense: number;
  today_hours: number;
  total_expense: number;
  total_hours: number;
  total_entries: number;
  day_wise_history: TractorDaySummary[];
  all_entries: TractorDayEntry[];
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

export interface TreatmentOption {
  name: string;
  category: string;
  dosage: string;
  approx_quantity: string;
  approx_cost: string;
  instructions: string;
}

export interface DiseaseDiagnosis {
  id?: string;
  crop_name: string;
  disease_name: string;
  confidence: number;
  confidence_percentage: string;
  symptoms: string;
  possible_cause: string;
  recommendations: TreatmentOption[];
  approx_quantity?: string;
  approx_cost?: string;
  safety_instructions: string;
  diagnosis_date: string;
  image_url?: string;
  disclaimer: string;
  crop_id?: string;
  farm_id?: string;
}

export interface DiseaseHistoryItem {
  id: string;
  crop_id: string;
  farm_id: string;
  crop_name: string;
  growth_stage?: string;
  soil_type?: string;
  previous_fertilizer?: string;
  image_path?: string;
  disease_name: string;
  confidence: number;
  confidence_percentage: string;
  symptoms?: string;
  possible_cause?: string;
  treatment_recommendations: TreatmentOption[];
  approx_quantity?: string;
  approx_cost?: string;
  safety_instructions?: string;
  diagnosis_date: string;
  expense_id?: string;
  fertilizer_purchased?: string;
  quantity_purchased?: string;
  expense_amount?: number;
  expense_date?: string;
  created_at: string;
}
