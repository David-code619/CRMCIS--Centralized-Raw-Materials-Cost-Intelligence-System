/**
 * Report Service
 * 
 * Provides analytics and KPI calculations for the system dashboards.
 * Aggregates data from purchases, usage logs, and stock adjustments to provide
 * insights into inventory value, shrinkage rates, and cost trends.
 */

import { prisma } from './prisma.js';
import { calculateShrinkageRate, calculateUsageVariance, calculateCostChange } from './inventoryUtils.js';

/**
 * Aggregates high-level Key Performance Indicators (KPIs) for the dashboard.
 * 
 * @param filters - Filter by branch, material, category, and date range.
 * @returns An object containing total purchase value, shrinkage metrics, and usage variance.
 * 
 * Calculations:
 * 1. Total Purchase Value: Sum of all totalCost in the Purchase table for the period.
 * 2. Total Shrinkage: Sum of quantities in approved StockAdjustments (Waste/Loss).
 * 3. Usage Metrics: Sum of quantityUsed and varianceAmount from UsageLogs.
 * 4. Shrinkage Rate: (Shrinkage Qty / Total Purchase Qty) * 100.
 */
export async function getReportKPIs(filters) {
  const { branchId, materialId, category, startDate, endDate } = filters;
  console.log('getReportKPIs called with filters:', filters);

  const where = {};
  if (branchId) where.branchId = branchId;
  if (materialId) where.materialId = materialId;
  if (category) where.material = { category };

  console.log('Where clause:', where);

  // Calculate previous period for trends
  const duration = endDate.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - duration);
  const prevEndDate = new Date(endDate.getTime() - duration);

  // 1. Total Purchase Value (Current)
  const purchaseSum = await prisma.purchase.aggregate({
    where: {
      ...where,
      purchaseDate: { gte: startDate, lte: endDate }
    },
    _sum: { totalCost: true, quantity: true },
    _avg: { unitPrice: true }
  });

  // 1b. Total Purchase Value (Previous)
  const prevPurchaseSum = await prisma.purchase.aggregate({
    where: {
      ...where,
      purchaseDate: { gte: prevStartDate, lte: prevEndDate }
    },
    _sum: { totalCost: true },
    _avg: { unitPrice: true }
  });

  // 2. Total Shrinkage (Waste/Loss)
  const adjustments = await prisma.stockAdjustment.findMany({
    where: {
      ...where,
      status: 'APPROVED',
      reason: { in: ['WASTE', 'LOSS'] },
      adjustmentDate: { gte: startDate, lte: endDate }
    },
    include: { material: true }
  });

  const prevAdjustments = await prisma.stockAdjustment.aggregate({
    where: {
      ...where,
      status: 'APPROVED',
      reason: { in: ['WASTE', 'LOSS'] },
      adjustmentDate: { gte: prevStartDate, lte: prevEndDate }
    },
    _sum: { quantity: true }
  });

  const totalShrinkageQty = Math.abs(adjustments.reduce((sum, a) => sum + a.quantity, 0));
  const prevShrinkageQty = Math.abs(prevAdjustments._sum.quantity || 0);
  
  // 3. Usage Metrics
  const usage = await prisma.usageLog.aggregate({
    where: {
      ...where,
      usageDate: { gte: startDate, lte: endDate }
    },
    _sum: { quantityUsed: true, varianceAmount: true }
  });

  // 4. Highest Variance Category
  const categoryVariance = await prisma.usageLog.groupBy({
    by: ['materialId'],
    where: {
      ...where,
      usageDate: { gte: startDate, lte: endDate }
    },
    _sum: { varianceAmount: true }
  });

  let highestVarianceCategory = 'N/A';
  if (categoryVariance.length > 0) {
    const topMatId = categoryVariance.sort((a, b) => Math.abs(b._sum.varianceAmount || 0) - Math.abs(a._sum.varianceAmount || 0))[0].materialId;
    const topMat = await prisma.materialCatalog.findUnique({ where: { id: topMatId } });
    highestVarianceCategory = topMat?.category || 'Other';
  }

  // Calculations
  const totalMovement = (purchaseSum._sum.quantity || 0);
  const shrinkageRate = calculateShrinkageRate(totalShrinkageQty, totalMovement);
  const totalUsageQty = usage._sum.quantityUsed || 0;
  const totalVariance = usage._sum.varianceAmount || 0;
  const usageVariancePercent = calculateUsageVariance(totalUsageQty, totalUsageQty - totalVariance);

  // Trends
  const costTrend = calculateCostChange(purchaseSum._avg.unitPrice || 0, prevPurchaseSum._avg.unitPrice || 0);
  const wasteTrend = calculateCostChange(totalShrinkageQty, prevShrinkageQty);

  return {
    totalPurchaseValue: purchaseSum._sum.totalCost || 0,
    totalShrinkageQty,
    shrinkageRate: Number(shrinkageRate.toFixed(2)),
    totalUsageQty,
    totalVariance,
    usageVariancePercent: Number(usageVariancePercent.toFixed(2)),
    costTrend: Number(costTrend.toFixed(1)),
    wasteTrend: Number(wasteTrend.toFixed(1)),
    highestVarianceCategory
  };
}

