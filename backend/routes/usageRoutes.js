import express from "express";
import { listUsageLogs, recordUsage, auditLogs } from "../controllers/usageController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { scopeBranch } from "../middleware/scopeBranch.js";
import { parseQuery } from "../middleware/parseQuery.js";

const router = express.Router();

router.use(authenticate);
router.use(scopeBranch);

// Usage Logs Collection
router.route("/")
  .get(parseQuery, listUsageLogs)
  .post(recordUsage);

router.post("/audit-all", authorize(["SUPER_ADMIN", "BRANCH_MANAGER"]), auditLogs);

export default router;
