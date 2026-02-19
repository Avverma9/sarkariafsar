import "dotenv/config";
import logger from "../src/utils/logger.mjs";
import { connectDB } from "../src/config/db.mjs";
import SidebarMenu from "../src/models/sidebarMenu.model.mjs";
import { ADMIN_ROLES } from "../src/constants/adminRoles.mjs";

const ensureMenuItem = async (filter, data) => {
  return SidebarMenu.findOneAndUpdate(filter, data, {
    upsert: true,
    returnDocument: "after",
    setDefaultsOnInsert: true,
  });
};

const seed = async () => {
  await connectDB();

  const dashboard = await ensureMenuItem(
    { title: "Dashboard", parentId: null },
    {
      title: "Dashboard",
      link: "/dashboard",
      icon: "dashboard",
      sortOrder: 0,
      isHidden: false,
      isEnabled: true,
      roles: ADMIN_ROLES,
      parentId: null,
    },
  );

  const settings = await ensureMenuItem(
    { title: "Settings", parentId: null },
    {
      title: "Settings",
      link: "/settings",
      icon: "settings",
      sortOrder: 10,
      isHidden: false,
      isEnabled: true,
      roles: ADMIN_ROLES,
      parentId: null,
    },
  );

  await ensureMenuItem(
    { title: "Manage Menu", parentId: settings._id },
    {
      title: "Manage Menu",
      link: "/settings/menu",
      icon: "menu",
      sortOrder: 0,
      isHidden: false,
      isEnabled: true,
      roles: ADMIN_ROLES,
      parentId: settings._id,
    },
  );

  logger.info("Seeded sidebar menu items (Dashboard + Settings/Manage Menu)");
};

seed()
  .then(() => {
    logger.info("Seeding complete");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Failed to seed sidebar menus", error);
    process.exit(1);
  });
