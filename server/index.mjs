import "./utils/loadEnv.mjs";
import { startStandaloneJobNotificationCron } from "./job-notification/notification.mjs";

console.log("[startup] Notification-only runtime active");
startStandaloneJobNotificationCron();

export default {
  startStandaloneJobNotificationCron,
};
