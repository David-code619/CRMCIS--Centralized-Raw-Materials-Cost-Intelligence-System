/**
 * Daily Usage Service
 * 
 * Tracks the consumption of raw materials at each branch.
 * Includes intelligence to flag suspicious usage patterns by comparing actual usage
 * against pre-defined benchmarks.
 */

import { prisma } from './prisma.js';
import { isUsageSuspicious, wouldResultInNegativeStock } from './inventoryUtils.js';
import { getPrismaPagination, formatPaginatedResponse } from './paginationUtils.js';
import { notifyRoles } from './notificationService.js';

/**
 * Records a new material usage log and updates branch inventory.
 * 
 * @param data - The usage details (branch, material, qty, etc.)
 * @returns The created usage log record.
 * 
 * Business Logic (Critical Transaction):
 * 1. Validates input (positive quantity).
 * 2. Verifies the material is active in the branch.
 * 3. Prevents usage if it would result in negative stock (enforces data integrity).
 * 4. Fetches the UsageBenchmark for the material/branch.
 * 5. Calculates variance and flags the entry as 'suspicious' if it exceeds the threshold.
 * 6. Decrements the current stock in the BranchMaterial record.
 * 7. Creates a permanent log of the usage for analytics.
 * 8. Triggers a low stock notification if current stock falls below threshold.
 */
export async function logUsage(data) {
  const { branchId, materialId, quantityUsed, usageDate, loggedById } = data;

  if (quantityUsed <= 0) {
    throw new Error('Quantity used must be positive.');
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Get current branch material state
    const branchMaterial = await tx.branchMaterial.findUnique({
      where: { branchId_materialId: { branchId, materialId } },
      include: { material: true, branch: true }
    });

    if (!branchMaterial) {
      throw new Error('Material not activated for this branch.');
    }

    // 2. Negative stock prevention
    if (wouldResultInNegativeStock(branchMaterial.currentStock, quantityUsed)) {
      throw new Error(`Insufficient stock. Current: ${branchMaterial.currentStock}, Requested: ${quantityUsed}`);
    }

    // 3. Get usage benchmark
    const benchmark = await tx.usageBenchmark.findUnique({
      where: { branchId_materialId: { branchId, materialId } }
    });

    let isSuspicious = false;
    let varianceAmount = 0;

    if (benchmark) {
      varianceAmount = quantityUsed - benchmark.expectedUsage;
      isSuspicious = isUsageSuspicious(quantityUsed, benchmark.expectedUsage, benchmark.threshold * 100);
    }

    // 4. Update branch material stock
    const updatedStock = branchMaterial.currentStock - quantityUsed;
    await tx.branchMaterial.update({
      where: { id: branchMaterial.id },
      data: {
        currentStock: updatedStock
      }
    });

    // 5. Trigger low stock notification if needed
    if (updatedStock <= branchMaterial.reorderThreshold) {
      const status = updatedStock === 0 ? 'OUT OF STOCK' : 'LOW STOCK';
      await notifyRoles(
        ['BRANCH_MANAGER', 'SUPER_ADMIN'],
        `${status}: ${branchMaterial.material.name}`,
        `${branchMaterial.material.name} is ${status.toLowerCase()} at ${branchMaterial.branch.name}. Current stock: ${updatedStock} ${branchMaterial.material.unit}.`,
        '/inventory',
        branchId
      );
    }

    // 6. Trigger suspicious usage notification if needed
    if (isSuspicious) {
      await notifyRoles(
        ['BRANCH_MANAGER', 'SUPER_ADMIN'],
        'Suspicious Usage Detected',
        `High variance detected for ${branchMaterial.material.name} at ${branchMaterial.branch.name}. Variance: ${varianceAmount.toFixed(2)} ${branchMaterial.material.unit}.`,
        '/usage',
        branchId
      );
    }

    // 7. Create usage log record
    return await tx.usageLog.create({
      data: {
        branchId,
        materialId,
        quantityUsed,
        usageDate: usageDate ? new Date(usageDate) : new Date(),
        loggedById,
        isSuspicious,
        varianceAmount
      },
      include: {
        material: true,
        branch: true,
        loggedBy: { select: { name: true } }
      }
    });
  });
}

/**
 * Retrieves usage history with optional filters, pagination, and search.
 * Useful for auditing and identifying patterns of high consumption or waste.
 * 
 * @param filters - Filter by branch, material, or suspicious status.
 * @param params - Pagination, search, and sorting parameters.
 * @returns A paginated response of usage records with related material, branch, and user data.
 */
export async function getUsageHistory(
  filters,
  params = {}
) {
  const { branchId, materialId, isSuspicious, startDate, endDate } = filters;
  const { search, sortBy, sortOrder } = params;
  const { skip, take } = getPrismaPagination(params);

  const where = {};
  if (branchId) where.branchId = branchId;
  if (materialId) where.materialId = materialId;
  if (isSuspicious !== undefined) where.isSuspicious = isSuspicious;
  if (startDate || endDate) {
    where.usageDate = {};
    if (startDate) where.usageDate.gte = startDate;
    if (endDate) where.usageDate.lte = endDate;
  }

  if (search) {
    where.OR = [
      { material: { name: { contains: search } } },
      { branch: { name: { contains: search } } },
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
    orderBy.usageDate = 'desc';
  }

  const [usageLogs, total] = await Promise.all([
    prisma.usageLog.findMany({
      where,
      include: {
        material: true,
        branch: true,
        loggedBy: { select: { name: true } }
      },
      skip,
      take,
      orderBy
    }),
    prisma.usageLog.count({ where })
  ]);

  return formatPaginatedResponse(usageLogs, total, params);
}

/**
 * Gets usage statistics for a material.
 */
export async function getUsageStats(materialId, branchId) {
  const where = { materialId };
  if (branchId) where.branchId = branchId;

  const stats = await prisma.usageLog.aggregate({
    where,
    _sum: { quantityUsed: true, varianceAmount: true },
    _avg: { quantityUsed: true },
    _count: { id: true }
  });

  return stats;
}

/**
 * Marks all suspicious usage logs as audited.
 * 
 * @param {string|null} branchId - Optional branch ID to filter logs.
 * @returns {Promise<Object>} The result of the update operation.
 */
export async function auditAllUsageLogs(branchId = null) {
  const where = { isSuspicious: true, isAudited: false };
  if (branchId) where.branchId = branchId;

  return await prisma.usageLog.updateMany({
    where,
    data: { isAudited: true }
  });
}