import express from "express";
import { 
  listUsers, 
  addUser, 
  editUser, 
  removeUser, 
  toggleStatus 
} from "../controllers/userController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { parseQuery } from "../middleware/parseQuery.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize(["SUPER_ADMIN", "BRANCH_MANAGER"]));

router.route("/")
  .get(parseQuery, listUsers)
  .post(addUser);

router.route("/:id")
  .patch(editUser)
  .delete(removeUser);

router.patch("/:id/toggle-status", toggleStatus);

export default router;
