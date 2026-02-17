
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
  otherCosts: [],
};

export const OHIO_COUNTIES = [
  'Franklin', 'Delaware', 'Licking', 'Fairfield', 'Union', 'Madison', 'Pickaway', 'Other'
];

export const PROPERTY_TYPES = [
  'Single Family', 'Condo', 'Townhome', 'Multi-family (2-4)', 'Land'
];

export const DEFAULT_FEE_SCHEDULE: FeeSchedule = {
  settlementFee: 450,
  recordingFee: 150,
  docPrepFee: 75,
  courierFee: 40,
  releaseTrackingFee: 35,
  transferTaxRate: 3.0, // per $1000 in Central Ohio typically ranges 1-4
};