/**
 * Gets cost trends for materials.
 */
export async function getReportCostTrends(filters) {
  const { branchId, materialId, category, startDate, endDate } = filters;

  const where = {
    purchaseDate: { gte: startDate, lte: endDate }
  };
  if (branchId) where.branchId = branchId;
  if (materialId) where.materialId = materialId;
  if (category) where.material = { category };

  const purchases = await prisma.purchase.findMany({
    where,
    orderBy: { purchaseDate: 'asc' },
    select: { purchaseDate: true, unitPrice: true }
  });

  // Group by month/day for the chart
  return purchases.map(p => ({
    date: p.purchaseDate.toISOString().split('T')[0],
    unitPrice: p.unitPrice
  }));
}

/**
 * Retrieves the top 5 most consumed materials by quantity.
 * Used for the 'Top Consumed Materials' bar chart.
 */
export async function getTopConsumedMaterials(filters) {
  const { branchId, materialId, category, startDate, endDate } = filters;

  const where = {
    usageDate: { gte: startDate, lte: endDate }
  };
  if (branchId) where.branchId = branchId;
  if (materialId) where.materialId = materialId;
  if (category) where.material = { category };

  const usage = await prisma.usageLog.groupBy({
    by: ['materialId'],
    where,
    _sum: { quantityUsed: true },
    orderBy: { _sum: { quantityUsed: 'desc' } },
    take: 5
  });

  const materialIdsFromUsage = usage.map(u => u.materialId);
  const materials = await prisma.materialCatalog.findMany({
    where: { id: { in: materialIdsFromUsage } }
  });

  return usage.map(u => ({
    name: (Array.isArray(materials) ? materials : []).find(m => m.id === u.materialId)?.name || 'Unknown',
    value: u._sum.quantityUsed || 0
  }));
}

/**
 * Compares shrinkage rates across all branches.
 * Only accessible by SUPER_ADMIN to identify underperforming or problematic branches.
 */
export async function getBranchComparison(filters) {
  const { startDate, endDate } = filters;

  const branches = await prisma.branch.findMany();
  const comparison = await Promise.all(branches.map(async (b) => {
    const adjustments = await prisma.stockAdjustment.aggregate({
      where: {
        branchId: b.id,
        status: 'APPROVED',
        reason: { in: ['WASTE', 'LOSS'] },
        adjustmentDate: { gte: startDate, lte: endDate }
      },
      _sum: { quantity: true }
    });

    const purchases = await prisma.purchase.aggregate({
      where: { branchId: b.id, purchaseDate: { gte: startDate, lte: endDate } },
      _sum: { quantity: true }
    });

    const shrinkageQty = Math.abs(adjustments._sum.quantity || 0);
    const movement = purchases._sum.quantity || 0;
    const rate = calculateShrinkageRate(shrinkageQty, movement);

    return {
      branchId: b.id,
      branchName: b.name,
      shrinkageRate: Number(rate.toFixed(2)),
      totalShrinkage: shrinkageQty
    };
  }));

  return comparison.sort((a, b) => b.shrinkageRate - a.shrinkageRate);
}

/**
 * Gets inventory value trend (simulated over the date range).
 */
