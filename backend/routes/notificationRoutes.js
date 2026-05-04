import express from "express";
import { listNotifications, unreadCount, markRead, markAllRead, removeNotification } from "../controllers/notificationController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", listNotifications);
router.get("/unread-count", unreadCount);
router.patch("/:id/read", markRead);
router.patch("/read-all", markAllRead);
router.delete("/:id", removeNotification);

export default router;
