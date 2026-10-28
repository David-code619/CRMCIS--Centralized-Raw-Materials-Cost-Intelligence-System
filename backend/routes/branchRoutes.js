import express from "express";
import { getSpecificBranchMaterials } from "../controllers/materialController.js";
import {
  getBranches,
  createBranch,
  activateMaterialForBranch,
} from "../controllers/branchController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.get("/", getBranches);
router.get("/:id/materials", getSpecificBranchMaterials);
router.post("/", createBranch);
router.post("/:id/materials/activate", activateMaterialForBranch);

export default router;
