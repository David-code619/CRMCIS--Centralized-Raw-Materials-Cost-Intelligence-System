import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  toggleUserStatus
} from "../lib/userService.js";

export const listUsers = async (req, res) => {
  try {
    const users = await getUsers(req.query, req.query);
    res.json(users);
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch users" });
  }
};

export const addUser = async (req, res) => {
  try {
    const user = await createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: err.message || "Failed to create user" });
  }
};

export const editUser = async (req, res) => {
  try {
    const user = await updateUser(req.params.id, req.body);
    res.json(user);
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: err.message || "Failed to update user" });
  }
};

export const removeUser = async (req, res) => {
  try {
    await deleteUser(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: err.message || "Failed to delete user" });
  }
};

export const toggleStatus = async (req, res) => {
  try {
    const user = await toggleUserStatus(req.params.id);
    res.json(user);
  } catch (err) {
    console.error("Toggle user status error:", err);
    res.status(500).json({ error: err.message || "Failed to toggle user status" });
  }
};
