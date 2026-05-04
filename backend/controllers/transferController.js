import { 
  getTransferHistory as getTransfers, 
  createTransferRequest as createTransfer, 
  processTransferApproval as updateTransfer, 
  completeTransfer as deleteTransfer 
} from "../lib/transferService.js";

export const listTransfers = async (req, res) => {
  let { branchId } = req.query;
  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }
  try {
    const transfers = await getTransfers({ branchId }, req.query);
    res.json(transfers);
  } catch (error) {
    console.error("Failed to fetch transfers:", error);
    res.status(500).json({ error: "Failed to fetch transfers" });
  }
};

export const recordTransfer = async (req, res) => {
  const data = { ...req.body, loggedById: req.user.id };
  if (req.user.role !== "SUPER_ADMIN") {
    data.fromBranchId = req.user.branchId;
  }
  try {
    const transfer = await createTransfer(data);
    res.status(201).json(transfer);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to record transfer" });
  }
};

export const approveTransfer = async (req, res) => {
  try {
    const transfer = await updateTransfer(req.params.id, req.user.id, 'APPROVED', req.body.notes);
    res.json(transfer);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to approve transfer" });
  }
};

export const finalizeTransfer = async (req, res) => {
  try {
    const transfer = await deleteTransfer(req.params.id);
    res.json(transfer);
  } catch (error) {
    console.error("Failed to complete transfer:", error);
    res.status(500).json({ error: error.message || "Failed to complete transfer" });
  }
};
