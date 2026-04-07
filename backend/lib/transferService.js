/**
 * Inter-Branch Transfer Service
 * 
 * Manages the movement of materials between different branches.
 * Workflow: REQUESTED -> APPROVED/REJECTED -> COMPLETED.
 * Only COMPLETED transfers result in actual stock movements.
 */

import { prisma } from './prisma.js';
import { wouldResultInNegativeStock } from './inventoryUtils.js';
import { getPrismaPagination, formatPaginatedResponse } from './paginationUtils.js';
import { notifyRoles, createNotification } from './notificationService.js';

/**
 * Creates a new transfer request.
 * 
 * @param data - The transfer details (from, to, material, qty, etc.)
 * @returns The created transfer record.
 * 
 * Business Logic:
 * 1. Prevents self-transfers (source and destination must be different).
 * 2. Sets initial status to REQUESTED.
 * 3. Notifies Super Admins of the new request.
 */
export async function createTransferRequest(data) {
  const { transferDate, ...rest } = data;
  if (data.fromBranchId === data.toBranchId) {
    throw new Error('Source and destination branches cannot be the same');
  }

  const transfer = await prisma.transfer.create({
    data: {
      ...rest,
      transferDate: transferDate ? new Date(transferDate) : new Date(),
      status: 'REQUESTED'
    },
    include: {
      material: true,
      fromBranch: true,
      toBranch: true,
      loggedBy: { select: { name: true } }
    }
  });

  // Notify Super Admins
  await notifyRoles(
    ['SUPER_ADMIN'],
    'New Transfer Request',
    `${transfer.loggedBy.name} requested ${transfer.quantity} ${transfer.material.unit} of ${transfer.material.name} from ${transfer.fromBranch.name} to ${transfer.toBranch.name}.`,
    '/transfers'
  );

  return transfer;
}

/**
 * Processes a transfer request (Approve or Reject).
 * 
 * @param transferId - The ID of the transfer request.
 * @param approvedById - The ID of the Super Admin processing the request.
 * @param status - The new status (APPROVED or REJECTED).
 * @param notes - Optional notes for the decision.
 * 
 * Business Logic:
 * 1. Verifies the transfer exists and is in REQUESTED state.
 * 2. Records the approval/rejection in a separate TransferApproval table for auditing.
 * 3. Updates the main Transfer record's status.
 * 4. Notifies the requester of the decision.
 */
export async function processTransferApproval(transferId, approvedById, status, notes) {
  return await prisma.$transaction(async (tx) => {
    const transfer = await tx.transfer.findUnique({
      where: { id: transferId },
      include: { material: true, fromBranch: true, toBranch: true }
    });

    if (!transfer) throw new Error('Transfer not found');
    if (transfer.status !== 'REQUESTED') {
      throw new Error('Transfer is not in REQUESTED state');
    }

    // Record the approval/rejection
    await tx.transferApproval.create({
      data: {
        transferId,
        approvedById,
        status,
        notes
      }
    });

    // Update transfer status
    const updatedTransfer = await tx.transfer.update({
      where: { id: transferId },
      data: { status },
      include: {
        material: true,
        fromBranch: true,
        toBranch: true
      }
    });

    // Notify the requester
    await createNotification({
      userId: transfer.loggedById,
      title: `Transfer Request ${status}`,
      message: `Your request to transfer ${transfer.quantity} ${transfer.material.unit} of ${transfer.material.name} from ${transfer.fromBranch.name} to ${transfer.toBranch.name} has been ${status.toLowerCase()}.`,
      link: '/transfers'
    });

    return updatedTransfer;
  });
}

/**
 * Completes an APPROVED transfer and performs the actual stock movement.
 * 
 * @param transferId - The ID of the approved transfer.
 * @returns The updated transfer record.
 * 
 * Business Logic (Critical Transaction):
 * 1. Verifies the transfer is in APPROVED state.
 * 2. Validates that the source branch has enough stock to fulfill the transfer.
 * 3. Deducts the quantity from the source branch's inventory.
 * 4. Adds the quantity to the destination branch's inventory (upserting if necessary).
 * 5. Carries over the average cost from the source to the destination to maintain value accuracy.
 * 6. Marks the transfer as COMPLETED.
 * 7. Notifies both branch managers.
 */
