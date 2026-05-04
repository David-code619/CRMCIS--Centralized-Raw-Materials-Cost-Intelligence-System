import express from "express";
import { listTransfers, recordTransfer, approveTransfer, finalizeTransfer } from "../controllers/transferController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", listTransfers);
router.post("/", recordTransfer);
router.patch("/:id/approve", authorize(["SUPER_ADMIN"]), approveTransfer);
router.patch("/:id/complete", authorize(["SUPER_ADMIN", "BRANCH_MANAGER"]), finalizeTransfer);

export default router;