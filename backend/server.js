import "dotenv/config";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import cors from 'cors';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma.js";
import {
  getInventoryByBranch,
  getInventoryHistory,
  getInventoryStats,
} from "./lib/inventoryService.js";
import {
  getMaterialCatalog,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from "./lib/materialService.js";
import {
  getBranchMaterials,
  addMaterialToBranch,
  updateBranchMaterial,
  deleteBranchMaterial,
  getGlobalBranchMaterialStats,
  getBranchMaterialBreakdown,
} from "./lib/branchMaterialService.js";
import {
  getUsageHistory as getUsageLogs,
  logUsage as createUsageLog,
  auditAllUsageLogs
} from "./lib/usageService.js";
import {
  getPurchaseHistory as getPurchaseLogs,
  logPurchase as createPurchaseLog,
} from "./lib/purchaseService.js";
import {
  getAdjustmentHistory as getAdjustments,
  recordAdjustment as createAdjustment,
  approveAdjustment as updateAdjustment,
  rejectAdjustment as deleteAdjustment,
} from "./lib/adjustmentService.js";
import {
  getTransferHistory as getTransfers,
  createTransferRequest as createTransfer,
  processTransferApproval as updateTransfer,
  completeTransfer as deleteTransfer,
} from "./lib/transferService.js";
import {
  getReportKPIs,
  getBranchComparison,
  getReportCostTrends,
  getDashboardStats,
  getTopConsumedMaterials,
  getInventoryValueTrend,
} from "./lib/reportService.js";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
} from "./lib/userService.js";
import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} from "./lib/notificationService.js";

const JWT_SECRET = process.env.JWT_SECRET || "crmcis-secret-key-2024";
const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
  }));
app.use(express.json());
app.use(cookieParser());

// --- PRISMA TIMEOUT HELPER ---
const withTimeout = (promise, timeoutMs = 10000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Database operation timed out")),
        timeoutMs,
      ),
    ),
  ]);
};

// --- AUTHENTICATION MIDDLEWARE ---
const authenticate = async (req, res, next) => {
  console.log(`[AUTH] Authenticating request to ${req.path}`);
  const token = req.cookies.token;
  if (!token) {
    console.log(`[AUTH] No token found for ${req.path}`);
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(`[AUTH] Token verified for user ${decoded.id}, checking DB...`);

    // Verify user still exists in the database with timeout
    const user = await withTimeout(
      prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, role: true, branchId: true, email: true },
      }),
      5000,
    );

    if (!user) {
      console.log(`[AUTH] User ${decoded.id} not found in DB, clearing cookie`);
      res.clearCookie("token");
      return res
        .status(401)
        .json({ error: "User no longer exists. Please log in again." });
    }

    console.log(`[AUTH] User ${user.email} authenticated successfully`);
    req.user = user;
    next();
  } catch (error) {
    console.error(
      `[AUTH] Authentication error for ${req.path}:`,
      error.message,
    );
    res.clearCookie("token");
    res
      .status(401)
      .json({
        error:
          error.message === "Database operation timed out"
            ? "Database busy"
            : "Invalid token",
      });
  }
};

const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};

