/**
 * Query Builder Helper for Prisma
 * 
 * Standardizes where clauses, order-by generation, and date ranges across all services.
 */

export function buildPrismaWhere(filters = {}, config = {}) {
  const {
    allowedKeys = [],
    booleanKeys = [],
    dateField = "createdAt",
    searchFields = [],
  } = config;

  const where = {};

  // 1. Direct equality keys
  for (const key of allowedKeys) {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== "") {
      where[key] = filters[key];
    }
  }

  // 2. Boolean keys (normalizing strings 'true'/'false' to boolean)
  for (const key of booleanKeys) {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== "") {
      if (typeof filters[key] === "boolean") {
        where[key] = filters[key];
      } else if (filters[key] === "true") {
        where[key] = true;
      } else if (filters[key] === "false") {
        where[key] = false;
      }
    }
  }

  // 3. Date range
  if (filters.startDate || filters.endDate) {
    where[dateField] = {};
    if (filters.startDate) where[dateField].gte = filters.startDate;
    if (filters.endDate) where[dateField].lte = filters.endDate;
  }

  // 4. Search OR conditions
  if (filters.search && searchFields.length > 0) {
    where.OR = searchFields.map((field) => {
      if (field.includes(".")) {
        const [relation, attr] = field.split(".");
        return {
          [relation]: {
            [attr]: { contains: filters.search, mode: "insensitive" },
          },
        };
      }
      return {
        [field]: { contains: filters.search, mode: "insensitive" },
      };
    });
  }

  return where;
}

export function buildPrismaOrderBy(pagination = {}, defaultOrder = { createdAt: "desc" }) {
  const { sortBy, sortOrder = "desc" } = pagination;
  if (!sortBy) return defaultOrder;

  if (sortBy.includes(".")) {
    const [relation, field] = sortBy.split(".");
    return { [relation]: { [field]: sortOrder } };
  }

  return { [sortBy]: sortOrder };
}

/**
 * Ensures a date range exists for reports.
 * If startDate is missing, defaults to `defaultDays` in the past.
 */
export function withDefaultDateRange(filters = {}, defaultDays = 90) {
  const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
  let startDate = filters.startDate ? new Date(filters.startDate) : null;

  if (!startDate) {
    startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - defaultDays);
  }

  return {
    ...filters,
    startDate,
    endDate,
  };
}
