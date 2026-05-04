import express from "express";
import { initializeSystem, healthCheck, ping } from "../controllers/systemController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post("/initialize", authenticate, initializeSystem);
router.get("/health", healthCheck);
router.get("/ping", ping);

export default router;
