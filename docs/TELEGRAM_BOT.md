# Telegram Bot Integration

## Version / Updated

- [2026-06-08] – Added daily Telegram task reminders and task creation from bot messages.
- [2026-06-08] – Improved webhook diagnostics, `/start@botname` parsing, and troubleshooting docs.
- [2026-06-09] – Added full task and finance command set for Telegram bot.
- [2026-06-09] – Added button-based UX with reply menu and inline action buttons.
- [2026-06-09] – Fixed: pending state when switching Income/Expense and transaction input no longer creates tasks.

## Purpose

Telegram integration lets users manage Personal Hub from a private chat using buttons: tasks, transactions, budgets, and credit cards sync with the same Supabase tables used by the web app.

## Button UX

### Main menu (reply keyboard)

| Button (RU) | Button (EN) | Action |
|-------------|-------------|--------|
| Задачи | Tasks | Open tasks list |
| Транзакции | Transactions | Recent transactions |
| Отчёт | Report | Finance report |
| Бюджеты | Budgets | Budget list |
| Кредитки | Cards | Credit cards |
| Добавить дело | Add task | Prompt for task title |
| Расход | Expense | Prompt: `5 энергетики` |
| Доход | Income | Prompt: `1000 Зарплата` |

### Inline buttons

Under each task: **Start**, **Done**, **Rename**, **Due date**, **Delete**

Under each transaction: **Amount**, **Note**, **Date**, **Delete**

Under each credit card: **Pay**, **Archive**

Under each budget: **Limit**

Navigation: **Menu**, **Refresh**

Text commands (`/tasks`, `/tx list`, etc.) still work as fallback.

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

## Setup

1. Apply migrations:
   ```bash
   npm run db:push
   ```
2. Deploy to Vercel.
3. Register webhook (required after deploy — enables `callback_query`):
   ```powershell
   curl.exe -X POST "https://personalhub-pi.vercel.app/api/telegram/setup-webhook" -H "Authorization: Bearer YOUR_TELEGRAM_SETUP_SECRET"
   ```
4. Connect bot in Settings → send `/start <code>`.

## How To Test

1. After linking, bottom menu buttons appear.
2. Tap **Задачи** → tasks list with inline buttons.
3. Tap **Готово** on a task → status updates in app.
4. Tap **Расход** → send `5 энергетики` → appears in Finances (not as a task).
5. Tap **Отчёт** → income/expense summary.

## Troubleshooting

- Buttons not working → re-run `setup-webhook` (must include `callback_query`).
- Pending input stuck → wait 15 min or send any menu button.
- `NEXT_PUBLIC_SITE_URL` must be production URL, not `localhost`.

## Touched Modules

- `app/api/telegram/webhook/route.ts`
- `src/modules/telegram/bot.ts`
- `src/modules/telegram/callbacks.ts`
- `src/modules/telegram/keyboards.ts`
- `src/modules/telegram/menu.ts`
- `src/modules/telegram/pending-actions.ts`
- `src/modules/telegram/commands.ts`
- `src/modules/telegram/task-commands.ts`
- `src/modules/telegram/finance-commands.ts`
- `src/modules/telegram/telegram-api.ts`
- `supabase/migrations/20260609190000_telegram_pending_actions.sql`
