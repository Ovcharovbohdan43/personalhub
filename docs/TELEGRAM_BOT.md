# Telegram Bot Integration

## Version / Updated

- [2026-06-08] – Added daily Telegram task reminders and task creation from bot messages.
- [2026-06-08] – Improved webhook diagnostics, `/start@botname` parsing, and troubleshooting docs.
- [2026-06-09] – Added full task and finance command set for Telegram bot.

## Purpose

Telegram integration lets users manage Personal Hub from a private chat: tasks, transactions, budgets, and credit cards sync with the same Supabase tables used by the web app.

## Detailed Description

- Users connect Telegram from `/[lang]/settings`.
- The app generates a one-time `/start <token>` command valid for 30 minutes.
- The bot stores the user's private Telegram `chat_id` in `telegram_connections`.
- All bot operations are scoped to the linked `user_id`.
- Reminder language follows Settings (`ru` or `en`).
- Vercel Cron calls `/api/telegram/daily-reminders` every day at `08:00 UTC`.

## Task Commands

| Command | Action |
|---------|--------|
| `/tasks` | List open tasks |
| `/tasks done` | List completed tasks |
| `/task add Buy milk` | Add task |
| `/task start 3` | Move task #3 to `in_progress` |
| `/task done 3` | Mark task #3 as done |
| `/task edit 3 New title` | Rename task #3 |
| `/task due 3 2026-06-15` | Set due date |
| `/task delete 3` | Delete task #3 |
| Plain text | Also adds a task |

Task numbers come from the latest `/tasks` list (1–10).

## Finance Commands

| Command | Action |
|---------|--------|
| `/fin` | Income / expense / balance for current finance period |
| `/tx list` | Recent transactions |
| `/tx add expense 12.50 Еда Обед` | Add expense |
| `/tx add income 1000 Зарплата` | Add income |
| `/tx edit 2 amount 15.00` | Edit transaction amount |
| `/tx edit 2 note New text` | Edit transaction note |
| `/tx edit 2 date 2026-06-09` | Edit transaction date |
| `/tx edit 2 type expense` | Change transaction type |
| `/tx delete 2` | Delete transaction |
| `/budget list` | Budgets for current period |
| `/budget set Еда 300` | Set category budget |
| `/cards` | List credit cards |
| `/card add Visa 5000` | Add credit card |
| `/card pay 1 100` | Record card payment |
| `/card archive 1` | Archive card |

Transaction and card numbers come from the latest `/tx list` or `/cards` output.

## Required Environment Variables

```env
SUPABASE_SERVICE_ROLE_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_SETUP_SECRET=
CRON_SECRET=
NEXT_PUBLIC_SITE_URL=https://personalhub-pi.vercel.app
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
   ```powershell
   curl.exe -X POST "https://personalhub-pi.vercel.app/api/telegram/setup-webhook" -H "Authorization: Bearer YOUR_TELEGRAM_SETUP_SECRET"
   ```
6. Open `/ru/settings` or `/en/settings`.
7. Generate a Telegram link code and send `/start <code>` to the bot.
8. Send `/help` to see all commands.

## How To Test

1. `/help` — command list appears.
2. `/tasks` → `/task done 1` — task status changes in `/[lang]/tasks`.
3. `/tx add expense 10 Еда Test` → `/tx list` → `/tx delete 1` — transaction appears and disappears in `/[lang]/finances`.
4. `/fin` — report matches current period totals.
5. `/budget set Еда 300` → `/budget list` — budget visible in app and bot.
6. `/cards` → `/card pay 1 50` — card balance decreases in app.

## Troubleshooting: bot is silent on `/start`

Supabase logs (`auth/v1/user`, DB checkpoint) are **not** Telegram traffic. If the bot does nothing, Telegram is probably not reaching your app.

1. In Vercel → **Logs**, filter by `/api/telegram/webhook`. When you send a message to the bot, you should see `POST` requests there.
2. Confirm env vars exist in Vercel (Production), especially `NEXT_PUBLIC_SITE_URL=https://personalhub-pi.vercel.app` (not `localhost`).
3. Redeploy after changing env vars.
4. Register the webhook again after env changes.
5. Check webhook status:
   ```powershell
   curl.exe "https://personalhub-pi.vercel.app/api/telegram/status" -H "Authorization: Bearer YOUR_TELEGRAM_SETUP_SECRET"
   ```

If `TELEGRAM_WEBHOOK_SECRET` was changed in Vercel but webhook was not re-registered, Telegram gets `401` and stops delivering updates.

## Limitations

- Daily reminders use the global Vercel Cron schedule, not per-user time zones.
- Bot-created tasks default to today with priority `2`.
- Delete commands run immediately without confirmation.
- Category names must match existing `expense_categories` (seeded on signup).
- Card payment category uses `Оплата кредитки` when available.
- Text commands only; no inline buttons yet.

## Touched Modules

- `app/api/telegram/webhook/route.ts`
- `app/api/telegram/daily-reminders/route.ts`
- `app/api/telegram/setup-webhook/route.ts`
- `app/api/telegram/status/route.ts`
- `src/modules/telegram/bot.ts`
- `src/modules/telegram/commands.ts`
- `src/modules/telegram/parser.ts`
- `src/modules/telegram/task-commands.ts`
- `src/modules/telegram/finance-commands.ts`
- `src/modules/telegram/formatters.ts`
- `src/modules/telegram/copy.ts`
- `src/modules/telegram/db-helpers.ts`
- `src/modules/telegram/types.ts`
- `supabase/migrations/20260608184500_telegram_integration.sql`
- `vercel.json`
