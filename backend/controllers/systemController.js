import { prisma } from "../lib/prisma.js";
import { withTimeout } from "../middleware/auth.js";


// System initialization controller
export const initializeSystem = async (req, res) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Only SUPER_ADMIN can initialize system data' });
  }

  try {
    const branchCount = await prisma.branch.count();
    if (branchCount > 0) {
      return res.status(400).json({ error: 'System already initialized' });
    }

    const branches = await Promise.all([
      prisma.branch.create({ data: { name: 'Main HQ', location: 'Lagos' } }),
      prisma.branch.create({ data: { name: 'North Mall', location: 'Abuja' } }),
      prisma.branch.create({ data: { name: 'East Side', location: 'Enugu' } }),
    ]);

    res.json({ message: 'System initialized with basic branches. Please run full seed for complete data.', branches });
  } catch (error) {
    console.error('System initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize system' });
  }
};

export const healthCheck = async (req, res) => {
  console.log("[HEALTH] Received health check request");
  try {
    // Timeout to prevent hanging health checks
    console.log("[HEALTH] Querying database...");
    const branches = await withTimeout(prisma.branch.count(), 5000);
    console.log(
      "[HEALTH] Database connected successfully, branches:",
      branches,
    );
    res.json({ status: 'ok', database: 'connected', branches });
  } catch (error) {
    console.error("[HEALTH] Health check failed:", error.message);
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message === "Database operation timed out" ? "Database busy" : error.message,
    });
  }
};

// Simple ping endpoint
export const ping = (req, res) => {
  res.json({ status: 'ok', message: 'pong' });
};
