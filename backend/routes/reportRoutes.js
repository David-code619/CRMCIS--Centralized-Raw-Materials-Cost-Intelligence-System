import express from "express";
import { getStats, getKPIs, getComparison, getCostTrends, getTopConsumed, getValueTrend, getShrinkage } from "../controllers/reportController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getStats);
router.get("/dashboard", getStats);
router.get("/kpis", getKPIs);
router.get("/comparison", getComparison);
router.get("/cost-trends", getCostTrends);
router.get("/top-consumed", getTopConsumed);
router.get("/value-trend", getValueTrend);
router.get("/shrinkage", getShrinkage);

export default router;
