import express from "express";
import { 
  listAdjustments, 
  recordAdjustment, 
  approveAdjustment, 
  rejectAdjustment 
} from "../controllers/adjustmentController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { scopeBranch } from "../middleware/scopeBranch.js";
import { parseQuery } from "../middleware/parseQuery.js";

const router = express.Router();

router.use(authenticate);
router.use(scopeBranch);

// Stock Adjustments Collection
router.route("/")
  .get(parseQuery, listAdjustments)
  .post(recordAdjustment);

// Approval Actions
router.patch("/:id/approve", authorize(["SUPER_ADMIN", "BRANCH_MANAGER"]), approveAdjustment);
router.patch("/:id/reject", authorize(["SUPER_ADMIN", "BRANCH_MANAGER"]), rejectAdjustment);

export default router;