// --- AUTH ROUTES ---
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Normalize email for case-insensitive lookup
    const normalizedEmail = email?.toLowerCase().trim();
    console.log(`Login attempt for: ${normalizedEmail}`);

    if (!normalizedEmail || !password) {
      console.log(`Login failed: Missing email or password`);
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { branch: true },
    });

    if (!user) {
      console.log(`Login failed: User not found for ${normalizedEmail}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log(`Login failed: Invalid password for ${normalizedEmail}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
      console.log(`Login failed: Account deactivated for ${normalizedEmail}`);
      return res
        .status(403)
        .json({
          error: "Account is deactivated. Please contact your administrator.",
        });
    }

    console.log(`Login successful for: ${normalizedEmail}, role: ${user.role}`);
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.cookie("token", token, {
      httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Login error details:", {
      message: error.message,
      stack: error.stack,
      email: email,
    });
    res.status(500).json({ error: "Login failed. Please check server logs." });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

app.get("/api/auth/me", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { branch: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Failed to fetch user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// --- DASHBOARD STATS ---
app.get("/api/stats", authenticate, async (req, res) => {
  let branchId = null;
  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }

  try {
    const stats = await getDashboardStats(branchId, req.user);
    res.json(stats);
  } catch (error) {
    console.error("Dashboard stats fetch error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

// --- INVENTORY ROUTES ---
app.get("/api/inventory", authenticate, async (req, res) => {
  let { branchId } = req.query;

  // If not super admin, restrict to user's branch
  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }

  console.log(`[API] Fetching inventory for branch: ${branchId || "ALL"}`);

  try {
    const inventory = await getInventoryByBranch(branchId);
    console.log(
      `[API] Found ${inventory.length} items for branch: ${branchId || "ALL"}`,
    );
    res.json({
      data: inventory,
      pagination: { totalItems: inventory.length, totalPages: 1 },
    });
  } catch (error) {
    console.error("[API] Inventory fetch error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch inventory", details: error.message });
  }
});

app.get("/api/inventory/stats", authenticate, async (req, res) => {
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
});

app.get("/api/inventory/history", authenticate, async (req, res) => {
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
});

// --- MATERIAL CATALOG ROUTES ---
app.get("/api/materials", authenticate, async (req, res) => {
  try {
    const materials = await getMaterialCatalog(req.query, req.query);
    res.json(materials);
  } catch (error) {
    console.error("Failed to fetch materials:", error);
    res.status(500).json({ error: "Failed to fetch materials" });
  }
});

app.post(
  "/api/materials",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  async (req, res) => {
    try {
      const material = await createMaterial(req.body);
      res.status(201).json(material);
    } catch (error) {
      console.error("Failed to create material:", error);
      res.status(500).json({ error: "Failed to create material" });
    }
  },
);

app.patch(
  "/api/materials/:id",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  async (req, res) => {
    try {
      const material = await updateMaterial(req.params.id, req.body);
      res.json(material);
    } catch (error) {
      console.error("Failed to update material:", error);
      res.status(500).json({ error: "Failed to update material" });
    }
  },
);

app.delete(
  "/api/materials/:id",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  async (req, res) => {
    try {
      await deleteMaterial(req.params.id);
      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete material:", error);
      res.status(500).json({ error: "Failed to delete material" });
    }
  },
);

// --- BRANCH MATERIAL ROUTES ---
app.get(
  "/api/branch-materials/stats",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  async (req, res) => {
    try {
      const stats = await getGlobalBranchMaterialStats(req.query);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching global branch material stats:", error);
      res.status(500).json({ error: "Failed to fetch branch material stats" });
    }
  },
);

app.get(
  "/api/branch-materials/:materialId/breakdown",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  async (req, res) => {
    try {
      const breakdown = await getBranchMaterialBreakdown(req.params.materialId);
      res.json(breakdown);
    } catch (error) {
      console.error("Error fetching branch material breakdown:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch branch material breakdown" });
    }
  },
);

app.get("/api/branch-materials", authenticate, async (req, res) => {
  let { branchId } = req.query;

  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }

  try {
    const materials = await getBranchMaterials(branchId, req.query, req.query);
    res.json(materials);
  } catch (error) {
    console.error("Failed to fetch branch materials:", error);
    res.status(500).json({ error: "Failed to fetch branch materials" });
  }
});

app.get("/api/branches/:id/materials", authenticate, async (req, res) => {
  let branchId = req.params.id;

  if (req.user.role !== "SUPER_ADMIN" && req.user.branchId !== branchId) {
    return res
      .status(403)
      .json({
        error: "Forbidden: You can only access your own branch's materials",
      });
  }

  try {
    const materials = await getBranchMaterials(branchId, req.query, req.query);
    res.json(materials);
  } catch (error) {
    console.error("Error fetching branch materials:", error);
    res.status(500).json({ error: "Failed to fetch branch materials" });
  }
});

app.post("/api/branch-materials", authenticate, async (req, res) => {
  const data = { ...req.body };
  if (req.user.role !== "SUPER_ADMIN") {
    data.branchId = req.user.branchId;
  }

  try {
    const material = await addMaterialToBranch(data);
    res.status(201).json(material);
  } catch (error) {
    console.error("Failed to add material to branch:", error);
    res.status(500).json({ error: "Failed to add material to branch" });
  }
});

app.patch("/api/branch-materials/:id", authenticate, async (req, res) => {
  try {
    const material = await updateBranchMaterial(req.params.id, req.body);
    res.json(material);
  } catch (error) {
    console.error("Failed to update branch material:", error);
    res.status(500).json({ error: "Failed to update branch material" });
  }
});

app.delete("/api/branch-materials/:id", authenticate, async (req, res) => {
  try {
    await deleteBranchMaterial(req.params.id);
    res.status(204).end();
  } catch (error) {
    console.error("Failed to delete branch material:", error);
    res.status(500).json({ error: "Failed to delete branch material" });
  }
});

app.post(
  "/api/branches/:id/materials/activate",
  authenticate,
  async (req, res) => {
    const branchId = req.params.id;

    if (req.user.role !== "SUPER_ADMIN" && req.user.branchId !== branchId) {
      return res
        .status(403)
        .json({
          error:
            "Forbidden: You can only activate materials for your own branch",
        });
    }

    const data = { ...req.body, branchId };

    try {
      const material = await addMaterialToBranch(data);
      res.status(201).json(material);
    } catch (error) {
      console.error("Error activating material for branch:", error);
      res.status(500).json({ error: "Failed to activate material for branch" });
    }
  },
);

// --- USAGE ROUTES ---
app.get("/api/usage", authenticate, async (req, res) => {
  let { branchId } = req.query;

  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }

  try {
    const logs = await getUsageLogs({ branchId }, req.query);
    res.json(logs);
  } catch (error) {
    console.error("Failed to fetch usage logs:", error);
    res.status(500).json({ error: "Failed to fetch usage logs" });
  }
});

app.post("/api/usage", authenticate, async (req, res) => {
  const data = { ...req.body, loggedById: req.user.id };
  if (req.user.role !== "SUPER_ADMIN") {
    data.branchId = req.user.branchId;
  }

  try {
    const log = await createUsageLog(data);
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to record usage" });
  }
});


  app.post("/api/usage/audit-all", authenticate, authorize(["SUPER_ADMIN", "BRANCH_MANAGER"]), async (req, res) => {
    let branchId = null;
    if (req.user.role !== "SUPER_ADMIN") {
      branchId = req.user.branchId;
    }

    try {
      const result = await auditAllUsageLogs(branchId);
      res.json(result);
    } catch (error) {
      console.error("Failed to audit usage logs:", error);
      res.status(500).json({ error: "Failed to audit usage logs" });
    }
  });

// updateUsageLog and deleteUsageLog are not implemented in usageService.js
// Removing these routes to prevent errors.

// --- PURCHASE ROUTES ---
app.get("/api/purchases", authenticate, async (req, res) => {
  let { branchId } = req.query;

  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }

  try {
    const logs = await getPurchaseLogs({ branchId }, req.query);
    res.json(logs);
  } catch (error) {
    console.error("Failed to fetch purchase logs:", error);
    res.status(500).json({ error: "Failed to fetch purchase logs" });
  }
});

