This folder keeps the job notification system isolated.

Main entry:
- `notification.mjs`

Core mail exports:
- `sendJobUpdateNotification`
- `sendNewPostsNotification`
- `sendSystemEventNotification`

Standalone scraping + notification exports:
- `scrapeSectionPostsForNotification`
- `notifyStandaloneSectionPosts`
- `runStandaloneJobNotifications`

State handling:
- No database save is required.
- Previous scrape snapshot is stored in `.notification-state.json` inside this folder by default.

CLI usage:
- `npm run notify:jobs`
- `npm run notify:jobs:cron`

Config:
- Use `.env` for SMTP, targets, schedule, timezone, and flags.
- Do not hardcode mail credentials in the repo.

Cron:
- Default schedule is every 30 minutes.
- Default timezone is `Asia/Kolkata`.
- If `sectionName` is empty, notification uses the scraped source URL slug as the section name.

Result shape:
- `newJobNotification`
- `updateJobNotification`

Required env:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`
- `EMAIL_TO`
- `JOB_NOTIFICATION_TARGETS`

Optional env:
- `JOB_NOTIFICATION_CRON_ENABLED`
- `JOB_NOTIFICATION_CRON_SCHEDULE`
- `JOB_NOTIFICATION_CRON_TIMEZONE`
- `JOB_NOTIFICATION_CRON_RUN_ON_START`
- `JOB_NOTIFICATION_NOTIFY_ON_FIRST_RUN`
- `JOB_NOTIFICATION_STATE_FILE`

Notes:
- Existing code should use this folder directly as the single notification runtime.
