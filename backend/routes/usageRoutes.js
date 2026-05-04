import express from "express";
import { listUsageLogs, recordUsage, auditLogs } from "../controllers/usageController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", listUsageLogs);
router.post("/", recordUsage);
router.post("/audit-all", authorize(["SUPER_ADMIN", "BRANCH_MANAGER"]), auditLogs);

export default router;
