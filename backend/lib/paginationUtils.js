/**
 * Pagination Utilities
 * 
 * Helper functions to handle server-side pagination, filtering, and sorting.
 */

/**
 * Normalizes pagination parameters from query strings.
 */
export function getPaginationParams(query) {
  return {
    page: parseInt(query.page) || 1,
    limit: parseInt(query.limit) || 10,
    search: query.search || undefined,
    sortBy: query.sortBy || undefined,
    sortOrder: query.sortOrder || 'desc',
  };
}

/**
 * Calculates skip and take for Prisma queries.
 */
export function getPrismaPagination(params) {
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 10;
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

/**
 * Formats a paginated response.
 */
export function formatPaginatedResponse(
  data,
  total,
  params
) {
  const limit = parseInt(params.limit) || 10;
  const page = parseInt(params.page) || 1;
  return {
    data,
    pagination: {
      totalItems: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
