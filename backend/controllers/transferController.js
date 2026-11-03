import { 
  getTransferHistory, 
  createTransferRequest, 
  processTransferApproval, 
  completeTransfer 
} from "../lib/transferService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listTransfers = asyncHandler(async (req, res) => {
  const transfers = await getTransferHistory(req.filters, req.pagination);
  res.json(transfers);
});

export const recordTransfer = asyncHandler(async (req, res) => {
  const data = { 
    ...req.body, 
    loggedById: req.user.id,
    fromBranchId: req.branchId || req.body.fromBranchId
  };
  const transfer = await createTransferRequest(data);
  res.status(201).json(transfer);
});

export const approveTransfer = asyncHandler(async (req, res) => {
  const transfer = await processTransferApproval(
    req.params.id, 
    req.user.id, 
    'APPROVED', 
    req.body.notes
  );
  res.json(transfer);
});

export const finalizeTransfer = asyncHandler(async (req, res) => {
  const transfer = await completeTransfer(req.params.id);
  res.json(transfer);
});
