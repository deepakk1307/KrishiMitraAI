/**
 * Verified Government Schemes Grounding Dataset
 */

import type { GovernmentScheme } from '../../models/schemes.ts';

export const VERIFIED_SCHEMES: GovernmentScheme[] = [
  {
    id: 'pm-kisan',
    name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    hindi_name: 'प्रधानमंत्री किसान सम्मान निधि',
    category: 'Income Support',
    description:
      'Direct income support of ₹6,000 per year in three equal 4-monthly installments of ₹2,000 to all landholding farmer families across India.',
    state: 'All India',
    eligibleCrops: ['All crops'],
    landRequirements: {
      category: 'all',
    },
    benefits: [
      '₹6,000 annual direct benefit transfer (DBT) directly into Aadhaar-linked bank accounts',
      'Paid in three equal installments of ₹2,000 every 4 months',
    ],
    eligibility: [
      'All landholding farmer families with cultivable landholding in their name',
      'Excludes institutional landholders and high-income tax payees',
    ],
    documents: [
      'Aadhaar Card',
      'Landholding ownership records (Khatauni / RoR)',
      'Aadhaar-linked Active Bank Account with IFSC',
    ],
    officialSource: 'https://pmkisan.gov.in',
    applicationProcess:
      'Self-registration via PM-KISAN portal (Farmers Corner) or nearest Common Service Centre (CSC).',
  },
  {
    id: 'pmfby',
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    hindi_name: 'प्रधानमंत्री फसल बीमा योजना',
    category: 'Crop Insurance',
    description:
      'Comprehensive risk insurance covering non-preventable natural risks from pre-sowing to post-harvest at heavily subsidized uniform premiums (1.5% Rabi, 2% Kharif, 5% Commercial/Horticultural).',
    state: 'All India',
    eligibleCrops: ['Wheat', 'Paddy', 'Mustard', 'Cotton', 'Soybean', 'Maize', 'Pulses'],
    landRequirements: {
      category: 'all',
    },
    benefits: [
      'Full insured sum payout against localized calamities, unseasonal rainfall, drought, floods, and pest outbreaks',
      'Uniform nominal premium: 1.5% for Rabi crops, 2.0% for Kharif foodgrains and oilseeds',
    ],
    eligibility: [
      'All farmers cultivating notified crops in notified areas including sharecroppers and tenant farmers',
    ],
    documents: [
      'Aadhaar Card',
      'Sowing Certificate / Patwari declaration',
      'Bank passbook copy',
      'Land Revenue Receipt',
    ],
    officialSource: 'https://pmfby.gov.in',
    applicationProcess:
      'Apply online via PMFBY portal, through Kisan Credit Card (KCC) issuing banks, or CSC centers within cutoff dates.',
  },
  {
    id: 'kcc',
    name: 'Kisan Credit Card (KCC) Scheme',
    hindi_name: 'किसान क्रेडिट कार्ड योजना',
    category: 'Credit & Loan',
    description:
      'Concessional institutional short-term credit for crop cultivation, post-harvest expenses, and farm maintenance at an effective interest rate of 4% per annum (with prompt repayment incentive).',
    state: 'All India',
    eligibleCrops: ['All crops'],
    landRequirements: {
      category: 'all',
    },
    benefits: [
      'Credit limit up to ₹3,00,000 at 7% baseline interest, reduced to 4% with prompt 1-year repayment subvention',
      'No collateral requirement for loans up to ₹1,60,000',
    ],
    eligibility: [
      'All farmers, individual/joint cultivators, tenant farmers, oral lessees, and Self Help Groups (SHGs)',
    ],
    documents: [
      'Duly filled KCC application form',
      'Identity proof (Aadhaar/Voter ID)',
      'Land ownership records and crop sowing proof',
    ],
    officialSource: 'https://www.myscheme.gov.in/schemes/kcc',
    applicationProcess:
      'Submit single-page KCC application to any nationalized commercial bank, Regional Rural Bank (RRB), or Cooperative bank branch.',
  },
  {
    id: 'pkvy',
    name: 'Paramparagat Krishi Vikas Yojana (PKVY)',
    hindi_name: 'परम्परागत कृषि विकास योजना',
    category: 'Organic Farming',
    description:
      'Financial assistance of ₹50,000 per hectare over 3 years for cluster-based organic farming, PGS certification, organic manure, and value addition.',
    state: 'All India',
    eligibleCrops: ['All crops'],
    landRequirements: {
      min_acres: 1,
      max_acres: 5,
    },
    benefits: [
      '₹50,000 per hectare financial support over 3-year transition cycle',
      '₹31,000/ha directly provided to farmer for organic inputs (seeds, bio-fertilizers, vermicompost)',
      'Free Participatory Guarantee System (PGS-India) organic certification',
    ],
    eligibility: [
      'Farmers forming clusters of 20 hectares (50 acres) in contiguous geographic areas',
    ],
    documents: [
      'Aadhaar Card',
      'Bank details',
      'Land records showing willingness for organic conversion',
    ],
    officialSource: 'https://pgsindia-ncof.gov.in',
    applicationProcess:
      'Register through State Agriculture Department or designated Regional Councils.',
  },
  {
    id: 'pmksy',
    name: 'Pradhan Mantri Krishi Sinchayee Yojana (PMKSY - Per Drop More Crop)',
    hindi_name: 'प्रधानमंत्री कृषि सिंचाई योजना',
    category: 'Irrigation Subsidy',
    description:
      'Up to 55% financial subsidy for Small and Marginal farmers and 45% for other farmers on micro-irrigation systems (Drip and Sprinkler irrigation).',
    state: 'All India',
    eligibleCrops: ['All crops'],
    landRequirements: {
      category: 'all',
    },
    benefits: [
      '55% capital subsidy for Small & Marginal farmers (< 5 acres)',
      '45% subsidy for other category farmers',
      'Up to 40-50% water saving and 20-30% higher crop yield',
    ],
    eligibility: [
      'Farmers possessing cultivable land with an assured water source (well, tubewell, or pond)',
    ],
    documents: [
      'Aadhaar Card',
      'Land Records (7/12, Khasra-Khatauni)',
      'Electricity bill/Water source certificate',
      'Bank passbook',
    ],
    officialSource: 'https://pmksy.gov.in',
    applicationProcess:
      'Apply through State Horticulture or Agriculture portal and select empanelled micro-irrigation vendor.',
  },
  {
    id: 'smam',
    name: 'Sub-Mission on Agricultural Mechanization (SMAM)',
    hindi_name: 'कृषि यंत्रीकरण उप-अभियान',
    category: 'Farm Mechanization',
    description:
      'Financial subsidy ranging from 40% to 50% for purchasing modern farm machinery including tractors, rotavators, seed drills, and power tillers.',
    state: 'All India',
    eligibleCrops: ['All crops'],
    landRequirements: {
      category: 'all',
    },
    benefits: [
      '40% to 50% subsidy on purchase of agricultural equipment',
      'Up to 80% subsidy for establishing Custom Hiring Centres (CHCs)',
    ],
    eligibility: [
      'Individual farmers, SC/ST, small/marginal and women farmers given special priority',
    ],
    documents: [
      'Aadhaar Card',
      'Land holding verification',
      'Bank passbook',
      'Caste certificate (if applicable)',
    ],
    officialSource: 'https://agrimachinery.nic.in',
    applicationProcess:
      'Apply online on the Farmech (agrimachinery.nic.in) portal with equipment quotation.',
  },
  {
    id: 'up-karj-rahat',
    name: 'UP Kisan Karj Rahat Yojana',
    hindi_name: 'उत्तर प्रदेश किसान ऋण मोचन योजना',
    category: 'Debt Relief',
    description:
      'Loan waiver up to ₹1,00,000 on crop loans taken by small and marginal farmers of Uttar Pradesh from cooperative and regional rural banks.',
    state: 'Uttar Pradesh',
    eligibleCrops: ['Wheat', 'Paddy', 'Sugarcane', 'Mustard', 'Potato'],
    landRequirements: {
      max_acres: 5,
    },
    benefits: [
      'One-time crop loan waiver up to ₹1,00,000 for distressed small and marginal farmers',
    ],
    eligibility: [
      'Permanent resident farmers of Uttar Pradesh holding up to 2 hectares (5 acres) cultivable land',
    ],
    documents: [
      'Aadhaar Card linked with Bank Account',
      'UP Land records (Khatauni)',
      'Loan account certificate from issuing bank',
    ],
    officialSource: 'https://upkisankarjrahat.upsdc.gov.in',
    applicationProcess:
      'Check eligibility status and submit claim on the official UP Kisan Karj Rahat portal.',
  },
];