export async function getInventoryValueTrend(filters) {
  const { branchId, materialId, category, startDate, endDate } = filters;
  
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const trend = [];

  // Get all relevant data
  const [purchases, usage, branchMaterials] = await Promise.all([
    prisma.purchase.findMany({
      where: { 
        branchId: branchId || undefined, 
        materialId: materialId || (materialIds ? { in: materialIds } : undefined),
        purchaseDate: { lte: endDate } 
      },
      select: { purchaseDate: true, totalCost: true }
    }),
    prisma.usageLog.findMany({
      where: { 
        branchId: branchId || undefined, 
        materialId: materialId || undefined,
        material: category ? { category } : undefined,
        usageDate: { lte: endDate } 
      },
      select: { usageDate: true, quantityUsed: true, materialId: true }
    }),
    prisma.branchMaterial.findMany({
      where: { 
        branchId: branchId || undefined,
        materialId: materialId || undefined,
        material: category ? { category } : undefined
      },
      select: { materialId: true, avgCost: true }
    })
  ]);

  const costMap = new Map(branchMaterials.map(bm => [bm.materialId, bm.avgCost]));

  for (let i = 0; i <= days; i += Math.max(1, Math.floor(days / 10))) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const totalPurchased = purchases
      .filter(p => p.purchaseDate <= date)
      .reduce((sum, p) => sum + p.totalCost, 0);

    const totalUsedValue = usage
      .filter(u => u.usageDate <= date)
      .reduce((sum, u) => sum + (u.quantityUsed * (costMap.get(u.materialId) || 0)), 0);

    const currentValue = Math.max(0, totalPurchased - totalUsedValue);

    trend.push({
      date: date.toISOString().split('T')[0],
      value: Number(currentValue.toFixed(2))
    });
  }

  return trend;
}

/**
 * Retrieves high-level dashboard statistics and intelligence data.
 * 
 * @param {string|null} branchId - Optional branch ID to filter stats.
 * @param {Object} user - The current user object for role-based data.
 * @returns {Promise<Object>} An object containing all data needed for the dashboard.
 */
