import { prisma } from './prisma.js';

/**
 * Fetch notifications for a specific user
 */
export async function getNotifications(userId, { limit = 10, unreadOnly = false } = {}) {
  return await prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId) {
  return await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

/**
 * Create a new notification
 */
export async function createNotification({ userId, title, message, link = null }) {
  return await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      link,
    },
  });
}

/**
 * Mark a notification as read
 */
export async function markAsRead(id) {
  return await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId) {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

/**
 * Delete a notification
 */
export async function deleteNotification(id) {
  return await prisma.notification.delete({
    where: { id },
  });
}

/**
 * Notify all users with a specific role (and optionally branch)
 */
export async function notifyRoles(roles, title, message, link = null, branchId = null) {
  const users = await prisma.user.findMany({
    where: {
      role: { in: roles },
      ...(branchId ? { branchId } : {}),
      isActive: true,
    },
    select: { id: true },
  });

  if (users.length === 0) return [];

  return await prisma.notification.createMany({
    data: users.map(user => ({
      userId: user.id,
      title,
      message,
      link,
    })),
  });
}