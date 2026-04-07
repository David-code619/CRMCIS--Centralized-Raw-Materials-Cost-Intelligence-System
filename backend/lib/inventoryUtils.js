/**
 * Shared Inventory Business Logic Utilities for CRMCIS
 * 
 * This file contains pure functions for core calculations to ensure consistency across the app.
 * These utilities are used by both frontend components and backend services.
 */

/**
 * 1. Current Stock Calculation
 * 
 * Formula: Stock In (Purchases) – Usage – Adjustments (Loss/Waste) – Transfers Out + Transfers In
 * This function provides a unified way to calculate the theoretical stock level.
 */
export function calculateCurrentStock(movement) {
  const { purchases, usage, adjustments, transfersOut, transfersIn } = movement;
  return (purchases + transfersIn + adjustments) - (usage + transfersOut);
}

/**
 * 2. Inventory Value
 * Formula: Current Quantity × Weighted Average Cost
 */
export function calculateInventoryValue(quantity, avgCost) {
  if (quantity < 0) return 0;
  return quantity * avgCost;
}

/**
 * 3. Weighted Average Cost (WAC)
 * 
 * Formula: ((Old Qty × Old Avg Cost) + (New Qty × New Cost)) ÷ Total Quantity
 * 
 * This is the standard inventory valuation method used in CRMCIS.
 * It ensures that the 'avgCost' field in BranchMaterial is updated correctly after every purchase.
 */
export function calculateWeightedAverageCost(
  oldQty,
  oldAvgCost,
  newQty,
  newCost
) {
  const totalQty = oldQty + newQty;
  
  // Handle zero or negative total quantity to avoid division by zero
  if (totalQty <= 0) {
    return newCost > 0 ? newCost : oldAvgCost;
  }
  
  const totalValue = (Math.max(0, oldQty) * oldAvgCost) + (newQty * newCost);
  return totalValue / totalQty;
}

/**
 * 4. Usage Variance %
 * Formula: ((Actual - Expected) / Expected) × 100
 */
export function calculateUsageVariance(actual, expected) {
  if (expected <= 0) return actual > 0 ? 100 : 0;
  return ((actual - expected) / expected) * 100;
}

/**
 * 5. Suspicious Usage Detection
 * 
 * Compares actual usage against expected benchmarks.
 * If the absolute variance percentage exceeds the threshold, it is flagged for review.
 */
export function isUsageSuspicious(actual, expected, thresholdPercent) {
  const variance = Math.abs(calculateUsageVariance(actual, expected));
  return variance > thresholdPercent;
}

/**
 * 6. Shrinkage Rate %
 * Formula: Total Adjusted Quantity (Loss/Waste) ÷ Total Stock Movement (Purchases + Transfers In)
 */
export function calculateShrinkageRate(totalAdjusted, totalMovement) {
  // totalAdjusted should be absolute value of losses
  if (totalMovement <= 0) return 0;
  return (Math.abs(totalAdjusted) / totalMovement) * 100;
}

/**
 * 7. Monthly Cost Change %
 * Formula: ((Current Month Cost - Previous Month Cost) / Previous Month Cost) * 100
 */
export function calculateCostChange(currentCost, previousCost) {
  if (previousCost <= 0) return currentCost > 0 ? 100 : 0;
  return ((currentCost - previousCost) / previousCost) * 100;
}

/**
 * 8. Negative Stock Prevention Helper
 * Checks if a proposed deduction would result in negative stock.
 */
export function wouldResultInNegativeStock(currentStock, deduction) {
  return (currentStock - deduction) < 0;
}

/**
 * Formats a percentage for display
 */
export function formatPercent(value) {
  return `${value.toFixed(2)}%`;
}

/**
 * Formats currency for display
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}
