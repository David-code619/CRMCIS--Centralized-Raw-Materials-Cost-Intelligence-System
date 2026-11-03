import express from "express";
import { 
  getStats, 
  getKPIs, 
  getComparison, 
  getCostTrends, 
  getTopConsumed, 
  getValueTrend, 
  getShrinkage 
} from "../controllers/reportController.js";
import { authenticate } from "../middleware/auth.js";
import { scopeBranch } from "../middleware/scopeBranch.js";
import { parseQuery } from "../middleware/parseQuery.js";

const router = express.Router();

router.use(authenticate);
router.use(scopeBranch);
router.use(parseQuery);

// Dashboard and Summary Stats
router.get("/", getStats);
router.get("/dashboard", getStats);

// KPI & Analytics Reports
router.get("/kpis", getKPIs);
router.get("/comparison", getComparison);
router.get("/branch-comparison", getComparison); // Compatibility alias
router.get("/cost-trends", getCostTrends);
router.get("/top-consumed", getTopConsumed);
router.get("/value-trend", getValueTrend);
router.get("/shrinkage", getShrinkage);

export default router;
