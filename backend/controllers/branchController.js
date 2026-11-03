import { getAllBranches, createBranch as createBranchService } from "../lib/branchService.js";
import { addMaterialToBranch } from "../lib/branchMaterialService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const createBranch = asyncHandler(async (req, res) => {
  if (req.user.role !== "SUPER_ADMIN") {
    return res
      .status(403)
      .json({ error: "Forbidden: Only Super Admins can create branches" });
  }

  const { name, location } = req.body;
  try {
    const branch = await createBranchService({ name, location });
    res.status(201).json(branch);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ error: "A branch with this name already exists" });
    }
    if (error.message === "Branch name is required") {
      return res.status(400).json({ error: error.message });
    }
    throw error;
  }
});

export const getBranches = asyncHandler(async (req, res) => {
  const branches = await getAllBranches();
  res.json(branches);
});

export const activateMaterialForBranch = asyncHandler(async (req, res) => {
  const branchId = req.params.id;
  if (req.user.role !== "SUPER_ADMIN" && req.user.branchId !== branchId) {
    return res.status(403).json({
      error: "Forbidden: You can only activate materials for your own branch",
    });
  }

  const data = { ...req.body, branchId };
  const material = await addMaterialToBranch(data);
  res.status(201).json(material);
});
