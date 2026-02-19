import mongoose from "mongoose";
import { ADMIN_ROLES } from "../constants/adminRoles.mjs";

const sidebarMenuSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      trim: true,
      default: "",
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SidebarMenu",
      default: null,
    },
    icon: {
      type: String,
      trim: true,
      default: "",
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    roles: {
      type: [String],
      enum: ADMIN_ROLES,
      default: () => [...ADMIN_ROLES],
    },
  },
  {
    timestamps: true,
  },
);

const SidebarMenu = mongoose.model("SidebarMenu", sidebarMenuSchema);
export default SidebarMenu;
