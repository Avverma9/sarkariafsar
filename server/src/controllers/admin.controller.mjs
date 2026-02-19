import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { createHash, randomBytes, randomInt } from "node:crypto";
import logger from "../utils/logger.mjs";
import AdminUser from "../models/adminUser.model.mjs";
import SidebarMenu from "../models/sidebarMenu.model.mjs";
import { signJwt } from "../services/jwt.service.mjs";
import { ADMIN_ROLES } from "../constants/adminRoles.mjs";
import { sendAdminPasswordResetOtpEmail } from "../services/email.service.mjs";

const PASSWORD_SALT_ROUNDS = Math.max(
  8,
  Number(process.env.PASSWORD_SALT_ROUNDS) || 10,
);
const RESET_OTP_TTL_MINUTES = Math.max(
  1,
  Number(process.env.ADMIN_RESET_OTP_TTL_MINUTES) || 10,
);
const RESET_SESSION_TTL_MINUTES = Math.max(
  1,
  Number(process.env.ADMIN_RESET_SESSION_TTL_MINUTES) || 15,
);
const MAX_RESET_OTP_ATTEMPTS = Math.max(
  1,
  Number(process.env.ADMIN_RESET_MAX_ATTEMPTS) || 5,
);
const MIN_PASSWORD_LENGTH = 6;

const buildMenuTree = (items) => {
  const map = new Map();
  items.forEach((item) => {
    map.set(item._id.toString(), { ...item, children: [] });
  });

  const tree = [];
  for (const node of map.values()) {
    if (node.parentId) {
      const parent = map.get(node.parentId.toString());
      if (parent) {
        parent.children.push(node);
        continue;
      }
    }
    tree.push(node);
  }

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    nodes.forEach((child) => sortNodes(child.children));
  };

  sortNodes(tree);
  return tree;
};

const normalizeRoles = (candidate) => {
  if (!candidate) {
    return [...ADMIN_ROLES];
  }

  const values = Array.isArray(candidate) ? candidate : [candidate];
  const normalized = [];

  values.forEach((value) => {
    if (typeof value !== "string") {
      return;
    }

    const cleaned = value.trim();
    const match = ADMIN_ROLES.find(
      (valid) => valid.toLowerCase() === cleaned.toLowerCase(),
    );
    if (match && !normalized.includes(match)) {
      normalized.push(match);
    }
  });

  return normalized.length ? normalized : ADMIN_ROLES;
};

const sanitizeUser = (userDoc) => {
  if (!userDoc) {
    return null;
  }
  const user =
    typeof userDoc.toObject === "function"
      ? userDoc.toObject({ versionKey: false })
      : { ...userDoc };

  delete user.passwordHash;
  delete user.passwordResetOtpHash;
  delete user.passwordResetOtpExpiresAt;
  delete user.passwordResetOtpAttempts;
  delete user.passwordResetVerifiedAt;
  delete user.passwordResetSessionHash;
  delete user.passwordResetSessionExpiresAt;
  user.id = user._id?.toString() || user.id;
  delete user._id;
  return user;
};

const normalizeRole = (role) => {
  if (!role) return undefined;
  const match = ADMIN_ROLES.find(
    (valid) => valid.toLowerCase() === role.trim().toLowerCase(),
  );
  return match;
};

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return String(value).toLowerCase() === "true";
};

const hashSensitiveValue = (value) => {
  return createHash("sha256").update(String(value || "")).digest("hex");
};

const addMinutes = (date, minutes) => {
  return new Date(date.getTime() + minutes * 60 * 1000);
};

const clearPasswordResetState = (user) => {
  user.passwordResetOtpHash = null;
  user.passwordResetOtpExpiresAt = null;
  user.passwordResetOtpAttempts = 0;
  user.passwordResetVerifiedAt = null;
  user.passwordResetSessionHash = null;
  user.passwordResetSessionExpiresAt = null;
};

const genericForgotPasswordResponse = {
  success: true,
  message: "If this email exists, OTP has been sent",
};

