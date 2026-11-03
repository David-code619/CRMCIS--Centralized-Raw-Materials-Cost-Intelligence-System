import express from "express";
import { getInventory, getStats, getHistory } from "../controllers/inventoryController.js";
import { authenticate } from "../middleware/auth.js";
import { scopeBranch } from "../middleware/scopeBranch.js";

const router = express.Router();

router.use(authenticate);
router.use(scopeBranch);

router.get("/", getInventory);
router.get("/stats", getStats);
router.get("/history", getHistory);

export default router;
