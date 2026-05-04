import {
  getInventoryByBranch,
  getInventoryHistory,
  getInventoryStats,
} from "../lib/inventoryService.js";

export const getInventory = async (req, res) => {
  let { branchId } = req.query;

  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }

  try {
    const inventory = await getInventoryByBranch(branchId);
    res.json({
      data: inventory,
      pagination: { totalItems: inventory.length, totalPages: 1 },
    });
  } catch (error) {
    console.error("Inventory fetch error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch inventory", details: error.message });
  }
};

export const getStats = async (req, res) => {
  let { branchId } = req.query;

  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }

  try {
    const stats = await getInventoryStats(branchId);
    res.json(stats);
  } catch (error) {
    console.error("Failed to fetch inventory stats:", error);
    res.status(500).json({ error: "Failed to fetch inventory stats" });
  }
};

export const getHistory = async (req, res) => {
  let { branchId, materialId } = req.query;

  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }

  try {
    const history = await getInventoryHistory(branchId, materialId);
    res.json(history);
  } catch (error) {
    console.error("Failed to fetch inventory history:", error);
    res.status(500).json({ error: "Failed to fetch inventory history" });
  }
};
