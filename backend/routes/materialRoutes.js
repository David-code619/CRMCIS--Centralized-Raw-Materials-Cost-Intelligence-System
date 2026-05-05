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

// Catalog routes — GET /api/materials serves the catalog (frontend expects this)
router.get("/", getCatalog);
router.get("/catalog", getCatalog);
router.post("/", authorize(["SUPER_ADMIN"]), addMaterial);
router.post("/catalog", authorize(["SUPER_ADMIN"]), addMaterial);
router.patch("/:id", authorize(["SUPER_ADMIN"]), editMaterial);
router.delete("/:id", authorize(["SUPER_ADMIN"]), removeMaterial);

export default router;
