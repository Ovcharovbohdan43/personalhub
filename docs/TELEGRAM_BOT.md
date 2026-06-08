# Telegram Bot Integration

## Version / Updated

- [2026-06-08] – Added daily Telegram task reminders and task creation from bot messages.

## Purpose

Telegram integration lets users receive daily reminders about open tasks and add new tasks by sending messages to the bot. Tasks created in Telegram are stored in the same `tasks` table and immediately appear in the app.

## Detailed Description

- Users connect Telegram from `/[lang]/settings`.
- The app generates a one-time `/start <token>` command valid for 30 minutes.
- The bot stores the user's private Telegram `chat_id` in `telegram_connections`.
- Any regular private message to the bot creates a `todo` task due today.
- `/add task text` also creates a task.
- `/tasks` lists open tasks.
- Vercel Cron calls `/api/telegram/daily-reminders` every day at `08:00 UTC`.
- Reminder language is synced with the system language selected in Settings (`ru` or `en`).

## Required Environment Variables

```env
SUPABASE_SERVICE_ROLE_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_SETUP_SECRET=
CRON_SECRET=
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_SETUP_SECRET`, or `CRON_SECRET` in client code.

## How To Use

1. Create a Telegram bot with BotFather.
2. Add all required environment variables in Vercel.
3. Apply Supabase migrations:
   ```bash
   npm run db:push
   ```
4. Deploy the app.
5. Register the webhook:
   ```bash
   curl -X POST https://personalhub-pi.vercel.app/api/telegram/setup-webhook \
     -H "Authorization: Bearer YOUR_TELEGRAM_SETUP_SECRET"
   ```
6. Open `/ru/settings` or `/en/settings`.
7. Generate a Telegram link code and send `/start <code>` to the bot.

## Examples

Send this to the bot:

```text
/add Pay rent
```

or just:

```text
Pay rent
```

The app creates a task:

```text
title: Pay rent
status: todo
due_date: today
priority: 2
```

## How To Test

1. Generate a link code in Settings.
2. Send `/start <code>` to the bot and confirm the success message.
3. Send `Buy milk`.
4. Open `/[lang]/tasks` and check that the task exists.
5. Send `/tasks` and check that the bot lists open tasks.
6. Call `/api/telegram/daily-reminders` with `Authorization: Bearer CRON_SECRET` and check that the bot sends a reminder.
7. Switch language in Settings and verify that future bot messages use the selected language.

## Limitations

- Daily reminders use the global Vercel Cron schedule, not per-user time zones.
- Bot-created tasks are assigned to today by default.
- The bot only supports private chats.
- Webhook requests are accepted only when the Telegram secret header matches `TELEGRAM_WEBHOOK_SECRET`.

## Touched Modules

- `app/api/telegram/webhook/route.ts`
- `app/api/telegram/daily-reminders/route.ts`
- `app/api/telegram/setup-webhook/route.ts`
- `src/modules/telegram/*`
- `src/components/settings/telegram-settings-panel.tsx`
- `src/modules/settings/actions.ts`
- `supabase/migrations/20260608184500_telegram_integration.sql`
- `supabase/migrations/20260608185000_profile_preferred_locale.sql`
- `vercel.json`
