import express from "express";
import { 
  listNotifications, 
  unreadCount, 
  markRead, 
  markAllRead, 
  removeNotification 
} from "../controllers/notificationController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", listNotifications);
router.get("/unread-count", unreadCount);
router.patch("/read-all", markAllRead);

router.route("/:id")
  .patch(markRead)
  .delete(removeNotification);

export default router;
