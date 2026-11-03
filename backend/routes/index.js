import express from "express";
import authRoutes from "./authRoutes.js";
import inventoryRoutes from "./inventoryRoutes.js";
import materialRoutes from "./materialRoutes.js";
import branchMaterialRoutes from "./branchMaterialRoutes.js";
import usageRoutes from "./usageRoutes.js";
import purchaseRoutes from "./purchaseRoutes.js";
import adjustmentRoutes from "./adjustmentsRoutes.js";
import transferRoutes from "./transferRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import userRoutes from "./userRoutes.js";
import reportRoutes from "./reportRoutes.js";
import branchRoutes from "./branchRoutes.js";
import systemRoutes from "./systemRoutes.js";

const router = express.Router();

// Authentication & Users
router.use("/auth", authRoutes);
router.use("/users", userRoutes);

// Core Inventory & Catalogs
router.use("/inventory", inventoryRoutes);
router.use("/materials", materialRoutes);                 // Global material catalog CRUD
router.use("/branch-materials", branchMaterialRoutes);   // Branch material link & stock levels
router.use("/branches", branchRoutes);                    // Branches and branch-specific material associations

// Transactions & Stock Movements
router.use("/purchases", purchaseRoutes);
router.use("/usage", usageRoutes);
router.use("/adjustments", adjustmentRoutes);
router.use("/transfers", transferRoutes);

// Analytics, Reports & Dashboards
router.use("/reports", reportRoutes);
router.use("/stats", reportRoutes);                       // Compatibility alias for dashboard stats

// System & Notifications
router.use("/notifications", notificationRoutes);
router.use("/system", systemRoutes);

// Root System Aliases
router.get("/health", (req, res) => res.redirect("/api/system/health"));
router.get("/ping", (req, res) => res.redirect("/api/system/ping"));

export default router;
