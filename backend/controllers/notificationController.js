import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} from "../lib/notificationService.js";

export const listNotifications = async (req, res) => {
  try {
    const { limit, unreadOnly } = req.query;
    const notifications = await getNotifications(req.user.id, { 
      limit: limit ? parseInt(limit) : 10, 
      unreadOnly: unreadOnly === 'true' 
    });
    res.json(notifications);
  } catch (err) {
    console.error("Fetch notifications error:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

export const unreadCount = async (req, res) => {
  try {
    const count = await getUnreadCount(req.user.id);
    res.json({ count });
  } catch (err) {
    console.error("Fetch unread count error:", err);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
};

export const markRead = async (req, res) => {
  try {
    const notification = await markAsRead(req.params.id);
    res.json(notification);
  } catch (err) {
    console.error("Mark notification as read error:", err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

export const markAllRead = async (req, res) => {
  try {
    await markAllAsRead(req.user.id);
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Mark all as read error:", err);
    res.status(500).json({ error: "Failed to mark all as read" });
  }
};

export const removeNotification = async (req, res) => {
  try {
    await deleteNotification(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error("Delete notification error:", err);
    res.status(500).json({ error: "Failed to delete notification" });
  }
};
