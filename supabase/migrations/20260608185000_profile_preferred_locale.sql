-- Persist the system interface language so server-side integrations (Telegram cron) can use it.

alter table public.profiles
  add column if not exists preferred_locale text not null default 'ru'
  check (preferred_locale in ('ru', 'en'));