app.post("/api/purchases", authenticate, async (req, res) => {
  try {
    const data = { ...req.body, loggedById: req.user.id };

    // Ensure branchId is set correctly
    if (req.user.role !== "SUPER_ADMIN") {
      data.branchId = req.user.branchId;
    } else if (!data.branchId) {
      // If SUPER_ADMIN didn't provide a branchId, default to their own if they have one
      data.branchId = req.user.branchId;
    }

    if (!data.branchId) {
      return res
        .status(400)
        .json({ error: "Branch ID is required to log a purchase" });
    }

    const log = await createPurchaseLog(data);
    res.status(201).json(log);
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Failed to record purchase" });
  }
});

// updatePurchaseLog and deletePurchaseLog are not implemented in purchaseService.js
// Removing these routes to prevent errors.

// --- ADJUSTMENT ROUTES ---
app.get("/api/adjustments", authenticate, async (req, res) => {
  let { branchId } = req.query;

  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }

  try {
    const adjustments = await getAdjustments({ branchId }, req.query);
    res.json(adjustments);
  } catch (error) {
    console.error("Failed to fetch adjustments:", error);
    res.status(500).json({ error: "Failed to fetch adjustments" });
  }
});

app.post("/api/adjustments", authenticate, async (req, res) => {
  const data = { ...req.body, loggedById: req.user.id };
  if (req.user.role !== "SUPER_ADMIN") {
    data.branchId = req.user.branchId;
  }

  try {
    const adjustment = await createAdjustment(data);
    res.status(201).json(adjustment);
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Failed to record adjustment" });
  }
});

