/**
 * Parse Query Middleware
 * 
 * Standardizes pagination, sorting, search, and date filters from req.query.
 * Normalizes query string values into typed numbers, booleans, and dates.
 */
export const parseQuery = (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    sortBy,
    sortOrder = "desc",
    search,
    startDate,
    endDate,
    branchId: _queryBranchId,
    ...customFilters
  } = req.query;

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);

  req.pagination = {
    page: parsedPage,
    limit: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit,
    take: parsedLimit,
    sortBy: sortBy || undefined,
    sortOrder: sortOrder && sortOrder.toLowerCase() === "asc" ? "asc" : "desc",
    search: search ? search.trim() : undefined,
  };

  const filters = {
    ...customFilters,
  };

  // Attach branchId if resolved by scopeBranch
  if (req.branchId) {
    filters.branchId = req.branchId;
  }

  // Attach trimmed search
  if (search && search.trim()) {
    filters.search = search.trim();
  }

  // Parse date ranges
  if (startDate) {
    const start = new Date(startDate);
    if (!isNaN(start.getTime())) {
      filters.startDate = start;
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    if (!isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      filters.endDate = end;
    }
  }

  req.filters = filters;
  next();
};
