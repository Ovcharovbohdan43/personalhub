# Деплой Personal Hub

## Changelog

- [2026-06-07] – Исправлено: auth-редиректы на production URL вместо localhost; добавлен `/auth/confirm` и страница `/reset-password`.
- [2026-06-07] – Исправлено: добавлен fallback-маршрут `/[lang]/auth/confirm` для recovery-ссылок, если Supabase Site URL случайно содержит локаль.
- [2026-06-07] – Исправлено: recovery-сессия теперь блокирует доступ к кабинету до сохранения нового пароля; мобильные карточки и нижняя навигация ограничены шириной viewport iPhone.
- [2026-06-08] – Исправлено: недельные финансовые отчёты создаются один раз на календарную неделю и локализуются по выбранному языку интерфейса.
- [2026-06-08] – Добавлено: Telegram бот для ежедневных напоминаний о делах и создания задач из сообщений.

## Supabase (production)

1. Создайте проект на https://supabase.com/dashboard
2. В **Authentication → URL Configuration** укажите:
   - **Site URL:** `https://personalhub-pi.vercel.app`
   - **Redirect URLs:**
     - `https://personalhub-pi.vercel.app/**`
     - `http://localhost:3000/**` (для локальной разработки)
3. Примените миграции:
   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_REF
   npm run db:push
   ```

> **Важно:** если Site URL в Supabase остаётся `http://localhost:3000`, письма со сбросом пароля будут вести на localhost, даже при корректном деплое на Vercel.

## Vercel

1. Импортируйте репозиторий в Vercel
2. Root Directory: корень проекта (`personal-hub-frontend`)
3. Environment Variables (Production):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` = server-only ключ Supabase для Telegram webhook/cron
   - `NEXT_PUBLIC_SITE_URL` = `https://personalhub-pi.vercel.app`
   - `OPENAI_API_KEY` = server-only ключ OpenAI для `/ai-assessment`
   - `TELEGRAM_BOT_TOKEN` = токен BotFather
   - `TELEGRAM_WEBHOOK_SECRET` = случайная строка для проверки Telegram webhook header
   - `TELEGRAM_SETUP_SECRET` = случайная строка для защищённой настройки webhook
   - `CRON_SECRET` = секрет для Vercel Cron endpoint
   - `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` = username бота без `@`
4. Deploy

`NEXT_PUBLIC_SITE_URL` рекомендуется задавать явно. Если переменная не задана, приложение попытается использовать `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL` (автоматически на Vercel).

## Auth flow (сброс пароля)

1. Пользователь запрашивает сброс на `/[lang]/forgot-password`
2. Supabase отправляет письмо со ссылкой на `https://personalhub-pi.vercel.app/auth/confirm?...`
3. `/auth/confirm` проверяет токен, ставит временный recovery-cookie и перенаправляет на `/[lang]/reset-password`
4. Пока recovery-cookie активен, middleware не пускает пользователя в кабинет и возвращает на `/[lang]/reset-password`
5. Пользователь задаёт новый пароль, recovery-cookie удаляется, затем открывается дашборд

Если ссылка приходит как `/ru/auth/confirm?...`, это означает, что в Supabase **Site URL** указан с локалью (`/ru`). В production Site URL должен быть без пути: `https://personalhub-pi.vercel.app`. Приложение также поддерживает `/[lang]/auth/confirm` как fallback, чтобы такие ссылки не падали в 404.

## Telegram bot

1. Создайте бота через BotFather и добавьте env vars в Vercel.
2. Примените миграции:
   ```bash
   npm run db:push
   ```
3. После deploy зарегистрируйте webhook:
   ```bash
   curl -X POST https://personalhub-pi.vercel.app/api/telegram/setup-webhook \
     -H "Authorization: Bearer TELEGRAM_SETUP_SECRET"
   ```
4. В `/[lang]/settings` сгенерируйте код привязки и отправьте боту `/start <code>`.

## Smoke-тест после деплоя

- [ ] `/` редиректит на `/ru` или сохранённый язык
- [ ] Регистрация на `/ru/register`
- [ ] Вход на `/en/login`
- [ ] Сброс пароля: письмо ведёт на `personalhub-pi.vercel.app`, не на `localhost`
- [ ] После перехода из письма нельзя открыть дашборд до сохранения нового пароля
- [ ] На iPhone 15 dashboard и `/finances` не имеют горизонтальной прокрутки, карточки и нижнее меню стоят по центру
- [ ] Переключение языка на `/en/settings`
- [ ] Добавить транзакцию на `/finances`
- [ ] Добавить кредитную карту на `/finances`, оплатить её через транзакцию, проверить уменьшение задолженности
- [ ] Создать заметку на `/notes`
- [ ] Добавить задачу на `/tasks`
- [ ] Добавить закладку на `/bookmarks`
- [ ] Загрузить и скачать документ на `/documents`
- [ ] Открыть колокольчик на дашборде, проверить недельный отчёт и отметить его прочитанным
- [ ] Повторно открыть дашборд в тот же день/неделю и проверить, что новый weekly report не создаётся
- [ ] Переключить язык в `/settings`, открыть дашборд и проверить язык заголовка/текста недельного отчёта
- [ ] Telegram: сгенерировать код в Settings, отправить `/start <code>` боту и получить подтверждение
- [ ] Telegram: отправить обычное сообщение боту и проверить новую задачу в `/tasks`
- [ ] Telegram: вызвать `/api/telegram/daily-reminders` с `CRON_SECRET` и проверить ежедневное напоминание
- [ ] Сгенерировать ИИ-оценку на `/ai-assessment`
- [ ] Выйти — редирект на `/[lang]/login`

## Ограничения production

- og:metadata fetch работает только для публичных URL (без auth-wall)
- Storage bucket `avatars` должен быть public read
- Storage bucket `documents` должен быть private; доступ идёт через signed URLs
- `OPENAI_API_KEY` нельзя добавлять в `NEXT_PUBLIC_*` переменные или клиентский код
