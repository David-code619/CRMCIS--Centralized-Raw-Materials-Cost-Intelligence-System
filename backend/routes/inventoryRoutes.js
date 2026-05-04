import express from "express";
import { getInventory, getStats, getHistory } from "../controllers/inventoryController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getInventory);
router.get("/stats", getStats);
router.get("/history", getHistory);

export default router;
