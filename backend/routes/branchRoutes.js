import express from "express";
import { getSpecificBranchMaterials } from "../controllers/materialController.js";
import { getBranches, createBranch } from "../controllers/branchController.js";
import { authenticate } from "../middleware/auth.js";
import { addMaterialToBranch } from "../lib/branchMaterialService.js";

const router = express.Router();

router.use(authenticate);
router.get("/", getBranches);
router.get("/:id/materials", getSpecificBranchMaterials);
router.post("/", createBranch);
router.post("/:id/materials/activate", async (req, res) => {
  const branchId = req.params.id;
  if (req.user.role !== "SUPER_ADMIN" && req.user.branchId !== branchId) {
    return res.status(403).json({ error: "Forbidden: You can only activate materials for your own branch" });
  }
  const data = { ...req.body, branchId };
  try {
    const material = await addMaterialToBranch(data);
    res.status(201).json(material);
  } catch (error) {
    console.error("Error activating material for branch:", error);
    res.status(500).json({ error: "Failed to activate material for branch" });
  }
});

export default router;
