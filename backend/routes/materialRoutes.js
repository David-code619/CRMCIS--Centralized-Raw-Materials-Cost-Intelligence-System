import express from "express";
import {
  getCatalog,
  addMaterial,
  editMaterial,
  removeMaterial,
} from "../controllers/materialController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { parseQuery } from "../middleware/parseQuery.js";

const router = express.Router();

router.use(authenticate);

// Global Material Catalog Collection
router.route("/")
  .get(parseQuery, getCatalog)
  .post(authorize(["SUPER_ADMIN"]), addMaterial);

// Aliases for backwards compatibility
router.route("/catalog")
  .get(parseQuery, getCatalog)
  .post(authorize(["SUPER_ADMIN"]), addMaterial);

// Single Material Operations
router.route("/:id")
  .patch(authorize(["SUPER_ADMIN"]), editMaterial)
  .delete(authorize(["SUPER_ADMIN"]), removeMaterial);

export default router;
