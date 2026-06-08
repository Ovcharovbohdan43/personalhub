-- Telegram bot integration: account linking, daily task reminders, and task creation from bot messages.

create table if not exists public.telegram_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chat_id bigint not null,
  telegram_user_id bigint,
  username text,
  first_name text,
  preferred_locale text not null default 'ru' check (preferred_locale in ('ru', 'en')),
  reminder_enabled boolean not null default true,
  reminder_hour int not null default 9 check (reminder_hour between 0 and 23),
  linked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id),
  unique (chat_id)
);

create index if not exists telegram_connections_reminders_idx
  on public.telegram_connections (reminder_enabled, reminder_hour);

alter table public.telegram_connections enable row level security;

create policy telegram_connections_select_own
  on public.telegram_connections for select to authenticated
  using ((select auth.uid()) = user_id);

create policy telegram_connections_delete_own
  on public.telegram_connections for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy telegram_connections_update_own
  on public.telegram_connections for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.telegram_link_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null unique,
  preferred_locale text not null default 'ru' check (preferred_locale in ('ru', 'en')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists telegram_link_tokens_user_created_idx
  on public.telegram_link_tokens (user_id, created_at desc);

create index if not exists telegram_link_tokens_active_idx
  on public.telegram_link_tokens (token, expires_at)
  where used_at is null;

alter table public.telegram_link_tokens enable row level security;

create policy telegram_link_tokens_select_own
  on public.telegram_link_tokens for select to authenticated
  using ((select auth.uid()) = user_id);

create policy telegram_link_tokens_insert_own
  on public.telegram_link_tokens for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy telegram_link_tokens_update_own
  on public.telegram_link_tokens for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy telegram_link_tokens_delete_own
  on public.telegram_link_tokens for delete to authenticated
  using ((select auth.uid()) = user_id);
