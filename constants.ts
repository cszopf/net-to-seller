
import { NetSheetData, FeeSchedule } from './types';

export const COLORS = {
  PRIMARY: '#004EA8',
  TEAL: '#64CCC9',
  LIGHT_BLUE: '#B9D9EB',
  GRAY_BLUE: '#A2B2C8',
  WHITE: '#FFFFFF',
};

export const INITIAL_DATA: NetSheetData = {
  address: '',
  city: '',
  state: 'OH',
  zip: '',
  county: 'Franklin',
  parcelId: '',
  propertyType: 'Single Family',
  salePrice: 0,
  salePrice2: 0,
  salePrice3: 0,
  showComparisons: false,
  closingDate: new Date().toISOString().split('T')[0],
  hasMortgage: false,
  mortgagePayoffs: [],
  hasCommission: true,
  commissionType: 'percent',
  commissionValue: 6,
  buyerAgentPercent: 3,
  listingAgentPercent: 3,
  showAdvancedCommission: false,
  concessions: 0,
  homeWarranty: 0,
  repairCredits: 0,
  otherCredits: 0,
  hoaMonthly: 0,
  hoaTransferFee: 0,
  taxInputMethod: 'annual',
  taxValue: 0,
  taxYear: new Date().getFullYear() - 1,
  otherCosts: [],
  isHomeownersPolicy: true,
  isReissueRate: false,
  priorPolicyAmount: 0,
};

export const OHIO_COUNTIES = [
  'Franklin', 'Delaware', 'Licking', 'Fairfield', 'Union', 'Madison', 'Pickaway', 'Other'
];

export const COUNTY_TRANSFER_TAX_RATES: Record<string, number> = {
  'Franklin': 2.0,
  'Delaware': 3.0,
  'Licking': 4.0,
  'Fairfield': 4.0,
  'Union': 4.0,
  'Madison': 3.0,
  'Pickaway': 3.0,
  'Other': 4.0
};

export const PROPERTY_TYPES = [
  'Single Family', 'Condo', 'Townhome', 'Multi-family (2-4)', 'Land'
];

export const DEFAULT_FEE_SCHEDULE: FeeSchedule = {
  settlementFee: 450,
  recordingFee: 150,
  docPrepFee: 75,
  courierFee: 40,
  releaseTrackingFee: 35,
  transferTaxRate: 2.0,
};

export const OHIO_TITLE_TIERS = [
  { limit: 250000, rate: 5.80 },
  { limit: 500000, rate: 4.10 },
  { limit: 1000000, rate: 3.20 },
  { limit: 5000000, rate: 3.10 },
  { limit: 10000000, rate: 2.90 },
  { limit: Infinity, rate: 2.60 }
];
