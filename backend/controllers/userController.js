import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
} from "../lib/userService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const verifyUserAccess = async (req, userId) => {
  if (req.user.role === "SUPER_ADMIN") return true;
  const targetUser = await getUserById(userId);
  if (!targetUser) return false;
  return (
    targetUser.branchId === req.user.branchId &&
    targetUser.role !== "SUPER_ADMIN" &&
    targetUser.role !== "BRANCH_MANAGER"
  );
};

export const listUsers = asyncHandler(async (req, res) => {
  const filters = { ...req.filters };
  if (req.user.role === "BRANCH_MANAGER") {
    filters.branchId = req.user.branchId;
  }
  const users = await getUsers(filters, req.pagination || req.query);
  res.json(users);
});

export const addUser = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.user.role === "BRANCH_MANAGER") {
    data.branchId = req.user.branchId;
    if (data.role === "SUPER_ADMIN" || data.role === "BRANCH_MANAGER") {
      return res.status(403).json({
        error: "Branch Managers can only create Inventory Officers",
      });
    }
    data.role = "INVENTORY_OFFICER";
  }
  const user = await createUser(data);
  res.status(201).json(user);
});

export const editUser = asyncHandler(async (req, res) => {
  const hasAccess = await verifyUserAccess(req, req.params.id);
  if (!hasAccess) return res.status(403).json({ error: "Forbidden" });

  const data = { ...req.body };
  if (req.user.role === "BRANCH_MANAGER") {
    data.branchId = req.user.branchId;
    data.role = "INVENTORY_OFFICER";
  }

  const user = await updateUser(req.params.id, data);
  res.json(user);
});

export const removeUser = asyncHandler(async (req, res) => {
  const hasAccess = await verifyUserAccess(req, req.params.id);
  if (!hasAccess) return res.status(403).json({ error: "Forbidden" });

  await deleteUser(req.params.id);
  res.status(204).end();
});

export const toggleStatus = asyncHandler(async (req, res) => {
  const hasAccess = await verifyUserAccess(req, req.params.id);
  if (!hasAccess) return res.status(403).json({ error: "Forbidden" });

  const user = await toggleUserStatus(req.params.id, req.body.isActive);
  res.json(user);
});