app.patch(
  "/api/adjustments/:id/approve",
  authenticate,
  authorize(["SUPER_ADMIN", "BRANCH_MANAGER"]),
  async (req, res) => {
    try {
      const adjustment = await updateAdjustment(req.params.id, req.user.id);
      res.json(adjustment);
    } catch (error) {
      res
        .status(500)
        .json({ error: error.message || "Failed to approve adjustment" });
    }
  },
);

app.patch(
  "/api/adjustments/:id/reject",
  authenticate,
  authorize(["SUPER_ADMIN", "BRANCH_MANAGER"]),
  async (req, res) => {
    try {
      const adjustment = await deleteAdjustment(req.params.id, req.user.id);
      res.json(adjustment);
    } catch (error) {
      res
        .status(500)
        .json({ error: error.message || "Failed to reject adjustment" });
    }
  },
);

// --- TRANSFER ROUTES ---
app.get("/api/transfers", authenticate, async (req, res) => {
  let { branchId } = req.query;

  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }

  try {
    const transfers = await getTransfers({ branchId }, req.query);
    res.json(transfers);
  } catch (error) {
    console.error("Failed to fetch transfers:", error);
    res.status(500).json({ error: "Failed to fetch transfers" });
  }
});

app.post("/api/transfers", authenticate, async (req, res) => {
  const data = { ...req.body, loggedById: req.user.id };
  if (req.user.role !== "SUPER_ADMIN") {
    data.fromBranchId = req.user.branchId;
  }

  try {
    const transfer = await createTransfer(data);
    res.status(201).json(transfer);
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Failed to record transfer" });
  }
});

app.patch(
  "/api/transfers/:id/approve",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  async (req, res) => {
    try {
      const transfer = await updateTransfer(
        req.params.id,
        req.user.id,
        "APPROVED",
        req.body.notes,
      );
      res.json(transfer);
    } catch (error) {
      res
        .status(500)
        .json({ error: error.message || "Failed to approve transfer" });
    }
  },
);

app.patch(
  "/api/transfers/:id/complete",
  authenticate,
  authorize(["SUPER_ADMIN", "BRANCH_MANAGER"]),
  async (req, res) => {
    try {
      const transfer = await deleteTransfer(req.params.id);
      res.json(transfer);
    } catch (error) {
      console.error("Failed to complete transfer:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to complete transfer" });
    }
  },
);

