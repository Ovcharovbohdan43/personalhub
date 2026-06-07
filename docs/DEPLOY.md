# Деплой Personal Hub

## Supabase (production)

1. Создайте проект на https://supabase.com/dashboard
2. В **Authentication → URL Configuration** добавьте:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`
3. Примените миграции:
   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_REF
   npm run db:push
   ```

## Vercel

1. Импортируйте репозиторий в Vercel
2. Root Directory: `personal-hub-frontend` (если монорепо) или корень проекта
3. Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` = URL Vercel-приложения
   - `OPENAI_API_KEY` = server-only ключ OpenAI для `/ai-assessment`
4. Deploy

## Smoke-тест после деплоя

- [ ] `/` редиректит на `/ru` или сохранённый язык
- [ ] Регистрация на `/ru/register`
- [ ] Вход на `/en/login`
- [ ] Переключение языка на `/en/settings`
- [ ] Добавить транзакцию на `/finances`
- [ ] Добавить кредитную карту на `/finances`, оплатить её через транзакцию, проверить уменьшение задолженности
- [ ] Создать заметку на `/notes`
- [ ] Добавить задачу на `/tasks`
- [ ] Добавить закладку на `/bookmarks`
- [ ] Загрузить и скачать документ на `/documents`
- [ ] Открыть колокольчик на дашборде, проверить недельный отчёт и отметить его прочитанным
- [ ] Сгенерировать ИИ-оценку на `/ai-assessment`
- [ ] Выйти — редирект на `/[lang]/login`

## Ограничения production

- og:metadata fetch работает только для публичных URL (без auth-wall)
- Storage bucket `avatars` должен быть public read
- Storage bucket `documents` должен быть private; доступ идёт через signed URLs
- `OPENAI_API_KEY` нельзя добавлять в `NEXT_PUBLIC_*` переменные или клиентский код
