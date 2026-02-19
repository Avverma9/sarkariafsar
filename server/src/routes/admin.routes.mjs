import express from "express";
import {
  arrangeMenu,
  createMenu,
  createUser,
  forgotPassword,
  setMenuStatus,
  listMenu,
  listUsers,
  login,
  resetPassword,
  verifyResetOtp,
  getUser,
  updateMenu,
  updateUser,
} from "../controllers/admin.controller.mjs";
import { authMiddleware, requireRoles } from "../middlewares/auth.middleware.mjs";
import { ADMIN_ROLES } from "../constants/adminRoles.mjs";

const router = express.Router();

router.post("/auth/login", login);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/verify-reset-otp", verifyResetOtp);
router.post("/auth/reset-password", resetPassword);

const adminOnly = [authMiddleware, requireRoles([ADMIN_ROLES[0]])];
const adminAndDeveloper = [authMiddleware, requireRoles(ADMIN_ROLES)];

router.post("/users", adminOnly, createUser);
router.get("/users", adminAndDeveloper, listUsers);
router.get("/users/:id", adminAndDeveloper, getUser);
router.patch("/users/:id", adminOnly, updateUser);

router.get("/menu", adminAndDeveloper, listMenu);
router.post("/menu", adminOnly, createMenu);
router.patch("/menu/arrange", adminOnly, arrangeMenu);
router.patch("/menu/:id/status", adminOnly, setMenuStatus);
router.patch("/menu/:id", adminOnly, updateMenu);

export default router;
