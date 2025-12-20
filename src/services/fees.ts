// Service for fee-related operations
// This file can be expanded when fee management features are implemented

import { createFeePaymentActivity } from './activities';

export const processFeePayment = async (
  amount: number,
  payerName: string,
  studentName?: string
): Promise<void> => {
  // In a real implementation, this would process the payment in the database
  // For now, we'll just create an activity
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  await createFeePaymentActivity(formattedAmount, payerName);
};

