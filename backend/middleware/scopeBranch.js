/**
 * Scope Branch Middleware
 * 
 * Enforces role-based branch security:
 * - SUPER_ADMIN: Can access any branchId requested via query/body, or view all branches if omitted.
 * - Non-SUPER_ADMIN: Strictly scoped to their assigned req.user.branchId.
 */
export const scopeBranch = (req, res, next) => {
  if (req.user?.role === "SUPER_ADMIN") {
    req.branchId = req.query.branchId || req.body?.branchId || null;
  } else {
    req.branchId = req.user?.branchId || null;
    // Also ensure body branchId cannot override for non-superadmin on write operations
    if (req.body && typeof req.body === "object") {
      req.body.branchId = req.user?.branchId;
    }
  }
  next();
};
