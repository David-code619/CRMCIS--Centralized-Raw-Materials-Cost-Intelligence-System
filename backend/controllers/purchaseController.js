import { 
  getPurchaseHistory as getPurchaseLogs, 
  logPurchase as createPurchaseLog
} from "../lib/purchaseService.js";

export const listPurchaseLogs = async (req, res) => {
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
};

export const recordPurchase = async (req, res) => {
  try {
    const data = { ...req.body, loggedById: req.user.id };
    if (req.user.role !== "SUPER_ADMIN") {
      data.branchId = req.user.branchId;
    } else if (!data.branchId) {
      data.branchId = req.user.branchId;
    }

    if (!data.branchId) {
      return res.status(400).json({ error: "Branch ID is required to log a purchase" });
    }

    const log = await createPurchaseLog(data);
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to record purchase" });
  }
};
