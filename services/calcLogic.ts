
import { NetSheetData, FeeSchedule, CalculationResult } from '../types';

export const calculateNetSheet = (data: NetSheetData, schedule: FeeSchedule, specificPrice?: number): CalculationResult => {
  const salePrice = specificPrice ?? (data.salePrice || 0);

  // 1. Commission
  let totalCommission = 0;
  if (data.hasCommission) {
    if (data.commissionType === 'percent') {
      totalCommission = salePrice * (data.commissionValue / 100);
    } else {
      totalCommission = data.commissionValue;
    }
  }

  // 2. Payoffs
  const totalPayoffs = data.mortgagePayoffs.reduce((sum, p) => sum + (p.amount || 0), 0);

  // 3. Credits/Concessions
  const totalCredits = (data.concessions || 0) + (data.homeWarranty || 0) + (data.repairCredits || 0) + (data.otherCredits || 0);

  // 4. Closing Costs
  const transferTax = (salePrice / 1000) * schedule.transferTaxRate;
  const fixedFees = schedule.settlementFee + schedule.recordingFee + schedule.docPrepFee + schedule.courierFee + schedule.releaseTrackingFee;
  const closingCosts = transferTax + fixedFees + (data.hoaTransferFee || 0);

  // 5. Prorations (Simplified for estimate)
  // Taxes: Assumes seller pays through closing date (arrears in Ohio)
  const annualTax = data.taxInputMethod === 'annual' ? data.taxValue : data.taxValue * 12;
  const closing = new Date(data.closingDate);
  const startOfYear = new Date(closing.getFullYear(), 0, 1);
  const diffTime = Math.abs(closing.getTime() - startOfYear.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const taxProration = (annualTax / 365) * diffDays;

  // HOA
  const daysInMonth = new Date(closing.getFullYear(), closing.getMonth() + 1, 0).getDate();
  const dayOfMonth = closing.getDate();
  const daysLeft = daysInMonth - dayOfMonth;
  const hoaProration = (data.hoaMonthly / daysInMonth) * daysLeft; // Credit/Debit simplified

  // 6. Other Costs
  const otherCostsTotal = data.otherCosts.reduce((sum, c) => sum + (c.amount || 0), 0);

  // 7. Final Net
  const netProceeds = salePrice - totalCommission - totalPayoffs - totalCredits - closingCosts - taxProration + hoaProration - otherCostsTotal;

  return {
    totalCommission,
    totalPayoffs,
    totalCredits,
    transferTax,
    closingCosts,
    taxProration,
    hoaProration,
    otherCostsTotal,
    netProceeds,
    grossProceeds: salePrice
  };
};
