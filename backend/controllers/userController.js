import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
} from "../lib/userService.js";
import { prisma } from "../lib/prisma.js";

export const listUsers = async (req, res) => {
  try {
    const filters = { ...req.query };
    if (req.user.role === "BRANCH_MANAGER") {
      filters.branchId = req.user.branchId;
    }
    const users = await getUsers(filters, req.query);
    res.json(users);
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch users" });
  }
};

export const addUser = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.user.role === "BRANCH_MANAGER") {
      data.branchId = req.user.branchId;
      if (data.role === "SUPER_ADMIN" || data.role === "BRANCH_MANAGER") {
        return res
          .status(403)
          .json({
            error: "Branch Managers can only create Inventory Officers",
          });
      }
      data.role = "INVENTORY_OFFICER";
    }
    const user = await createUser(data);
    res.status(201).json(user);
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: err.message || "Failed to create user" });
  }
};

const verifyUserAccess = async (req, userId) => {
  if (req.user.role === "SUPER_ADMIN") return true;
  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) return false;
  return (
    targetUser.branchId === req.user.branchId &&
    targetUser.role !== "SUPER_ADMIN" &&
    targetUser.role !== "BRANCH_MANAGER"
  );
};

export const editUser = async (req, res) => {
  try {
    const hasAccess = await verifyUserAccess(req, req.params.id);
    if (!hasAccess) return res.status(403).json({ error: "Forbidden" });

    const data = { ...req.body };
    if (req.user.role === "BRANCH_MANAGER") {
      data.branchId = req.user.branchId;
      data.role = "INVENTORY_OFFICER";
    }

    const user = await updateUser(req.params.id, data);
    res.json(user);
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: err.message || "Failed to update user" });
  }
};

export const removeUser = async (req, res) => {
  try {
    const hasAccess = await verifyUserAccess(req, req.params.id);
    if (!hasAccess) return res.status(403).json({ error: "Forbidden" });

    await deleteUser(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: err.message || "Failed to delete user" });
  }
};

export const toggleStatus = async (req, res) => {
  try {
    const hasAccess = await verifyUserAccess(req, req.params.id);
    if (!hasAccess) return res.status(403).json({ error: "Forbidden" });

    const user = await toggleUserStatus(req.params.id, req.body.isActive);
    res.json(user);
  } catch (err) {
    console.error("Toggle user status error:", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to toggle user status" });
  }
};