export async function getDashboardStats(branchId, user) {
  const where = branchId ? { branchId } : {};
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));
  const startOfToday = new Date(now.setHours(0, 0, 0, 0));

  // 1. Basic KPIs (Current 30 days)
  const [
    inventory,
    purchases,
    usage,
    adjustments,
    transfers,
    usageLogs,
    prevPurchases,
    prevUsage
  ] = await Promise.all([
    prisma.branchMaterial.findMany({ where, include: { material: true } }),
    prisma.purchase.aggregate({ 
      where: { ...where, purchaseDate: { gte: thirtyDaysAgo } }, 
      _sum: { totalCost: true, quantity: true },
      _avg: { unitPrice: true }
    }),
    prisma.usageLog.count({ where: { ...where, usageDate: { gte: thirtyDaysAgo } } }),
    prisma.stockAdjustment.aggregate({
      where: { ...where, status: 'APPROVED', reason: { in: ['WASTE', 'LOSS'] }, adjustmentDate: { gte: thirtyDaysAgo } },
      _sum: { quantity: true }
    }),
    prisma.transfer.count({
      where: {
        ...(branchId ? {
          OR: [
            { fromBranchId: branchId },
            { toBranchId: branchId }
          ]
        } : {}),
        status: { in: ['REQUESTED', 'PENDING_APPROVAL'] }
      }
    }),
    prisma.usageLog.findMany({
      where: { ...where, usageDate: { gte: thirtyDaysAgo } },
      orderBy: { usageDate: 'desc' },
      take: 10,
      include: { material: true, branch: true }
    }),
    prisma.purchase.aggregate({
      where: { ...where, purchaseDate: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      _sum: { totalCost: true },
      _avg: { unitPrice: true }
    }),
    prisma.usageLog.count({ where: { ...where, usageDate: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } })
  ]);

  // Calculate Trends
  const calculateTrend = (curr, prev) => {
    if (!prev || prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  const purchaseTrend = calculateTrend(purchases._sum.totalCost || 0, prevPurchases._sum.totalCost || 0);
  const usageTrend = calculateTrend(usage, prevUsage);
  const costIncrease = calculateTrend(purchases._avg.unitPrice || 0, prevPurchases._avg.unitPrice || 0);

  // Calculate Total Stock Value
  const totalStockValue = inventory.reduce((sum, m) => sum + (m.currentStock * m.avgCost), 0);
  
  // Calculate Shrinkage Rate (30 days)
  const totalShrinkageQty = Math.abs(adjustments._sum.quantity || 0);
  const totalMovement = (purchases._sum.quantity || 0);
  const shrinkageRate = calculateShrinkageRate(totalShrinkageQty, totalMovement);

  // Critical Alerts (Items below threshold)
  const criticalItems = inventory.filter(m => m.currentStock <= m.reorderThreshold);
  const criticalAlertsCount = criticalItems.length;

  // Recent Activity (Latest 10 logs across all types)
  const [recentPurchases, recentUsage, recentAdjustments, recentTransfers] = await Promise.all([
    prisma.purchase.findMany({ where, take: 5, orderBy: { createdAt: 'desc' }, include: { material: true, loggedBy: true } }),
    prisma.usageLog.findMany({ where, take: 5, orderBy: { createdAt: 'desc' }, include: { material: true, loggedBy: true } }),
    prisma.stockAdjustment.findMany({ where, take: 5, orderBy: { createdAt: 'desc' }, include: { material: true, loggedBy: true } }),
    prisma.transfer.findMany({ 
      where: branchId ? { OR: [{ fromBranchId: branchId }, { toBranchId: branchId }] } : {}, 
      take: 5, 
      orderBy: { createdAt: 'desc' }, 
      include: { material: true, loggedBy: true, fromBranch: true, toBranch: true } 
    })
  ]);

  const recentActivity = [
    ...recentPurchases.map(p => ({ id: `p-${p.id}`, type: 'Purchase', title: 'Purchase Logged', detail: `${p.quantity} ${p.material.unit} ${p.material.name} from ${p.supplier}`, time: p.createdAt, user: p.loggedBy?.name || 'System' })),
    ...recentUsage.map(u => ({ id: `u-${u.id}`, type: 'Usage', title: 'Usage Logged', detail: `${u.quantityUsed} ${u.material.unit} ${u.material.name}`, time: u.createdAt, user: u.loggedBy?.name || 'System' })),
    ...recentAdjustments.map(a => ({ id: `a-${a.id}`, type: 'Adjustment', title: 'Stock Adjustment', detail: `${a.quantity} ${a.material.unit} ${a.material.name} (${a.reason})`, time: a.createdAt, user: a.loggedBy?.name || 'System' })),
    ...recentTransfers.map(t => ({ id: `t-${t.id}`, type: 'Transfer', title: 'Transfer Logged', detail: `${t.quantity} ${t.material.unit} ${t.material.name} to ${t.toBranch.name}`, time: t.createdAt, user: t.loggedBy?.name || 'System' }))
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

  // Suspicious Usage Alerts
  const alertsMap = new Map();
  usageLogs
    .filter(log => log.isSuspicious && !log.isAudited)
    .forEach(log => {
      if (!alertsMap.has(log.id)) {
        const expected = log.quantityUsed - (log.varianceAmount || 0);
        const variancePercent = expected > 0 ? ((log.varianceAmount || 0) / expected) * 100 : 0;
        alertsMap.set(log.id, {
          id: `alert-${log.id}`,
          branch: log.branch?.name || 'Unknown',
          item: log.material?.name || 'Unknown',
          variance: `${variancePercent > 0 ? '+' : ''}${variancePercent.toFixed(1)}%`,
          status: 'danger',
          time: log.usageDate,
          description: 'Variance exceeds threshold'
        });
      }
    });
  const alerts = Array.from(alertsMap.values());

  // Chart Data: Top Consumed (for branch)
  const topConsumed = await getTopConsumedMaterials({ branchId, startDate: thirtyDaysAgo, endDate: new Date() });

  // Chart Data: Stock Composition (by category)
  const categories = [...new Set(inventory.map(m => m.material.category))];
  const stockComposition = categories.map(cat => {
    const catValue = inventory
      .filter(m => m.material.category === cat)
      .reduce((sum, m) => sum + (m.currentStock * m.avgCost), 0);
    return {
      name: cat,
      value: totalStockValue > 0 ? Math.round((catValue / totalStockValue) * 100) : 0,
      color: cat === 'Meat' ? '#1A73E8' : cat === 'Oil' ? '#34A853' : cat === 'Dry Goods' ? '#FBBC04' : '#EA4335'
    };
  }).filter(c => c.value > 0);

  // Chart Data: Branch Comparison (Super Admin only)
  let branchComparison = [];
  if (user.role === 'SUPER_ADMIN') {
    branchComparison = await getBranchComparison({ startDate: thirtyDaysAgo, endDate: new Date() });
    // Map to format expected by UI
    branchComparison = branchComparison.map(b => ({
      name: b.branchName,
      value: inventory.filter(m => m.branchId === b.branchId).reduce((sum, m) => sum + (m.currentStock * m.avgCost), 0),
      shrinkage: b.shrinkageRate
    }));
  }

  // Chart Data: Cost Trends (Last 6 months)
  const costTrends = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const monthName = monthDate.toLocaleString('default', { month: 'short' });
    
    const monthPurchases = await prisma.purchase.aggregate({
      where: { ...where, purchaseDate: { gte: monthDate, lte: monthEnd } },
      _sum: { totalCost: true }
    });
    
    costTrends.push({
      month: monthName,
      cost: monthPurchases._sum.totalCost || 0
    });
  }

  // Inventory Officer Specifics
  const entriesToday = await Promise.all([
    prisma.purchase.count({ where: { ...where, loggedById: user.id, createdAt: { gte: startOfToday } } }),
    prisma.usageLog.count({ where: { ...where, loggedById: user.id, createdAt: { gte: startOfToday } } }),
    prisma.stockAdjustment.count({ where: { ...where, loggedById: user.id, createdAt: { gte: startOfToday } } }),
    prisma.transfer.count({ 
      where: { 
        loggedById: user.id, 
        createdAt: { gte: startOfToday },
        ...(branchId ? {
          OR: [
            { fromBranchId: branchId },
            { toBranchId: branchId }
          ]
        } : {})
      } 
    })
  ]).then(counts => counts.reduce((a, b) => a + b, 0));

  const incomingTransfers = await prisma.transfer.findMany({
    where: { 
      ...(branchId ? { toBranchId: branchId } : {}),
      status: 'APPROVED' 
    },
    include: { material: true, fromBranch: true },
    take: 5
  });

  const pendingTasks = await prisma.transfer.findMany({
    where: { loggedById: user.id, status: { in: ['REQUESTED', 'PENDING_APPROVAL'] } },
    include: { material: true },
    take: 5
  });

  const highestShrinkage = branchComparison.length > 0 
    ? [...branchComparison].sort((a, b) => b.shrinkage - a.shrinkage)[0]
    : null;

  return {
    totalStockValue,
    totalPurchases: purchases._sum.totalCost || 0,
    usageCount: usage,
    shrinkageRate: Number(shrinkageRate.toFixed(2)),
    criticalAlertsCount,
    pendingApprovalsCount: transfers,
    topConsumedMaterials: topConsumed,
    stockComposition,
    branchComparison,
    costTrends,
    recentActivity,
    alerts,
    lowStockItems: criticalItems.slice(0, 5).map(m => ({
      id: m.id,
      item: m.material.name,
      stock: `${m.currentStock}${m.material.unit}`,
      threshold: `${m.reorderThreshold}${m.material.unit}`
    })),
    incomingTransfers: incomingTransfers.map(t => ({
      id: t.id,
      item: t.material.name,
      qty: `${t.quantity}${t.material.unit}`,
      from: t.fromBranch.name
    })),
    pendingTasks: pendingTasks.map(t => ({
      id: t.id,
      title: `Transfer Request #${t.id.slice(-4).toUpperCase()}`,
      status: t.status.replace('_', ' '),
      time: `Logged ${Math.round((new Date() - new Date(t.createdAt)) / (1000 * 60 * 60))}h ago`
    })),
    entriesToday,
    itemsTracked: inventory.length,
    chainCostIncrease: Number(costIncrease.toFixed(1)),
    highestShrinkageBranch: highestShrinkage ? highestShrinkage.name : 'N/A',
    highestShrinkageValue: highestShrinkage ? `${highestShrinkage.shrinkage.toFixed(2)}%` : '0%',
    trends: {
      purchases: Number(purchaseTrend.toFixed(1)),
      usage: Number(usageTrend.toFixed(1)),
      cost: Number(costIncrease.toFixed(1))
    }
  };
}
