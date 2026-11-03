import { 
  getAdjustmentHistory, 
  recordAdjustment as createAdjustmentRecord, 
  approveAdjustment as approveAdjustmentRecord, 
  rejectAdjustment as rejectAdjustmentRecord 
} from "../lib/adjustmentService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listAdjustments = asyncHandler(async (req, res) => {
  const adjustments = await getAdjustmentHistory(req.filters, req.pagination);
  res.json(adjustments);
});

export const recordAdjustment = asyncHandler(async (req, res) => {
  const data = { 
    ...req.body, 
    loggedById: req.user.id,
    branchId: req.branchId || req.body.branchId
  };
  const adjustment = await createAdjustmentRecord(data);
  res.status(201).json(adjustment);
});

export const approveAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await approveAdjustmentRecord(req.params.id, req.user.id);
  res.json(adjustment);
});

export const rejectAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await rejectAdjustmentRecord(req.params.id, req.user.id);
  res.json(adjustment);
});
