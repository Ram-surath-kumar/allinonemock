// Service for fee-related operations
// This file can be expanded when fee management features are implemented

import { createFeePaymentActivity } from './activities';

export const processFeePayment = async (
  amount,
  payerName,
  studentName
) => {
  // In a real implementation, this would process the payment in the database
  // For now, we'll just create an activity
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  await createFeePaymentActivity(formattedAmount, payerName);
};
