import { 
  getAdjustmentHistory as getAdjustments, 
  recordAdjustment as createAdjustment, 
  approveAdjustment as updateAdjustment, 
  rejectAdjustment as deleteAdjustment 
} from "../lib/adjustmentService.js";

export const listAdjustments = async (req, res) => {
  let { branchId } = req.query;
  if (req.user.role !== "SUPER_ADMIN") {
    branchId = req.user.branchId;
  }
  try {
    const adjustments = await getAdjustments({ branchId }, req.query);
    res.json(adjustments);
  } catch (error) {
    console.error("Failed to fetch adjustments:", error);
    res.status(500).json({ error: "Failed to fetch adjustments" });
  }
};

export const recordAdjustment = async (req, res) => {
  const data = { ...req.body, loggedById: req.user.id };
  if (req.user.role !== "SUPER_ADMIN") {
    data.branchId = req.user.branchId;
  }
  try {
    const adjustment = await createAdjustment(data);
    res.status(201).json(adjustment);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to record adjustment" });
  }
};

export const approveAdjustment = async (req, res) => {
  try {
    const adjustment = await updateAdjustment(req.params.id, req.user.id);
    res.json(adjustment);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to approve adjustment" });
  }
};

export const rejectAdjustment = async (req, res) => {
  try {
    const adjustment = await deleteAdjustment(req.params.id, req.user.id);
    res.json(adjustment);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to reject adjustment" });
  }
};
