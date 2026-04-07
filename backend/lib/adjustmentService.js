/**
 * Stock Adjustment Service
 * 
 * Manages inventory corrections, waste, and loss logging.
 * Includes an approval workflow where branch managers must review and approve adjustments
 * before they impact the actual stock levels.
 */

import { prisma } from './prisma.js';
import { calculateShrinkageRate } from './inventoryUtils.js';
import { getPrismaPagination, formatPaginatedResponse } from './paginationUtils.js';
import { notifyRoles, createNotification } from './notificationService.js';

/**
 * Records a new stock adjustment request.
 * 
 * Adjustments are PENDING by default and do not affect stock until approved.
 * This ensures accountability for inventory changes due to waste, loss, or corrections.
 * Notifies Branch Managers and Super Admins.
 */
export async function recordAdjustment(data) {
  const { adjustmentDate, ...rest } = data;
  const adjustment = await prisma.stockAdjustment.create({
    data: {
      ...rest,
      adjustmentDate: adjustmentDate ? new Date(adjustmentDate) : new Date(),
      status: 'PENDING_APPROVAL'
    },
    include: {
      material: true,
      branch: true,
      loggedBy: { select: { name: true } }
    }
  });

  // Notify Branch Manager and Super Admin
  await notifyRoles(
    ['BRANCH_MANAGER', 'SUPER_ADMIN'],
    'New Stock Adjustment Request',
    `${adjustment.loggedBy.name} requested a ${adjustment.quantity > 0 ? 'positive' : 'negative'} adjustment of ${Math.abs(adjustment.quantity)} ${adjustment.material.unit} for ${adjustment.material.name} at ${adjustment.branch.name}. Reason: ${adjustment.reason}`,
    '/adjustments',
    adjustment.branchId
  );

  return adjustment;
}

/**
 * Approves a pending stock adjustment and updates the branch's inventory.
 * 
 * Business Logic:
 * 1. Verifies the adjustment exists and is still pending.
 * 2. Updates the adjustment status to APPROVED.
 * 3. Increments/Decrements the current stock in the BranchMaterial record.
 * 4. Uses a transaction to ensure both status and stock are updated together.
 * 5. Notifies the requester.
 */
export async function approveAdjustment(adjustmentId, approvedById) {
  return await prisma.$transaction(async (tx) => {
    const adjustment = await tx.stockAdjustment.findUnique({
      where: { id: adjustmentId },
      include: { branch: true, material: true }
    });

    if (!adjustment) throw new Error('Adjustment not found');
    if (adjustment.status !== 'PENDING_APPROVAL') throw new Error('Adjustment already processed');

    // Update the adjustment status
    const updatedAdjustment = await tx.stockAdjustment.update({
      where: { id: adjustmentId },
      data: {
        status: 'APPROVED',
        approvedById,
        adjustmentDate: new Date()
      }
    });

    // Update the BranchMaterial stock
    await tx.branchMaterial.update({
      where: {
        branchId_materialId: {
          branchId: adjustment.branchId,
          materialId: adjustment.materialId
        }
      },
      data: {
        currentStock: { increment: adjustment.quantity }
      }
    });

    // Notify the requester
    await createNotification({
      userId: adjustment.loggedById,
      title: 'Adjustment Approved',
      message: `Your stock adjustment for ${adjustment.material.name} (${adjustment.quantity} ${adjustment.material.unit}) has been approved.`,
      link: '/adjustments'
    });

    return updatedAdjustment;
  });
}

/**
 * Rejects a stock adjustment.
 * Notifies the requester.
 */
export async function rejectAdjustment(adjustmentId, approvedById) {
  const adjustment = await prisma.stockAdjustment.findUnique({
    where: { id: adjustmentId },
    include: { material: true }
  });

  if (!adjustment) throw new Error('Adjustment not found');

  const updatedAdjustment = await prisma.stockAdjustment.update({
    where: { id: adjustmentId },
    data: {
      status: 'REJECTED',
      approvedById
    }
  });

  // Notify the requester
  await createNotification({
    userId: adjustment.loggedById,
    title: 'Adjustment Rejected',
    message: `Your stock adjustment for ${adjustment.material.name} (${adjustment.quantity} ${adjustment.material.unit}) has been rejected.`,
    link: '/adjustments'
  });

  return updatedAdjustment;
}

/**
 * Calculates shrinkage metrics for a branch over a specific period.
 * 
 * Shrinkage Rate = (Total Waste + Total Loss) / (Total Purchases + Total Transfers In)
 * This KPI helps identify branches with high inventory loss.
 */
export async function getShrinkageMetrics(branchId, startDate, endDate) {
  // 1. Get all approved adjustments (Waste/Loss)
  const adjustments = await prisma.stockAdjustment.findMany({
    where: {
      branchId,
      status: 'APPROVED',
      reason: { in: ['WASTE', 'LOSS'] },
      adjustmentDate: { gte: startDate, lte: endDate }
    }
  });

  const totalAdjustedQty = Math.abs(adjustments.reduce((sum, adj) => sum + adj.quantity, 0));

  // 2. Get total stock movement (Purchases + Transfers In)
  const purchases = await prisma.purchase.aggregate({
    where: { branchId, purchaseDate: { gte: startDate, lte: endDate } },
    _sum: { quantity: true }
  });

  const transfersIn = await prisma.transfer.aggregate({
    where: { toBranchId: branchId, status: 'COMPLETED', updatedAt: { gte: startDate, lte: endDate } },
    _sum: { quantity: true }
  });

  const totalMovement = (purchases._sum.quantity || 0) + (transfersIn._sum.quantity || 0);
  const shrinkageRate = calculateShrinkageRate(totalAdjustedQty, totalMovement);

  return {
    totalAdjustedQty,
    totalMovement,
    shrinkageRate: Number(shrinkageRate.toFixed(2)),
    adjustmentCount: adjustments.length
  };
}

/**
 * Retrieves the adjustment history with optional filters, pagination, and search.
 * 
 * @param filters - Filter by branch, material, status, or date range.
 * @param params - Pagination, search, and sorting parameters.
 * @returns A paginated response of adjustment records with related material, branch, and user data.
 */
export async function getAdjustmentHistory(
  filters,
  params = {}
) {
  const { branchId, materialId, status, startDate, endDate } = filters;
  const { search, sortBy, sortOrder } = params;
  const { skip, take } = getPrismaPagination(params);

  const where = {};
  if (branchId) where.branchId = branchId;
  if (materialId) where.materialId = materialId;
  if (status) where.status = status;
  if (startDate || endDate) {
    where.adjustmentDate = {};
    if (startDate) where.adjustmentDate.gte = startDate;
    if (endDate) where.adjustmentDate.lte = endDate;
  }

  if (search) {
    where.OR = [
      { notes: { contains: search } },
      { material: { name: { contains: search } } },
    ];
  }

  const orderBy = {};
  if (sortBy) {
    if (sortBy.includes('.')) {
      const [relation, field] = sortBy.split('.');
      orderBy[relation] = { [field]: sortOrder || 'asc' };
    } else {
      orderBy[sortBy] = sortOrder || 'asc';
    }
  } else {
    orderBy.adjustmentDate = 'desc';
  }

  const [adjustments, total] = await Promise.all([
    prisma.stockAdjustment.findMany({
      where,
      include: {
        material: true,
        branch: true,
        loggedBy: { select: { name: true } },
        approvedBy: { select: { name: true } }
      },
      skip,
      take,
      orderBy
    }),
    prisma.stockAdjustment.count({ where })
  ]);

  return formatPaginatedResponse(adjustments, total, params);
}