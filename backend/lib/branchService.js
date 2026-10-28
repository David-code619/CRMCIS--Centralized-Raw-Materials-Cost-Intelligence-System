/**
 * Branch Service
 * 
 * Encapsulates all data access and business logic related to branches.
 */

import { prisma } from "./prisma.js";

/**
 * Fetches all branches ordered by name.
 */
export async function getAllBranches() {
  return await prisma.branch.findMany({
    orderBy: { name: "asc" },
  });
}

/**
 * Fetches a single branch by ID.
 */
export async function getBranchById(id) {
  return await prisma.branch.findUnique({
    where: { id },
  });
}

/**
 * Creates a new branch.
 */
export async function createBranch({ name, location }) {
  const trimmedName = typeof name === "string" ? name.trim() : "";
  if (!trimmedName) {
    throw new Error("Branch name is required");
  }

  return await prisma.branch.create({
    data: {
      name: trimmedName,
      location: location || null,
    },
  });
}

/**
 * Returns total number of branches in the system.
 */
export async function getBranchCount() {
  return await prisma.branch.count();
}
