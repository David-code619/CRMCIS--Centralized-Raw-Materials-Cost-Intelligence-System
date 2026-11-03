import express from "express";
import { 
  listTransfers, 
  recordTransfer, 
  approveTransfer, 
  finalizeTransfer 
} from "../controllers/transferController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { scopeBranch } from "../middleware/scopeBranch.js";
import { parseQuery } from "../middleware/parseQuery.js";

const router = express.Router();

router.use(authenticate);
router.use(scopeBranch);

// Transfers Collection
router.route("/")
  .get(parseQuery, listTransfers)
  .post(recordTransfer);

// Transfer Lifecycle Actions
router.patch("/:id/approve", authorize(["SUPER_ADMIN"]), approveTransfer);
router.patch("/:id/complete", authorize(["SUPER_ADMIN", "BRANCH_MANAGER"]), finalizeTransfer);

export default router;
