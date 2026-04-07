import { prisma } from './prisma.js';

/**
 * Fetches the current inventory for a specific branch.
 * 
 * @param branchId - The ID of the branch.
 * @returns A list of materials in the branch with their current stock and average cost.
 */
export async function getInventoryByBranch(branchId) {
  const where = {};
  if (branchId) where.branchId = branchId;

  return await prisma.branchMaterial.findMany({
    where,
    include: {
      material: true,
      branch: { select: { name: true } }
    },
    orderBy: {
      material: { name: 'asc' }
    }
  });
}

/**
 * Aggregates inventory statistics for a branch or the entire system.
 * 
 * @param branchId - Optional branch ID to filter stats.
 * @returns An object containing total stock value, low stock count, and active materials.
 */
export async function getInventoryStats(branchId) {
  const where = {};
  if (branchId) where.branchId = branchId;

  const materials = await prisma.branchMaterial.findMany({
    where,
    include: { material: true }
  });

  // Calculate total value manually since we need to multiply currentStock * avgCost
  const totalValue = materials.reduce((sum, m) => sum + (m.currentStock * m.avgCost), 0);
  
  // Calculate total stock quantity
  const totalStockQuantity = materials.reduce((sum, m) => sum + m.currentStock, 0);

  // Calculate low stock count correctly
  const lowStockItems = materials.filter(m => m.currentStock > 0 && m.currentStock <= m.reorderThreshold).length;

  // Calculate out of stock items
  const outOfStockItems = materials.filter(m => m.currentStock === 0).length;

  // Calculate pending reorder alerts (items below threshold)
  const pendingReorders = materials.filter(m => m.currentStock <= m.reorderThreshold).length;

  return {
    totalMaterials: materials.length,
    totalStockQuantity,
    lowStockItems,
    outOfStockItems,
    totalInventoryValue: totalValue,
    pendingReorders,
    activeMaterials: materials.filter(m => m.isActive).length
  };
}

/**
 * Retrieves a unified history of all transactions (Purchases, Usage, Adjustments, Transfers)
 * for a specific material in a branch.
 * 
 * @param branchId - The ID of the branch.
 * @param materialId - The ID of the material.
 * @returns A sorted list of transaction events.
 */
export async function getInventoryHistory(branchId, materialId) {
  const where = { branchId, materialId };

  const [purchases, usage, adjustments, transfersIn, transfersOut] = await Promise.all([
    prisma.purchase.findMany({ where }),
    prisma.usageLog.findMany({ where, include: { loggedBy: { select: { name: true } } } }),
    prisma.stockAdjustment.findMany({ where, include: { loggedBy: { select: { name: true } } } }),
    prisma.transfer.findMany({ where: { toBranchId: branchId, materialId }, include: { fromBranch: true, loggedBy: { select: { name: true } } } }),
    prisma.transfer.findMany({ where: { fromBranchId: branchId, materialId }, include: { toBranch: true, loggedBy: { select: { name: true } } } })
  ]);

  // Map all events to a common format
  const events = [
    ...purchases.map(p => ({
      id: `purchase-${p.id}`,
      type: 'PURCHASE',
      date: p.purchaseDate,
      quantity: p.quantity,
      cost: p.totalCost,
      reference: p.invoiceRef,
      description: `Purchased from ${p.supplier || 'Unknown'}`
    })),
    ...usage.map(u => ({
      id: `usage-${u.id}`,
      type: 'USAGE',
      date: u.usageDate,
      quantity: -u.quantityUsed,
      cost: 0,
      reference: u.isSuspicious ? 'SUSPICIOUS' : 'NORMAL',
      description: `Used by ${u.loggedBy?.name || 'Unknown'}`
    })),
    ...adjustments.map(a => ({
      id: `adj-${a.id}`,
      type: 'ADJUSTMENT',
      date: a.adjustmentDate,
      quantity: a.quantity,
      cost: 0,
      reference: a.reason,
      description: a.notes || `Stock adjustment (${a.reason})`
    })),
    ...transfersIn.map(t => ({
      id: `tr-in-${t.id}`,
      type: 'TRANSFER_IN',
      date: t.transferDate || t.createdAt,
      quantity: t.quantity,
      cost: 0,
      reference: t.status,
      description: `Transferred from ${t.fromBranch?.name || 'Unknown'}`
    })),
    ...transfersOut.map(t => ({
      id: `tr-out-${t.id}`,
      type: 'TRANSFER_OUT',
      date: t.transferDate || t.createdAt,
      quantity: -t.quantity,
      cost: 0,
      reference: t.status,
      description: `Transferred to ${t.toBranch?.name || 'Unknown'}`
    }))
  ];

  return events.sort((a, b) => new Date(b.date) - new Date(a.date));
}
