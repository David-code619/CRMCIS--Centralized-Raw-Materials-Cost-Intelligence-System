import express from "express";
import { 
  getBranchStats, 
  getBreakdown, 
  listBranchMaterials, 
  linkMaterialToBranch,
  updateBranchLink, 
  deleteBranchLink 
} from "../controllers/materialController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { scopeBranch } from "../middleware/scopeBranch.js";
import { parseQuery } from "../middleware/parseQuery.js";

const router = express.Router();

router.use(authenticate);
router.use(scopeBranch);

// Special Analytics Endpoints
router.get("/branch-stats", authorize(["SUPER_ADMIN"]), parseQuery, getBranchStats);
router.get("/:materialId/breakdown", authorize(["SUPER_ADMIN"]), getBreakdown);

// Branch Materials Collection
router.route("/")
  .get(parseQuery, listBranchMaterials)
  .post(linkMaterialToBranch);

// Individual Branch Material Link
router.route("/:id")
  .patch(updateBranchLink)
  .delete(deleteBranchLink);

export default router;
