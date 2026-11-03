import { getBranchCount, createBranch } from "../lib/branchService.js";
import { withTimeout } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

// System initialization controller
export const initializeSystem = asyncHandler(async (req, res) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Only SUPER_ADMIN can initialize system data' });
  }

  const branchCount = await getBranchCount();
  if (branchCount > 0) {
    return res.status(400).json({ error: 'System already initialized' });
  }

  const branches = await Promise.all([
    createBranch({ name: 'Main HQ', location: 'Lagos' }),
    createBranch({ name: 'North Mall', location: 'Abuja' }),
    createBranch({ name: 'East Side', location: 'Enugu' }),
  ]);

  res.json({ message: 'System initialized with basic branches. Please run full seed for complete data.', branches });
});

export const healthCheck = asyncHandler(async (req, res) => {
  try {
    const branches = await withTimeout(getBranchCount(), 5000);
    res.json({ status: 'ok', database: 'connected', branches });
  } catch (error) {
    console.error("[HEALTH] Health check failed:", error.message);
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message === "Database operation timed out" ? "Database busy" : error.message,
    });
  }
});

// Simple ping endpoint
export const ping = (req, res) => {
  res.json({ status: 'ok', message: 'pong' });
};
