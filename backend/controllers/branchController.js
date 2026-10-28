import { getAllBranches, createBranch as createBranchService } from "../lib/branchService.js";
import { addMaterialToBranch } from "../lib/branchMaterialService.js";

export const createBranch = async (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") {
    return res
      .status(403)
      .json({ error: "Forbidden: Only Super Admins can create branches" });
  }

  try {
    const { name, location } = req.body;
    const branch = await createBranchService({ name, location });
    res.status(201).json(branch);
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ error: "A branch with this name already exists" });
    }
    if (error.message === "Branch name is required") {
      return res.status(400).json({ error: error.message });
    }
    console.error("Failed to create branch:", error);
    res.status(500).json({ error: "Failed to create branch" });
  }
};

export const getBranches = async (req, res) => {
  try {
    const branches = await getAllBranches();
    res.json(branches);
  } catch (error) {
    console.error("Failed to fetch branches:", error);
    res.status(500).json({ error: "Failed to fetch branches" });
  }
};

export const activateMaterialForBranch = async (req, res) => {
  const branchId = req.params.id;
  if (req.user.role !== "SUPER_ADMIN" && req.user.branchId !== branchId) {
    return res.status(403).json({
      error: "Forbidden: You can only activate materials for your own branch",
    });
  }

  const data = { ...req.body, branchId };
  try {
    const material = await addMaterialToBranch(data);
    res.status(201).json(material);
  } catch (error) {
    console.error("Error activating material for branch:", error);
    res.status(500).json({ error: error.message || "Failed to activate material for branch" });
  }
};
