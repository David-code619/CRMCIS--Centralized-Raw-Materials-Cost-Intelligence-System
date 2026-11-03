import { 
  getUsageHistory, 
  logUsage,
  auditAllUsageLogs
} from "../lib/usageService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listUsageLogs = asyncHandler(async (req, res) => {
  const logs = await getUsageHistory(req.filters, req.pagination);
  res.json(logs);
});

export const recordUsage = asyncHandler(async (req, res) => {
  const data = { 
    ...req.body, 
    loggedById: req.user.id,
    branchId: req.branchId || req.body.branchId
  };
  const log = await logUsage(data);
  res.status(201).json(log);
});

export const auditLogs = asyncHandler(async (req, res) => {
  const result = await auditAllUsageLogs(req.branchId);
  res.json(result);
});
