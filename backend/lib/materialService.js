import { prisma } from './prisma.js';
import { getPrismaPagination, formatPaginatedResponse } from './paginationUtils.js';

/**
 * Fetches all materials with optional filters, pagination, and search.
 */
export async function getMaterialCatalog(
  filters = {},
  params = {}
) {
  const { category } = filters;
  const { search, sortBy, sortOrder } = params;
  const { skip, take } = getPrismaPagination(params);

  const where = {};
  if (category) where.category = category;

  if (search) {
    where.OR = [
      { name: { contains: search } },
    ];
  }

  const orderBy = {};
  if (sortBy) {
    orderBy[sortBy] = sortOrder || 'asc';
  } else {
    orderBy.name = 'asc';
  }

  const [materials, total] = await Promise.all([
    prisma.materialCatalog.findMany({
      where,
      skip,
      take,
      orderBy
    }),
    prisma.materialCatalog.count({ where })
  ]);

  return formatPaginatedResponse(materials, total, params);
}

/**
 * Creates a new material in the global catalog.
 */
export async function createMaterial(data) {
  return await prisma.materialCatalog.create({
    data
  });
}

/**
 * Updates a material in the global catalog.
 */
export async function updateMaterial(id, data) {
  return await prisma.materialCatalog.update({
    where: { id },
    data
  });
}

/**
 * Deletes a material from the global catalog.
 */
export async function deleteMaterial(id) {
  return await prisma.materialCatalog.delete({
    where: { id }
  });
}
