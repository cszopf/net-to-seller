
export interface MortgagePayoff {
  id: string;
  lenderName: string;
  amount: number;
}

export interface OtherCost {
  id: string;
  label: string;
  amount: number;
}

export interface NetSheetData {
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  propertyType: string;
  salePrice: number;
  salePrice2?: number;
  salePrice3?: number;
  showComparisons: boolean;
  closingDate: string;
  hasMortgage: boolean;
  mortgagePayoffs: MortgagePayoff[];
  hasCommission: boolean;
  commissionType: 'percent' | 'flat';
  commissionValue: number;
  buyerAgentPercent: number;
  listingAgentPercent: number;
  showAdvancedCommission: boolean;
  concessions: number;
  homeWarranty: number;
  repairCredits: number;
  otherCredits: number;
  hoaMonthly: number;
  hoaTransferFee: number;
  taxInputMethod: 'annual' | 'monthly';
  taxValue: number;
  otherCosts: OtherCost[];
  // New Title Fields
  isHomeownersPolicy: boolean;
  isReissueRate: boolean;
  priorPolicyAmount: number;
}

export interface FeeSchedule {
  settlementFee: number;
  recordingFee: number;
  docPrepFee: number;
  courierFee: number;
  releaseTrackingFee: number;
  transferTaxRate: number; // rate per $1000
}

export interface CalculationResult {
  totalCommission: number;
  totalPayoffs: number;
  totalCredits: number;
  transferTax: number;
  titlePremium: number;
  cplFee: number;
  closingCosts: number;
  taxProration: number;
  hoaProration: number;
  otherCostsTotal: number;
  netProceeds: number;
  grossProceeds: number;
}
