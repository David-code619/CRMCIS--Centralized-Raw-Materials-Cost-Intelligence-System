import { 
  getUsageHistory as getUsageLogs, 
  logUsage as createUsageLog,
  auditAllUsageLogs
} from "../lib/usageService.js";

export const listUsageLogs = async (req, res) => {
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
};

export const recordUsage = async (req, res) => {
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
};

export const auditLogs = async (req, res) => {
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
};
