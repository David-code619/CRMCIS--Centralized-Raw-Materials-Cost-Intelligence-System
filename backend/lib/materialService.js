import { prisma } from './prisma.js';
import { getPrismaPagination, formatPaginatedResponse } from './paginationUtils.js';
import { buildPrismaWhere, buildPrismaOrderBy } from './queryBuilder.js';

/**
 * Fetches all materials with optional filters, pagination, and search.
 */
export async function getMaterialCatalog(
  filters = {},
  params = {}
) {
  const mergedFilters = { ...params, ...filters };
  const { skip, take } = getPrismaPagination(params);

  const where = buildPrismaWhere(mergedFilters, {
    allowedKeys: ['category'],
    searchFields: ['name', 'description']
  });

  const orderBy = buildPrismaOrderBy(params, { name: 'asc' });

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
