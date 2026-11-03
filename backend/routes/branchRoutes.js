import express from "express";
import { getSpecificBranchMaterials } from "../controllers/materialController.js";
import {
  getBranches,
  createBranch,
  activateMaterialForBranch,
} from "../controllers/branchController.js";
import { authenticate } from "../middleware/auth.js";
import { parseQuery } from "../middleware/parseQuery.js";

const router = express.Router();

router.use(authenticate);

// Branches Collection
router.route("/")
  .get(getBranches)
  .post(createBranch);

// Branch-specific Material Association
router.get("/:id/materials", parseQuery, getSpecificBranchMaterials);
router.post("/:id/materials/activate", activateMaterialForBranch);

export default router;
