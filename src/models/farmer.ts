/**
 * Farmer Profile & Authentication Domain Types
 */

export type IndianLanguage = 'Hindi' | 'English' | 'Punjabi' | 'Marathi' | 'Gujarati' | 'Telugu' | 'Tamil';

export type IrrigationSource = 'tubewell' | 'canal' | 'rainfed' | 'drip' | 'sprinkler' | 'other';

export interface FarmerProfile {
  id: string;
  userId?: string;
  name: string;
  phone?: string;
  email?: string;
  state: string;
  district: string;
  village?: string;
  language: IndianLanguage;
  land_size: number;
  land_unit: 'acres' | 'hectares' | 'bigha';
  crop: string;
  secondary_crops?: string[];
  soil_type?: string;
  irrigation_source?: IrrigationSource;
  created_at: string;
  updated_at: string;
}

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
  farmerId: string;
  role: 'farmer' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokenPayload {
  uid: string;
  email: string;
  name: string;
  farmerId: string;
  role: 'farmer' | 'admin';
  iat: number;
  exp: number;
}

export interface RegisterFarmerDto {
  email: string;
  password: string;
  name: string;
  state: string;
  district: string;
  village?: string;
  language?: IndianLanguage;
  land_size: number;
  land_unit?: 'acres' | 'hectares' | 'bigha';
  crop: string;
  secondary_crops?: string[];
  soil_type?: string;
  irrigation_source?: IrrigationSource;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    farmerId: string;
    role: 'farmer' | 'admin';
  };
  farmer: FarmerProfile;
}
