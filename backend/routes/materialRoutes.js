import express from "express";
import { 
  getCatalog, addMaterial, editMaterial, removeMaterial,
  getBranchStats, getBreakdown, listBranchMaterials, 
  linkMaterialToBranch,
  updateBranchLink, deleteBranchLink
} from "../controllers/materialController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

// Catalog routes
router.get("/catalog", getCatalog); 
router.post("/catalog", authorize(["SUPER_ADMIN"]), addMaterial);
router.patch("/catalog/:id", authorize(["SUPER_ADMIN"]), editMaterial);
router.delete("/catalog/:id", authorize(["SUPER_ADMIN"]), removeMaterial);

// Branch material routes
router.get("/branch-stats", authorize(["SUPER_ADMIN"]), getBranchStats);
router.get("/:materialId/breakdown", authorize(["SUPER_ADMIN"]), getBreakdown);
router.get("/", listBranchMaterials);
router.post("/", linkMaterialToBranch);
router.patch("/:id", updateBranchLink);
router.delete("/:id", deleteBranchLink);

// Legacy/Alternative branch-specific route
// In server.js it was /api/branches/:id/materials
// I'll handle that separately in server.js or redirect here.

export default router;
