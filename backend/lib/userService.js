/**
 * User Management Service
 * 
 * Handles all logic related to user accounts, including creation, updates,
 * and role assignments.
 */

import { prisma } from './prisma.js';
import bcrypt from 'bcryptjs';
import { getPrismaPagination, formatPaginatedResponse } from './paginationUtils.js';

export const USER_SAFE_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  branchId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  branch: {
    select: { name: true }
  }
};

/**
 * Fetches all users with optional filters, pagination, and search.
 * Excludes password hashes from returned data for security.
 */
export async function getUsers(
  filters = {},
  params = {}
) {
  const { role, branchId, isActive } = filters;
  const { search, sortBy, sortOrder } = params;
  const { skip, take } = getPrismaPagination(params);
  
  const where = {};
  if (role) where.role = role;
  if (branchId) where.branchId = branchId;
  
  if (isActive !== undefined && isActive !== '') {
    where.isActive = isActive === 'true' || isActive === true;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const orderBy = {};
  if (sortBy) {
    orderBy[sortBy] = sortOrder || 'asc';
  } else {
    orderBy.createdAt = 'desc';
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: USER_SAFE_SELECT,
      skip,
      take,
      orderBy
    }),
    prisma.user.count({ where })
  ]);

  return formatPaginatedResponse(users, total, params);
}

/**
 * Fetches a single user by ID safely (without password).
 */
export async function getUserById(id) {
  return await prisma.user.findUnique({
    where: { id },
    select: USER_SAFE_SELECT
  });
}

/**
 * Creates a new user with a hashed password.
 * 
 * @param data - User details including email, name, role, and optional branch.
 * @returns The created user record without password.
 */
export async function createUser(data) {
  const { email, name, role, branchId, password } = data;
  
  if (!password) {
    throw new Error("Password is required");
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  return await prisma.user.create({
    data: {
      email,
      name,
      role,
      branchId: role === 'SUPER_ADMIN' ? null : branchId, // Super Admins don't need a branch
      password: hashedPassword,
      isActive: true
    },
    select: USER_SAFE_SELECT
  });
}

/**
 * Updates an existing user.
 */
export async function updateUser(id, data) {
  const { email, name, role, branchId, isActive } = data;

  return await prisma.user.update({
    where: { id },
    data: {
      email,
      name,
      role,
      branchId: role === 'SUPER_ADMIN' ? null : branchId,
      isActive
    },
    select: USER_SAFE_SELECT
  });
}

/**
 * Deletes a user.
 */
export async function deleteUser(id) {
  return await prisma.user.delete({
    where: { id }
  });
}

/**
 * Toggles user active status.
 */
export async function toggleUserStatus(id, isActive) {
  return await prisma.user.update({
    where: { id },
    data: { isActive },
    select: USER_SAFE_SELECT
  });
}