// --- NOTIFICATION ROUTES ---
  app.get("/api/notifications", authenticate, async (req, res) => {
    try {
      const { limit, unreadOnly } = req.query;
      const notifications = await getNotifications(req.user.id, { 
        limit: limit ? parseInt(limit) : 10, 
        unreadOnly: unreadOnly === 'true' 
      });
      res.json(notifications);
    } catch (err) {
      console.error("Fetch notifications error:", err);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", authenticate, async (req, res) => {
    try {
      const count = await getUnreadCount(req.user.id);
      res.json({ count });
    } catch (err) {
      console.error("Fetch unread count error:", err);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  app.patch("/api/notifications/:id/read", authenticate, async (req, res) => {
    try {
      const notification = await markAsRead(req.params.id);
      res.json(notification);
    } catch (err) {
      console.error("Mark notification as read error:", err);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/read-all", authenticate, async (req, res) => {
    try {
      await markAllAsRead(req.user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (err) {
      console.error("Mark all as read error:", err);
      res.status(500).json({ error: "Failed to mark all as read" });
    }
  });

  app.delete("/api/notifications/:id", authenticate, async (req, res) => {
    try {
      await deleteNotification(req.params.id);
      res.status(204).end();
    } catch (err) {
      console.error("Delete notification error:", err);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

// --- USER MANAGEMENT ROUTES ---
app.get(
  "/api/users",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  async (req, res) => {
    try {
      const users = await getUsers(req.query, req.query);
      res.json(users);
    } catch (err) {
      console.error("Fetch users error:", err);
      res.status(500).json({ error: err.message || "Failed to fetch users" });
    }
  },
);

app.post(
  "/api/users",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  async (req, res) => {
    try {
      const user = await createUser(req.body);
      res.status(201).json(user);
    } catch (err) {
      console.error("Create user error:", err);
      res.status(500).json({ error: "Failed to create user" });
    }
  },
);

app.patch(
  "/api/users/:id",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  async (req, res) => {
    try {
      const user = await updateUser(req.params.id, req.body);
      res.json(user);
    } catch (err) {
      console.error("Update user error:", err);
      res.status(500).json({ error: "Failed to update user" });
    }
  },
);

app.patch(
  "/api/users/:id/toggle-status",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  async (req, res) => {
    try {
      const { isActive } = req.body;
      const user = await toggleUserStatus(req.params.id, isActive);
      res.json(user);
    } catch (err) {
      console.error("Toggle user status error:", err);
      res.status(500).json({ error: "Failed to toggle user status" });
    }
  },
);

app.delete(
  "/api/users/:id",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  async (req, res) => {
    try {
      // Prevent deleting self
      if (req.params.id === req.user.id) {
        return res
          .status(400)
          .json({ error: "You cannot delete your own account" });
      }
      await deleteUser(req.params.id);
      res.status(204).end();
    } catch (error) {
      console.error("Delete user error:", error);
      if (error.code === "P2003") {
        res
          .status(400)
          .json({
            error:
              "Cannot delete user with existing activity records. Consider deactivating instead.",
          });
      } else {
        res.status(500).json({ error: "Failed to delete user" });
      }
    }
  },
);

// --- BRANCH ROUTES ---
app.get("/api/branches", authenticate, async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { name: "asc" },
    });
    res.json(branches);
  } catch (error) {
    console.error("Failed to fetch branches:", error);
    res.status(500).json({ error: "Failed to fetch branches" });
  }
});

// --- REPORT ROUTES ---
app.get("/api/reports/kpis", authenticate, async (req, res) => {
  let { branchId, materialId, category, startDate, endDate } = req.query;

  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }

  try {
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    // Ensure end date covers the full day
    if (endDate) {
      end.setHours(23, 59, 59, 999);
    }

    const kpis = await getReportKPIs({
      branchId,
      materialId,
      category,
      startDate: start,
      endDate: end,
    });
    res.json(kpis);
  } catch (error) {
    console.error("KPIs fetch error:", error);
    res.status(500).json({ error: "Failed to fetch KPIs" });
  }
});

app.get("/api/reports/value-trend", authenticate, async (req, res) => {
  let { branchId, materialId, category, startDate, endDate } = req.query;

  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }

  try {
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    if (endDate) {
      end.setHours(23, 59, 59, 999);
    }

    const trend = await getInventoryValueTrend({
      branchId,
      materialId,
      category,
      startDate: start,
      endDate: end,
    });
    res.json(trend);
  } catch (error) {
    console.error("Value trend fetch error:", error);
    res.status(500).json({ error: "Failed to fetch value trend" });
  }
});

app.get("/api/reports/top-consumed", authenticate, async (req, res) => {
  let { branchId, materialId, category, startDate, endDate } = req.query;

  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }

  try {
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    if (endDate) {
      end.setHours(23, 59, 59, 999);
    }

    const topConsumed = await getTopConsumedMaterials({
      branchId,
      materialId,
      category,
      startDate: start,
      endDate: end,
    });
    res.json(topConsumed);
  } catch (error) {
    console.error("Top consumed fetch error:", error);
    res.status(500).json({ error: "Failed to fetch top consumed materials" });
  }
});

app.get(
  "/api/reports/branch-comparison",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  async (req, res) => {
    let { startDate, endDate } = req.query;
    try {
      const start = startDate
        ? new Date(startDate)
        : new Date(new Date().setDate(new Date().getDate() - 30));
      const end = endDate ? new Date(endDate) : new Date();

      if (endDate) {
        end.setHours(23, 59, 59, 999);
      }

      const comparison = await getBranchComparison({
        startDate: start,
        endDate: end,
      });
      res.json(comparison);
    } catch (error) {
      console.error("Branch comparison fetch error:", error);
      res.status(500).json({ error: "Failed to fetch branch comparison" });
    }
  },
);

app.get("/api/reports/cost-trends", authenticate, async (req, res) => {
  let { branchId, materialId, startDate, endDate } = req.query;

  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }

  try {
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setMonth(new Date().getMonth() - 6));
    const end = endDate ? new Date(endDate) : new Date();

    if (endDate) {
      end.setHours(23, 59, 59, 999);
    }

    const trends = await getReportCostTrends({
      branchId: branchId,
      materialId: materialId,
      startDate: start,
      endDate: end,
    });
    res.json(trends);
  } catch (error) {
    console.error("Failed to fetch cost trends:", error);
    res.status(500).json({ error: "Failed to fetch cost trends" });
  }
});

app.get("/api/reports/shrinkage", authenticate, async (req, res) => {
  let { branchId, startDate, endDate } = req.query;

  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }

  try {
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    if (endDate) {
      end.setHours(23, 59, 59, 999);
    }

    if (!branchId && req.user.role !== "SUPER_ADMIN") {
      return res.status(400).json({ error: "Branch ID is required" });
    }

    const kpis = await getReportKPIs({
      branchId,
      startDate: start,
      endDate: end,
    });

    // Calculate total movement (purchases) for the period
    const purchases = await prisma.purchase.aggregate({
      where: {
        ...(branchId ? { branchId } : {}),
        purchaseDate: { gte: start, lte: end },
      },
      _sum: { quantity: true },
    });

    res.json({
      shrinkageRate: kpis.shrinkageRate,
      totalAdjustedQty: kpis.totalShrinkageQty,
      adjustmentCount: await prisma.stockAdjustment.count({
        where: {
          ...(branchId ? { branchId } : {}),
          status: "APPROVED",
          reason: { in: ["WASTE", "LOSS"] },
          adjustmentDate: { gte: start, lte: end },
        },
      }),
      totalMovement: purchases._sum.quantity || 0,
    });
  } catch (error) {
    console.error("Shrinkage report error:", error);
    res.status(500).json({ error: "Failed to fetch shrinkage metrics" });
  }
});

