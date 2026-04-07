/**
 * User Management Service
 * 
 * Handles all logic related to user accounts, including creation, updates,
 * and role assignments.
 */

import { prisma } from './prisma.js';
import bcrypt from 'bcryptjs';
import { getPrismaPagination, formatPaginatedResponse } from './paginationUtils.js';

/**
 * Fetches all users with optional filters, pagination, and search.
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
      include: {
        branch: {
          select: { name: true }
        }
      },
      skip,
      take,
      orderBy
    }),
    prisma.user.count({ where })
  ]);

  return formatPaginatedResponse(users, total, params);
}

/**
 * Creates a new user with a hashed password.
 * 
 * @param data - User details including email, name, role, and optional branch.
 * @returns The created user record.
 * 
 * Business Logic:
 * 1. Hashes the password using bcrypt (defaulting to 'admin123' for initial setup).
 * 2. Ensures SUPER_ADMINs are not tied to a specific branch.
 */
export async function createUser(data) {
  const { email, name, role, branchId, password } = data;
  
  // Hash password (default to 'admin123' if not provided for demo/initial setup)
  const hashedPassword = await bcrypt.hash(password || 'admin123', 10);

  return await prisma.user.create({
    data: {
      email,
      name,
      role,
      branchId: role === 'SUPER_ADMIN' ? null : branchId, // Super Admins don't need a branch
      password: hashedPassword,
      isActive: true
    },
    include: {
      branch: {
        select: { name: true }
      }
    }
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
    include: {
      branch: {
        select: { name: true }
      }
    }
  });
}

/**
 * Deletes a user (or deactivates).
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
    data: { isActive }
  });
}
