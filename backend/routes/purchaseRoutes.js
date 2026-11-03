import express from "express";
import { listPurchaseLogs, recordPurchase } from "../controllers/purchaseController.js";
import { authenticate } from "../middleware/auth.js";
import { scopeBranch } from "../middleware/scopeBranch.js";
import { parseQuery } from "../middleware/parseQuery.js";

const router = express.Router();

router.use(authenticate);
router.use(scopeBranch);

// Purchase Logs Collection
router.route("/")
  .get(parseQuery, listPurchaseLogs)
  .post(recordPurchase);

export default router;
