
import { NetSheetData, FeeSchedule, CalculationResult } from '../types';
import { OHIO_TITLE_TIERS, COUNTY_TRANSFER_TAX_RATES } from '../constants';

const calculateOriginalPremium = (amount: number): number => {
  let remaining = amount;
  let total = 0;
  let lastLimit = 0;

  for (const tier of OHIO_TITLE_TIERS) {
    const tierSize = tier.limit - lastLimit;
    const amountInTier = Math.min(remaining, tierSize);
    
    if (amountInTier <= 0) break;
    
    total += (Math.ceil(amountInTier / 1000) * tier.rate);
    remaining -= amountInTier;
    lastLimit = tier.limit;
  }
  
  return Math.max(total, 225); // PR-1 Min
};

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

  // 4. Title Premium (PR-1, PR-1.1, PR-4)
  let basePremium = calculateOriginalPremium(salePrice);
  
  // Homeowner's Policy (PR-1.1) adds 15%
  if (data.isHomeownersPolicy) {
    basePremium = Math.max(basePremium * 1.15, 250);
  }

  let finalTitlePremium = basePremium;

  // Reissue Rate (PR-4)
  if (data.isReissueRate && data.priorPolicyAmount > 0) {
    const reissueBasis = Math.min(salePrice, data.priorPolicyAmount);
    const reissuePremiumPortion = calculateOriginalPremium(reissueBasis);
    const homeownersMultiplier = data.isHomeownersPolicy ? 1.15 : 1;
    
    // Credit is 30% of the premium for the reissue portion
    const credit = (reissuePremiumPortion * homeownersMultiplier) * 0.30;
    finalTitlePremium = Math.max(basePremium - credit, data.isHomeownersPolicy ? 250 : 225);
  }

  const cplFee = 55; // Ohio Seller CPL

  // 5. Closing Costs
  const countyTaxRate = COUNTY_TRANSFER_TAX_RATES[data.county] || COUNTY_TRANSFER_TAX_RATES['Other'];
  const transferTax = (salePrice / 1000) * countyTaxRate;
  
  const fixedFees = schedule.settlementFee + schedule.recordingFee + schedule.docPrepFee + schedule.courierFee + schedule.releaseTrackingFee;
  const closingCosts = transferTax + fixedFees + (data.hoaTransferFee || 0) + finalTitlePremium + cplFee;

  // 6. Prorations
  const annualTax = data.taxInputMethod === 'annual' ? data.taxValue : data.taxValue * 12;
  const closing = new Date(data.closingDate);
  const startOfYear = new Date(closing.getFullYear(), 0, 1);
  const diffTime = Math.abs(closing.getTime() - startOfYear.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const taxProration = (annualTax / 365) * diffDays;

  const daysInMonth = new Date(closing.getFullYear(), closing.getMonth() + 1, 0).getDate();
  const dayOfMonth = closing.getDate();
  const daysLeft = daysInMonth - dayOfMonth;
  const hoaProration = (data.hoaMonthly / daysInMonth) * daysLeft;

  // 7. Other Costs
  const otherCostsTotal = data.otherCosts.reduce((sum, c) => sum + (c.amount || 0), 0);

  // 8. Final Net
  const netProceeds = salePrice - totalCommission - totalPayoffs - totalCredits - closingCosts - taxProration + hoaProration - otherCostsTotal;

  return {
    totalCommission,
    totalPayoffs,
    totalCredits,
    transferTax,
    titlePremium: finalTitlePremium,
    cplFee,
    closingCosts,
    taxProration,
    hoaProration,
    otherCostsTotal,
    netProceeds,
    grossProceeds: salePrice
  };
};
