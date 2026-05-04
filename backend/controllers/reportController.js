import { 
  getReportKPIs, 
  getBranchComparison, 
  getReportCostTrends,
  getDashboardStats,
  getTopConsumedMaterials,
  getInventoryValueTrend
} from "../lib/reportService.js";
import { prisma } from "../lib/prisma.js";

export const getStats = async (req, res) => {
  let branchId = null;
  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }
  try {
    const stats = await getDashboardStats(branchId, req.user);
    res.json(stats);
  } catch (error) {
    console.error("Dashboard stats fetch error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};

export const getKPIs = async (req, res) => {
  let branchId = null;
  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }
  try {
    const kpis = await getReportKPIs(branchId, req.query);
    res.json(kpis);
  } catch (error) {
    console.error("KPI fetch error:", error);
    res.status(500).json({ error: "Failed to fetch report KPIs" });
  }
};

export const getComparison = async (req, res) => {
  try {
    const comparison = await getBranchComparison(req.query);
    res.json(comparison);
  } catch (error) {
    console.error("Branch comparison error:", error);
    res.status(500).json({ error: "Failed to fetch branch comparison" });
  }
};

export const getCostTrends = async (req, res) => {
  let branchId = null;
  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }
  try {
    const trends = await getReportCostTrends(branchId, req.query);
    res.json(trends);
  } catch (error) {
    console.error("Cost trends error:", error);
    res.status(500).json({ error: "Failed to fetch cost trends" });
  }
};

export const getTopConsumed = async (req, res) => {
  let branchId = null;
  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }
  try {
    const data = await getTopConsumedMaterials(branchId, req.query);
    res.json(data);
  } catch (error) {
    console.error("Top consumed materials error:", error);
    res.status(500).json({ error: "Failed to fetch top consumed materials" });
  }
};

export const getValueTrend = async (req, res) => {
  let branchId = null;
  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }
  try {
    const data = await getInventoryValueTrend(branchId, req.query);
    res.json(data);
  } catch (error) {
    console.error("Inventory value trend error:", error);
    res.status(500).json({ error: "Failed to fetch inventory value trend" });
  }
};

export const getShrinkage = async (req, res) => {
  let { branchId, startDate, endDate } = req.query;
  
  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }

  try {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    
    if (endDate) {
      end.setHours(23, 59, 59, 999);
    }

    const kpis = await getReportKPIs(branchId, { startDate: start, endDate: end });
    
    const purchases = await prisma.purchase.aggregate({
      where: { 
        ...(branchId ? { branchId } : {}),
        purchaseDate: { gte: start, lte: end } 
      },
      _sum: { quantity: true }
    });

    res.json({
      shrinkageRate: kpis.shrinkageRate,
      totalAdjustedQty: kpis.totalShrinkageQty,
      adjustmentCount: await prisma.stockAdjustment.count({
        where: { 
          ...(branchId ? { branchId } : {}),
          status: 'APPROVED', 
          reason: { in: ['WASTE', 'LOSS'] },
          adjustmentDate: { gte: start, lte: end }
        }
      }),
      totalMovement: purchases._sum.quantity || 0
    });
  } catch (error) {
    console.error("Shrinkage report error:", error);
    res.status(500).json({ error: "Failed to fetch shrinkage metrics" });
  }
};
