import express from "express";
import { listAdjustments, recordAdjustment, approveAdjustment, rejectAdjustment } from "../controllers/adjustmentController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", listAdjustments);
router.post("/", recordAdjustment);
router.patch("/:id/approve", authorize(["SUPER_ADMIN", "BRANCH_MANAGER"]), approveAdjustment);
router.patch("/:id/reject", authorize(["SUPER_ADMIN", "BRANCH_MANAGER"]), rejectAdjustment);

export default router;