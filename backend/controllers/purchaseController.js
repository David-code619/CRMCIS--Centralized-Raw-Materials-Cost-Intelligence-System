import { 
  getPurchaseHistory, 
  logPurchase 
} from "../lib/purchaseService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listPurchaseLogs = asyncHandler(async (req, res) => {
  const logs = await getPurchaseHistory(req.filters, req.pagination);
  res.json(logs);
});

export const recordPurchase = asyncHandler(async (req, res) => {
  const data = { 
    ...req.body, 
    loggedById: req.user.id,
    branchId: req.branchId || req.body.branchId 
  };

  if (!data.branchId) {
    return res.status(400).json({ error: "Branch ID is required to log a purchase" });
  }

  const log = await logPurchase(data);
  res.status(201).json(log);
});
