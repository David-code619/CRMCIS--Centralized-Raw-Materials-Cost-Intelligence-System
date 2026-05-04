import express from "express";
import authRoutes from "./authRoutes.js";
import inventoryRoutes from "./inventoryRoutes.js";
import materialRoutes from "./materialRoutes.js";
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

router.use("/auth", authRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/materials", materialRoutes);
router.use("/branch-materials", branchRoutes);
router.use("/usage", usageRoutes);
router.use("/purchases", purchaseRoutes);
router.use("/adjustments", adjustmentRoutes);
router.use("/transfers", transferRoutes);
router.use("/notifications", notificationRoutes);
router.use("/users", userRoutes);
router.use("/reports", reportRoutes);
router.use("/branches", branchRoutes);
router.use("/system", systemRoutes);
router.use("/stats", reportRoutes); // Dashboard stats

router.get("/health", (req, res) => res.redirect("/api/system/health"));
router.get("/ping", (req, res) => res.redirect("/api/system/ping"));

export default router;
