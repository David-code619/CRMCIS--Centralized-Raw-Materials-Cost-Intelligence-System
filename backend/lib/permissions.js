/**
 * Permissions & Role-Based Access Control (RBAC) Logic
 * 
 * Centralizes the definition of what each user role is allowed to do.
 * Used by both the frontend (to hide/show UI) and the backend (to secure API routes).
 */

/**
 * Permission Mapping
 * 
 * Defines which roles have access to specific features or actions.
 * - SUPER_ADMIN: Full access to everything across all branches.
 * - BRANCH_MANAGER: Full access to their specific branch's data and reports.
 * - INVENTORY_OFFICER: Limited to logging daily activities (purchases, usage).
 */
export const PERMISSIONS = {
  VIEW_DASHBOARD: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'INVENTORY_OFFICER'],
  VIEW_INVENTORY: ['SUPER_ADMIN', 'BRANCH_MANAGER'],
  LOG_PURCHASE: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'INVENTORY_OFFICER'],
  LOG_USAGE: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'INVENTORY_OFFICER'],
  MANAGE_TRANSFERS: ['SUPER_ADMIN', 'BRANCH_MANAGER'],
  VIEW_REPORTS: ['SUPER_ADMIN', 'BRANCH_MANAGER'],
  MANAGE_USERS: ['SUPER_ADMIN'],
  MANAGE_SETTINGS: ['SUPER_ADMIN', 'BRANCH_MANAGER', 'INVENTORY_OFFICER'],
};

/**
 * Checks if a user role has a specific permission.
 */
export function hasPermission(userRole, permission) {
  return PERMISSIONS[permission]?.includes(userRole) || false;
}

/**
 * Validates if a user is authorized to manage a specific branch.
 * Super Admins can manage any branch, while others are restricted to their assigned branch.
 */
export function canManageBranch(user, targetBranchId) {
  if (user.role === 'SUPER_ADMIN') return true;
  return user.branchId === targetBranchId;
}

export function isSuperAdmin(role) {
  return role === 'SUPER_ADMIN';
}

export function isBranchManager(role) {
  return role === 'BRANCH_MANAGER';
}