export async function completeTransfer(transferId) {
  return await prisma.$transaction(async (tx) => {
    const transfer = await tx.transfer.findUnique({
      where: { id: transferId },
      include: { material: true, fromBranch: true, toBranch: true }
    });

    if (!transfer) throw new Error('Transfer not found');
    if (transfer.status !== 'APPROVED') {
      throw new Error('Only APPROVED transfers can be completed');
    }

    // 1. Validate source stock availability
    const sourceStock = await tx.branchMaterial.findUnique({
      where: {
        branchId_materialId: {
          branchId: transfer.fromBranchId,
          materialId: transfer.materialId
        }
      }
    });

    if (!sourceStock || wouldResultInNegativeStock(sourceStock.currentStock, transfer.quantity)) {
      throw new Error(`Insufficient stock in source branch. Available: ${sourceStock?.currentStock || 0}`);
    }

    // 2. Deduct from source branch
    await tx.branchMaterial.update({
      where: { id: sourceStock.id },
      data: {
        currentStock: { decrement: transfer.quantity }
      }
    });

    // 3. Add to receiving branch
    // Ensure the material is active in the receiving branch
    await tx.branchMaterial.upsert({
      where: {
        branchId_materialId: {
          branchId: transfer.toBranchId,
          materialId: transfer.materialId
        }
      },
      update: {
        currentStock: { increment: transfer.quantity }
      },
      create: {
        branchId: transfer.toBranchId,
        materialId: transfer.materialId,
        currentStock: transfer.quantity,
        isActive: true,
        avgCost: sourceStock.avgCost // Carry over the average cost from source
      }
    });

    // 4. Mark transfer completed
    const completedTransfer = await tx.transfer.update({
      where: { id: transferId },
      data: { status: 'COMPLETED' },
      include: {
        material: true,
        fromBranch: true,
        toBranch: true
      }
    });

    // 5. Notify branch managers
    const message = `${transfer.quantity} ${transfer.material.unit} of ${transfer.material.name} transferred from ${transfer.fromBranch.name} to ${transfer.toBranch.name}.`;
    
    await notifyRoles(
      ['BRANCH_MANAGER', 'INVENTORY_OFFICER'],
      'Transfer Completed',
      message,
      '/transfers',
      transfer.fromBranchId
    );

    await notifyRoles(
      ['BRANCH_MANAGER', 'INVENTORY_OFFICER'],
      'Transfer Completed',
      message,
      '/transfers',
      transfer.toBranchId
    );

    return completedTransfer;
  });
}

/**
 * Fetches transfer history with optional filters, pagination, and search.
 * 
 * @param filters - Filter by branch, status, or source/destination.
 * @param params - Pagination, search, and sorting parameters.
 * @returns A paginated response of transfer records with related material, branch, and user data.
 */
export async function getTransferHistory(
  filters,
  params = {}
) {
  const { branchId, status, isSource } = filters;
  const { search, sortBy, sortOrder } = params;
  const { skip, take } = getPrismaPagination(params);

  const where = {};
  if (status) where.status = status;
  
  if (branchId) {
    if (isSource === true) {
      where.fromBranchId = branchId;
    } else if (isSource === false) {
      where.toBranchId = branchId;
    } else {
      where.OR = [
        { fromBranchId: branchId },
        { toBranchId: branchId }
      ];
    }
  }

  if (search) {
    const searchCondition = {
      OR: [
        { notes: { contains: search } },
        { material: { name: { contains: search } } },
        { fromBranch: { name: { contains: search } } },
        { toBranch: { name: { contains: search } } },
      ]
    };

    if (where.OR) {
      // If we already have an OR for branchId, we need to wrap it in an AND
      const existingOR = where.OR;
      delete where.OR;
      where.AND = [
        { OR: existingOR },
        searchCondition
      ];
    } else {
      where.OR = searchCondition.OR;
    }
  }

  const orderBy = {};
  if (sortBy) {
    if (sortBy.includes('.')) {
      const [relation, field] = sortBy.split('.');
      orderBy[relation] = { [field]: sortOrder || 'asc' };
    } else {
      orderBy[sortBy] = sortOrder || 'asc';
    }
  } else {
    orderBy.createdAt = 'desc';
  }

  const [transfers, total] = await Promise.all([
    prisma.transfer.findMany({
      where,
      include: {
        material: true,
        fromBranch: true,
        toBranch: true,
        loggedBy: { select: { name: true } },
        approvals: {
          include: { approvedBy: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      },
      skip,
      take,
      orderBy
    }),
    prisma.transfer.count({ where })
  ]);

  return formatPaginatedResponse(transfers, total, params);
}