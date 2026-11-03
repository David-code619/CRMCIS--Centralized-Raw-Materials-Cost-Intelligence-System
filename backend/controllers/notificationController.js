import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} from "../lib/notificationService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const { limit, unreadOnly } = req.query;
  const notifications = await getNotifications(req.user.id, { 
    limit: limit ? parseInt(limit, 10) : 10, 
    unreadOnly: unreadOnly === 'true' 
  });
  res.json(notifications);
});

export const unreadCount = asyncHandler(async (req, res) => {
  const count = await getUnreadCount(req.user.id);
  res.json({ count });
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await markAsRead(req.params.id);
  res.json(notification);
});

export const markAllRead = asyncHandler(async (req, res) => {
  await markAllAsRead(req.user.id);
  res.json({ message: "All notifications marked as read" });
});

export const removeNotification = asyncHandler(async (req, res) => {
  await deleteNotification(req.params.id);
  res.status(204).end();
});
