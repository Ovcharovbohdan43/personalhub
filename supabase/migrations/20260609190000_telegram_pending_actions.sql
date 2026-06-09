-- Pending user input for multi-step Telegram bot flows (rename, amounts, etc.)

create table if not exists public.telegram_pending_actions (
  chat_id bigint primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists telegram_pending_actions_user_idx
  on public.telegram_pending_actions (user_id);

create index if not exists telegram_pending_actions_expires_idx
  on public.telegram_pending_actions (expires_at);

alter table public.telegram_pending_actions enable row level security;