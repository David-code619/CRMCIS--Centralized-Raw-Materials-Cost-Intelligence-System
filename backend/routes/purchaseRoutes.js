import express from "express";
import { listPurchaseLogs, recordPurchase } from "../controllers/purchaseController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", listPurchaseLogs);
router.post("/", recordPurchase);

export default router;
