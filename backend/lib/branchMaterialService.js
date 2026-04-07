import { prisma } from './prisma.js';
import { getPrismaPagination, formatPaginatedResponse } from './paginationUtils.js';

/**
 * Fetches materials for a specific branch with pagination and search.
 */
export async function getBranchMaterials(
  branchId,
  filters = {},
  params = {}
) {
  const { category, isActive, status } = filters;
  const { search, sortBy, sortOrder } = params;
  const { skip, take } = getPrismaPagination(params);

  const where = {};
  if (branchId) where.branchId = branchId;
  if (isActive !== undefined) where.isActive = isActive;

  // Material-level filters
  const materialWhere = {};
  if (category) materialWhere.category = category;
  if (search) {
    materialWhere.OR = [
      { name: { contains: search } },
      { category: { contains: search } },
      { description: { contains: search } }
    ];
  }
  if (Object.keys(materialWhere).length > 0) {
    where.material = materialWhere;
  }

  // Status filters
  if (status) {
    if (status === 'OUT_OF_STOCK') {
      where.currentStock = 0;
    } else if (status === 'LOW_STOCK') {
      where.currentStock = {
        gt: 0,
        lte: prisma.branchMaterial.fields.reorderThreshold // This won't work directly in Prisma SQLite
      };
      // For SQLite, we might need a different approach or handle it in JS if it's complex, 
      // but let's try a simpler way if possible or just filter in JS for now if needed.
      // Actually, Prisma supports field comparisons in some providers but SQLite is limited.
      // Let's use a raw query or just fetch and filter if the dataset isn't huge, 
      // but for pagination we need it in the DB.
    } else if (status === 'IN_STOCK') {
      where.currentStock = {
        gt: prisma.branchMaterial.fields.reorderThreshold
      };
    }
  }

  // Since SQLite doesn't support field-to-field comparison in 'where' easily via Prisma, 
  // and the user wants "quantity <= reorderLevel", I'll have to handle 'status' carefully.
  // If status is provided, I'll fetch all matching other filters and filter in JS, 
  // then manually paginate. This is not ideal for performance but works for now.
  
  if (status && (status === 'LOW_STOCK' || status === 'IN_STOCK')) {
    const allMaterials = await prisma.branchMaterial.findMany({
      where: { ...where, currentStock: undefined }, // Remove the problematic filter
      include: { material: true, branch: true },
      orderBy: { material: { name: 'asc' } }
    });

    const filtered = allMaterials.filter(bm => {
      if (status === 'LOW_STOCK') return bm.currentStock > 0 && bm.currentStock <= bm.reorderThreshold;
      if (status === 'IN_STOCK') return bm.currentStock > bm.reorderThreshold;
      return true;
    });

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + take);
    return formatPaginatedResponse(paginated, total, params);
  }

  const orderBy = {};
  if (sortBy) {
    if (sortBy.includes('.')) {
      const [relation, field] = sortBy.split('.');
      orderBy[relation] = { [field]: sortOrder || 'asc' };
    } else if (sortBy === 'name' || sortBy === 'category') {
      orderBy.material = { [sortBy]: sortOrder || 'asc' };
    } else {
      orderBy[sortBy] = sortOrder || 'asc';
    }
  } else {
    orderBy.material = { name: 'asc' };
  }

  const [branchMaterials, total] = await Promise.all([
    prisma.branchMaterial.findMany({
      where,
      include: { material: true, branch: true },
      skip,
      take,
      orderBy
    }),
    prisma.branchMaterial.count({ where })
  ]);

  return formatPaginatedResponse(branchMaterials, total, params);
}

/**
 * Fetches global stats for branch materials (Super Admin only).
 */
export async function getGlobalBranchMaterialStats(filters = {}) {
  const { branchId, category, status, search } = filters;
  
  const where = {};
  if (branchId) where.branchId = branchId;
  
  const materialWhere = {};
  if (category) materialWhere.category = category;
  if (search) {
    materialWhere.OR = [
      { name: { contains: search } },
      { category: { contains: search } }
    ];
  }
  if (Object.keys(materialWhere).length > 0) {
    where.material = materialWhere;
  }

  const allMaterials = await prisma.branchMaterial.findMany({
    where,
    include: { material: true }
  });

  // Filter by status if provided (since we can't do it easily in Prisma for SQLite)
  const filteredMaterials = status ? allMaterials.filter(bm => {
    if (status === 'OUT_OF_STOCK') return bm.currentStock === 0;
    if (status === 'LOW_STOCK') return bm.currentStock > 0 && bm.currentStock <= bm.reorderThreshold;
    if (status === 'IN_STOCK') return bm.currentStock > bm.reorderThreshold;
    return true;
  }) : allMaterials;

  const totalMaterialTypes = new Set(filteredMaterials.map(bm => bm.materialId)).size;
  const totalMaterialStock = filteredMaterials.reduce((sum, bm) => sum + bm.currentStock, 0);
  const lowStockMaterials = filteredMaterials.filter(bm => bm.currentStock > 0 && bm.currentStock <= bm.reorderThreshold).length;
  const outOfStockMaterials = filteredMaterials.filter(bm => bm.currentStock === 0).length;
  const totalMaterialValue = filteredMaterials.reduce((sum, bm) => sum + (bm.currentStock * bm.avgCost), 0);
  
  const branchesWithAlerts = new Set(
    filteredMaterials
      .filter(bm => bm.currentStock <= bm.reorderThreshold)
      .map(bm => bm.branchId)
  ).size;

  return {
    totalMaterialTypes,
    totalMaterialStock,
    lowStockMaterials,
    outOfStockMaterials,
    totalMaterialValue,
    branchesWithAlerts
  };
}

/**
 * Fetches branch-wise breakdown for a specific material.
 */
export async function getBranchMaterialBreakdown(materialId) {
  return await prisma.branchMaterial.findMany({
    where: { materialId },
    include: { branch: true },
    orderBy: { branch: { name: 'asc' } }
  });
}

/**
 * Adds a material from the global catalog to a specific branch.
 */
export async function addMaterialToBranch(data) {
  return await prisma.branchMaterial.create({
    data: {
      ...data,
      currentStock: 0,
      avgCost: 0,
      isActive: true
    },
    include: { material: true }
  });
}

/**
 * Updates a branch-specific material setting (e.g., reorder threshold, active status).
 */
export async function updateBranchMaterial(id, data) {
  return await prisma.branchMaterial.update({
    where: { id },
    data,
    include: { material: true }
  });
}

/**
 * Deletes a material from a branch's inventory.
 */
export async function deleteBranchMaterial(id) {
  return await prisma.branchMaterial.delete({
    where: { id }
  });
}
