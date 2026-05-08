import express from "express";
import { listUsers, addUser, editUser, removeUser, toggleStatus } from "../controllers/userController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize(["SUPER_ADMIN", 'BRANCH_MANAGER']));

router.get("/", listUsers);
router.post("/", addUser);
router.patch("/:id", editUser);
router.delete("/:id", removeUser);
router.patch("/:id/toggle-status", toggleStatus);

export default router;
