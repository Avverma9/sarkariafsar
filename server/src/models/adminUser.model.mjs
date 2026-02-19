import mongoose from "mongoose";
import { ADMIN_ROLES } from "../constants/adminRoles.mjs";

const adminUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ADMIN_ROLES,
      default: ADMIN_ROLES[1],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    passwordResetOtpHash: {
      type: String,
      default: null,
    },
    passwordResetOtpExpiresAt: {
      type: Date,
      default: null,
    },
    passwordResetOtpAttempts: {
      type: Number,
      default: 0,
    },
    passwordResetVerifiedAt: {
      type: Date,
      default: null,
    },
    passwordResetSessionHash: {
      type: String,
      default: null,
    },
    passwordResetSessionExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

adminUserSchema.methods.toJSON = function () {
  const user = this.toObject({ versionKey: false });
  delete user.passwordHash;
  delete user.passwordResetOtpHash;
  delete user.passwordResetOtpExpiresAt;
  delete user.passwordResetOtpAttempts;
  delete user.passwordResetVerifiedAt;
  delete user.passwordResetSessionHash;
  delete user.passwordResetSessionExpiresAt;
  return user;
};

const AdminUser = mongoose.model("AdminUser", adminUserSchema);
export default AdminUser;
