import { 
  getReportKPIs, 
  getBranchComparison, 
  getReportCostTrends,
  getDashboardStats,
  getTopConsumedMaterials,
  getInventoryValueTrend,
  getShrinkageMetrics
} from "../lib/reportService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { withDefaultDateRange } from "../lib/queryBuilder.js";

export const getStats = asyncHandler(async (req, res) => {
  const stats = await getDashboardStats(req.branchId, req.user);
  res.json(stats);
});

export const getKPIs = asyncHandler(async (req, res) => {
  const filters = withDefaultDateRange(req.filters, 90);
  const kpis = await getReportKPIs(filters);
  res.json(kpis);
});

export const getComparison = asyncHandler(async (req, res) => {
  // Branch comparison compares all branches, so branchId is omitted
  const filters = withDefaultDateRange({ ...req.filters, branchId: undefined }, 90);
  const comparison = await getBranchComparison(filters);
  res.json(comparison);
});

export const getCostTrends = asyncHandler(async (req, res) => {
  const filters = withDefaultDateRange(req.filters, 90);
  const trends = await getReportCostTrends(filters);
  res.json(trends);
});

export const getTopConsumed = asyncHandler(async (req, res) => {
  const filters = withDefaultDateRange(req.filters, 90);
  const data = await getTopConsumedMaterials(filters);
  res.json(data);
});

export const getValueTrend = asyncHandler(async (req, res) => {
  const filters = withDefaultDateRange(req.filters, 90);
  const data = await getInventoryValueTrend(filters);
  res.json(data);
});

export const getShrinkage = asyncHandler(async (req, res) => {
  const filters = withDefaultDateRange(req.filters, 30);
  const metrics = await getShrinkageMetrics({
    branchId: req.branchId,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });
  res.json(metrics);
});
