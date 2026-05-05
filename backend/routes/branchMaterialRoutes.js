import express from "express";
import { 
  getBranchStats, getBreakdown, listBranchMaterials, 
  linkMaterialToBranch,
  updateBranchLink, deleteBranchLink
} from "../controllers/materialController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

// Branch material routes — mounted at /api/branch-materials
router.get("/branch-stats", authorize(["SUPER_ADMIN"]), getBranchStats);
router.get("/:materialId/breakdown", authorize(["SUPER_ADMIN"]), getBreakdown);
router.get("/", listBranchMaterials);
router.post("/", linkMaterialToBranch);
router.patch("/:id", updateBranchLink);
router.delete("/:id", deleteBranchLink);

export default router;
