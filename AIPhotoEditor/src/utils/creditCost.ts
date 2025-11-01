/**
 * Formats a credit cost to always display with one decimal place
 * @param creditCost - The credit cost value (number)
 * @returns Formatted string with one decimal place (e.g., "1.0", "0.3", "0.1")
 */
export const formatCreditCost = (creditCost: number): string => {
  return creditCost.toFixed(1);
};

/**
 * Formats a credit cost for display in text, ensuring proper pluralization
 * @param creditCost - The credit cost value (number)
 * @returns Formatted string with cost and proper pluralization (e.g., "1.0 cost", "0.3 costs")
 */
export const formatCreditCostText = (creditCost: number): string => {
  const formatted = formatCreditCost(creditCost);
  const cost = parseFloat(formatted);
  return `${formatted} ${cost === 1 ? 'cost' : 'costs'}`;
};

