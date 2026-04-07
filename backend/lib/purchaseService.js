/**
 * Purchase Service
 * 
 * Handles logging of material purchases and updates branch-specific inventory metrics.
 * This is a core part of the system that ensures stock levels and average costs are accurate.
 */

import { prisma } from './prisma.js';
import { calculateWeightedAverageCost } from './inventoryUtils.js';
import { getPrismaPagination, formatPaginatedResponse } from './paginationUtils.js';

/**
 * Logs a new material purchase and updates the branch's stock and weighted average cost.
 * 
 * @param data - The purchase details (branch, material, qty, price, etc.)
 * @returns The created purchase record and the updated branch material state.
 * 
 * Business Logic:
 * 1. Validates input (positive quantity and non-negative price).
 * 2. Uses a Prisma transaction to ensure atomicity.
 * 3. Upserts the BranchMaterial record if it doesn't exist.
 * 4. Calculates the new Weighted Average Cost (WAC) to track inventory value accurately.
 * 5. Increments the current stock and updates the WAC.
 * 6. Creates a permanent record of the purchase for auditing and reporting.
 */
export async function logPurchase(data) {
  const { branchId, materialId, quantity, unitPrice, supplier, invoiceRef, purchaseDate, loggedById } = data;

  if (quantity <= 0 || unitPrice < 0) {
    throw new Error('Quantity must be positive and unit price cannot be negative.');
  }

  const totalCost = quantity * unitPrice;

  return await prisma.$transaction(async (tx) => {
    // 0. Verify material exists
    const material = await tx.materialCatalog.findUnique({ where: { id: materialId } });
    if (!material) throw new Error(`Material with ID ${materialId} not found.`);

    // 0b. Verify branch exists
    const branch = await tx.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new Error(`Branch with ID ${branchId} not found.`);

    // 1. Get current branch material state
    let branchMaterial = await tx.branchMaterial.findUnique({
      where: { branchId_materialId: { branchId, materialId } }
    });

    // 2. If it doesn't exist, create it (activate it)
    if (!branchMaterial) {
      branchMaterial = await tx.branchMaterial.create({
        data: {
          branchId,
          materialId,
          currentStock: 0,
          avgCost: 0,
          isActive: true
        }
      });
    }

    // 3. Calculate new weighted average cost
    const newAvgCost = calculateWeightedAverageCost(
      branchMaterial.currentStock,
      branchMaterial.avgCost,
      quantity,
      unitPrice
    );

    // 4. Update branch material stock and avg cost
    const updatedBranchMaterial = await tx.branchMaterial.update({
      where: { id: branchMaterial.id },
      data: {
        currentStock: { increment: quantity },
        avgCost: newAvgCost
      }
    });

    // 5. Create purchase record
    const purchase = await tx.purchase.create({
      data: {
        branchId,
        materialId,
        quantity,
        unitPrice,
        totalCost,
        supplier,
        invoiceRef,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        loggedById
      },
      include: {
        material: true,
        branch: true,
        loggedBy: {
          select: { name: true }
        }
      }
    });

    return { purchase, updatedBranchMaterial };
  });
}

/**
 * Retrieves the purchase history with optional filters, pagination, and search.
 * 
 * @param filters - Filter by branch, material, or date range.
 * @param params - Pagination, search, and sorting parameters.
 * @returns A paginated response of purchase records with related material, branch, and user data.
 */
export async function getPurchaseHistory(
  filters,
  params = {}
) {
  const { branchId, materialId, startDate, endDate } = filters;
  const { search, sortBy, sortOrder } = params;
  const { skip, take } = getPrismaPagination(params);

  const where = {};
  if (branchId) where.branchId = branchId;
  if (materialId) where.materialId = materialId;
  if (startDate || endDate) {
    where.purchaseDate = {};
    if (startDate) where.purchaseDate.gte = startDate;
    if (endDate) where.purchaseDate.lte = endDate;
  }

  if (search) {
    where.OR = [
      { invoiceRef: { contains: search } },
      { supplier: { contains: search } },
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
    orderBy.purchaseDate = 'desc';
  }

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: {
        material: true,
        branch: true,
        loggedBy: {
          select: { name: true }
        }
      },
      skip,
      take,
      orderBy
    }),
    prisma.purchase.count({ where })
  ]);

  return formatPaginatedResponse(purchases, total, params);
}

/**
 * Fetches unit price trends for a specific material.
 * Used for generating cost trend charts in the dashboard.
 */
export async function getCostTrends(materialId, branchId) {
  const where = { materialId };
  if (branchId) where.branchId = branchId;

  const purchases = await prisma.purchase.findMany({
    where,
    select: {
      unitPrice: true,
      purchaseDate: true
    },
    orderBy: { purchaseDate: 'asc' }
  });

  return purchases;
}
