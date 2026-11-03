import {
  getInventoryByBranch,
  getInventoryHistory,
  getInventoryStats,
} from "../lib/inventoryService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const getInventory = asyncHandler(async (req, res) => {
  const inventory = await getInventoryByBranch(req.branchId);
  res.json({
    data: inventory,
    pagination: { totalItems: inventory.length, totalPages: 1 },
  });
});

export const getStats = asyncHandler(async (req, res) => {
  const stats = await getInventoryStats(req.branchId);
  res.json(stats);
});

export const getHistory = asyncHandler(async (req, res) => {
  const history = await getInventoryHistory(req.branchId, req.query.materialId);
  res.json(history);
});