// System initialization endpoint
app.post("/api/system/initialize", authenticate, async (req, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res
      .status(403)
      .json({ error: "Only SUPER_ADMIN can initialize system data" });
  }

  try {
    // Check if data already exists
    const branchCount = await prisma.branch.count();
    if (branchCount > 0) {
      return res.status(400).json({ error: "System already initialized" });
    }

    // Basic bootstrap
    const branches = await Promise.all([
      prisma.branch.create({ data: { name: "Main HQ", location: "Lagos" } }),
      prisma.branch.create({ data: { name: "North Mall", location: "Abuja" } }),
      prisma.branch.create({ data: { name: "East Side", location: "Enugu" } }),
    ]);

    res.json({
      message:
        "System initialized with basic branches. Please run full seed for complete data.",
      branches,
    });
  } catch (error) {
    console.error("System initialization error:", error);
    res.status(500).json({ error: "Failed to initialize system" });
  }
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  console.log("[HEALTH] Received health check request");
  try {
    // Use timeout to prevent hanging health checks
    console.log("[HEALTH] Querying database...");
    const branches = await withTimeout(prisma.branch.count(), 15000);
    console.log(
      "[HEALTH] Database connected successfully, branches:",
      branches,
    );
    res.json({ status: "ok", database: "connected", branches });
  } catch (error) {
    console.error("[HEALTH] Health check failed:", error.message);
    res.status(500).json({
      status: "error",
      database: "disconnected",
      error:
        error.message === "Database operation timed out"
          ? "Database busy"
          : error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Simple ping endpoint
app.get("/api/ping", (req, res) => {
  res.json({ status: "ok", message: "pong" });
});


// Global error handler
app.use((err, req, res, next) => {
  console.error(`[Unhandled Error] ${req.method} ${req.path}:`, err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err instanceof Error ? err.message : String(err),
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