export const forgotPassword = async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) {
      return next({ statusCode: 400, message: "Email is required" });
    }

    const user = await AdminUser.findOne({ email });
    if (!user || !user.isActive) {
      return res.json(genericForgotPasswordResponse);
    }

    const otp = String(randomInt(100000, 1000000));
    const now = new Date();

    user.passwordResetOtpHash = hashSensitiveValue(otp);
    user.passwordResetOtpExpiresAt = addMinutes(now, RESET_OTP_TTL_MINUTES);
    user.passwordResetOtpAttempts = 0;
    user.passwordResetVerifiedAt = null;
    user.passwordResetSessionHash = null;
    user.passwordResetSessionExpiresAt = null;
    await user.save();

    try {
      await sendAdminPasswordResetOtpEmail({
        to: user.email,
        name: user.name,
        otp,
        expiresInMinutes: RESET_OTP_TTL_MINUTES,
      });
    } catch (mailError) {
      clearPasswordResetState(user);
      await user.save();
      logger.error("Failed to send password reset OTP email", mailError.message);
      return next({
        statusCode: 500,
        message: "Unable to send OTP email right now. Please try again.",
      });
    }

    return res.json(genericForgotPasswordResponse);
  } catch (err) {
    next(err);
  }
};

export const verifyResetOtp = async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const otp = String(req.body?.otp || "").trim();

    if (!email || !otp) {
      return next({ statusCode: 400, message: "Email and OTP are required" });
    }

    const user = await AdminUser.findOne({ email });
    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
      return next({ statusCode: 400, message: "Invalid or expired OTP" });
    }

    const now = new Date();
    if (user.passwordResetOtpExpiresAt.getTime() < now.getTime()) {
      clearPasswordResetState(user);
      await user.save();
      return next({ statusCode: 400, message: "OTP has expired. Request a new OTP." });
    }

    if ((user.passwordResetOtpAttempts || 0) >= MAX_RESET_OTP_ATTEMPTS) {
      clearPasswordResetState(user);
      await user.save();
      return next({
        statusCode: 429,
        message: "Maximum OTP attempts exceeded. Request a new OTP.",
      });
    }

    const incomingOtpHash = hashSensitiveValue(otp);
    if (incomingOtpHash !== user.passwordResetOtpHash) {
      user.passwordResetOtpAttempts = (user.passwordResetOtpAttempts || 0) + 1;

      if (user.passwordResetOtpAttempts >= MAX_RESET_OTP_ATTEMPTS) {
        clearPasswordResetState(user);
      }

      await user.save();
      return next({ statusCode: 400, message: "Invalid OTP" });
    }

    const resetToken = randomBytes(32).toString("hex");
    user.passwordResetVerifiedAt = now;
    user.passwordResetSessionHash = hashSensitiveValue(resetToken);
    user.passwordResetSessionExpiresAt = addMinutes(now, RESET_SESSION_TTL_MINUTES);
    user.passwordResetOtpHash = null;
    user.passwordResetOtpExpiresAt = null;
    user.passwordResetOtpAttempts = 0;
    await user.save();

    return res.json({
      success: true,
      message: "OTP verified",
      data: {
        resetToken,
        expiresInMinutes: RESET_SESSION_TTL_MINUTES,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const resetToken = String(req.body?.resetToken || "").trim();
    const newPassword = String(req.body?.newPassword || "");
    const confirmPassword = String(req.body?.confirmPassword || "");

    if (!email || !resetToken || !newPassword) {
      return next({
        statusCode: 400,
        message: "Email, resetToken and newPassword are required",
      });
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return next({
        statusCode: 400,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
    }

    if (confirmPassword && confirmPassword !== newPassword) {
      return next({ statusCode: 400, message: "confirmPassword does not match" });
    }

    const user = await AdminUser.findOne({ email });
    if (
      !user ||
      !user.passwordResetSessionHash ||
      !user.passwordResetSessionExpiresAt
    ) {
      return next({
        statusCode: 400,
        message: "Invalid reset session. Verify OTP again.",
      });
    }

    const now = new Date();
    if (user.passwordResetSessionExpiresAt.getTime() < now.getTime()) {
      clearPasswordResetState(user);
      await user.save();
      return next({
        statusCode: 400,
        message: "Reset session expired. Verify OTP again.",
      });
    }

    const incomingTokenHash = hashSensitiveValue(resetToken);
    if (incomingTokenHash !== user.passwordResetSessionHash) {
      return next({
        statusCode: 400,
        message: "Invalid reset session token",
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      return next({
        statusCode: 400,
        message: "New password must be different from current password",
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
    clearPasswordResetState(user);
    await user.save();

    return res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next({
        statusCode: 400,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await AdminUser.findOne({ email: normalizedEmail });
    if (!user) {
      logger.warn(`Admin login failed: email not found (${normalizedEmail})`);
      return next({ statusCode: 401, message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return next({ statusCode: 403, message: "User is disabled" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      logger.warn(`Admin login failed: incorrect password for ${normalizedEmail}`);
      return next({ statusCode: 401, message: "Invalid credentials" });
    }

    const token = signJwt({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return res.json({
      success: true,
      data: {
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || "8h",
        user: sanitizeUser(user),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, isActive } = req.body;

    if (!name || !email || !password) {
      return next({
        statusCode: 400,
        message: "Name, email and password are required to create a user",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const exists = await AdminUser.findOne({ email: normalizedEmail });
    if (exists) {
      return next({ statusCode: 409, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    const userRole = normalizeRole(role) || ADMIN_ROLES[1];
    const user = await AdminUser.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashedPassword,
      role: userRole,
      isActive: parseBoolean(isActive, true),
    });

    return res.status(201).json({
      success: true,
      data: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const filters = {};

    if (req.query.role) {
      const normalized = normalizeRole(req.query.role);
      if (normalized) {
        filters.role = normalized;
      }
    }

    if (req.query.isActive !== undefined) {
      filters.isActive = parseBoolean(req.query.isActive);
    }

    const total = await AdminUser.countDocuments(filters);
    const users = await AdminUser.find(filters)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      success: true,
      data: users.map((user) => sanitizeUser(user)),
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return next({ statusCode: 400, message: "Invalid user id" });
    }

    const user = await AdminUser.findById(id);
    if (!user) {
      return next({ statusCode: 404, message: "User not found" });
    }

    return res.json({ success: true, data: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return next({ statusCode: 400, message: "Invalid user id" });
    }

    const updates = {};
    const { name, role, password, isActive } = req.body;

    if (name) {
      updates.name = name.trim();
    }

    if (role) {
      const normalized = normalizeRole(role);
      if (!normalized) {
        return next({ statusCode: 400, message: "Invalid role" });
      }
      updates.role = normalized;
    }

    if (password) {
      updates.passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    }

    if (isActive !== undefined) {
      updates.isActive = parseBoolean(isActive);
    }

    const user = await AdminUser.findByIdAndUpdate(id, updates, {
      returnDocument: "after",
    });

    if (!user) {
      return next({ statusCode: 404, message: "User not found" });
    }

    return res.json({ success: true, data: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
};

const ensureParentExists = async (parentId) => {
  if (!parentId) {
    return;
  }

  if (!mongoose.isValidObjectId(parentId)) {
    throw { statusCode: 400, message: "Invalid parent id" };
  }

  const parent = await SidebarMenu.findById(parentId);
  if (!parent) {
    throw { statusCode: 400, message: "Parent menu item not found" };
  }
};

export const listMenu = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.includeHidden !== "true") {
      filter.isHidden = false;
    }
    if (req.query.isEnabled !== undefined) {
      filter.isEnabled = parseBoolean(req.query.isEnabled);
    }

    const items = await SidebarMenu.find(filter)
      .sort({ parentId: 1, sortOrder: 1, title: 1 })
      .lean();

    return res.json({
      success: true,
      count: items.length,
      data: buildMenuTree(items),
    });
  } catch (err) {
    next(err);
  }
};

export const createMenu = async (req, res, next) => {
  try {
    const {
      title,
      link,
      parentId,
      icon,
      sortOrder,
      isHidden,
      isEnabled,
      roles,
    } = req.body;

    if (!title) {
      return next({ statusCode: 400, message: "Title is required" });
    }

    await ensureParentExists(parentId);

    const normalizedRoles = normalizeRoles(roles);
    const menu = await SidebarMenu.create({
      title: title.trim(),
      link: link?.trim() || "",
      parentId: parentId ?? null,
      icon: icon?.trim() || "",
      sortOrder: Number(sortOrder) || 0,
      isHidden: parseBoolean(isHidden, false),
      isEnabled: parseBoolean(isEnabled, true),
      roles: normalizedRoles,
    });

    return res.status(201).json({ success: true, data: menu });
  } catch (err) {
    next(err);
  }
};

export const updateMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return next({ statusCode: 400, message: "Invalid menu id" });
    }

    await ensureParentExists(req.body.parentId);

    if (req.body.parentId && req.body.parentId === id) {
      return next({ statusCode: 400, message: "Menu cannot be its own parent" });
    }

    const updates = {};
    const payload = req.body;

    if (payload.title !== undefined) {
      updates.title = payload.title?.trim() || "";
    }

    if (payload.link !== undefined) {
      updates.link = payload.link?.trim() || "";
    }

    if (payload.icon !== undefined) {
      updates.icon = payload.icon?.trim() || "";
    }

    if (payload.sortOrder !== undefined) {
      updates.sortOrder = Number(payload.sortOrder) || 0;
    }

    if (payload.parentId !== undefined) {
      updates.parentId = payload.parentId || null;
    }

    if (payload.roles !== undefined) {
      updates.roles = normalizeRoles(payload.roles);
    }

    if (payload.isHidden !== undefined) {
      updates.isHidden = parseBoolean(payload.isHidden);
    }

    if (payload.isEnabled !== undefined) {
      updates.isEnabled = parseBoolean(payload.isEnabled);
    }

    const menu = await SidebarMenu.findByIdAndUpdate(id, updates, {
      returnDocument: "after",
    });

    if (!menu) {
      return next({ statusCode: 404, message: "Menu item not found" });
    }

    return res.json({ success: true, data: menu });
  } catch (err) {
    next(err);
  }
};

export const arrangeMenu = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || !items.length) {
      return next({
        statusCode: 400,
        message: "items array is required for arrange",
      });
    }

    const menuIds = [];
    const parentIds = new Set();
    const seen = new Set();
    const operations = [];

    for (const item of items) {
      const id = item?.id;
      const parentId = item?.parentId ?? null;
      const sortOrder = Number(item?.sortOrder) || 0;

      if (!mongoose.isValidObjectId(id)) {
        return next({ statusCode: 400, message: `Invalid menu id: ${id}` });
      }

      if (seen.has(id)) {
        return next({ statusCode: 400, message: `Duplicate menu id: ${id}` });
      }
      seen.add(id);
      menuIds.push(id);

      if (parentId !== null) {
        if (!mongoose.isValidObjectId(parentId)) {
          return next({
            statusCode: 400,
            message: `Invalid parent id for menu ${id}`,
          });
        }

        if (parentId === id) {
          return next({
            statusCode: 400,
            message: "Menu cannot be its own parent",
          });
        }

        parentIds.add(parentId);
      }

      operations.push({
        updateOne: {
          filter: { _id: id },
          update: {
            $set: {
              parentId,
              sortOrder,
            },
          },
        },
      });
    }

    const existingMenuCount = await SidebarMenu.countDocuments({
      _id: { $in: menuIds },
    });

    if (existingMenuCount !== menuIds.length) {
      return next({
        statusCode: 404,
        message: "One or more menu ids were not found",
      });
    }

    const externalParentIds = [...parentIds].filter((parentId) => !seen.has(parentId));
    if (externalParentIds.length) {
      const existingParentCount = await SidebarMenu.countDocuments({
        _id: { $in: externalParentIds },
      });
      if (existingParentCount !== externalParentIds.length) {
        return next({
          statusCode: 400,
          message: "One or more parent ids were not found",
        });
      }
    }

    await SidebarMenu.bulkWrite(operations);

    return res.json({
      success: true,
      message: "Menu order updated successfully",
      count: operations.length,
    });
  } catch (err) {
    next(err);
  }
};

export const setMenuStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return next({ statusCode: 400, message: "Invalid menu id" });
    }

    if (req.body.isEnabled === undefined) {
      return next({
        statusCode: 400,
        message: "isEnabled is required",
      });
    }

    const menu = await SidebarMenu.findByIdAndUpdate(
      id,
      {
        isEnabled: parseBoolean(req.body.isEnabled),
      },
      {
        returnDocument: "after",
      },
    );

    if (!menu) {
      return next({ statusCode: 404, message: "Menu item not found" });
    }

    return res.json({
      success: true,
      message: `Menu ${menu.isEnabled ? "enabled" : "disabled"} successfully`,
      data: menu,
    });
  } catch (err) {
    next(err);
  }
};
