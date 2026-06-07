-- Personal Hub in-app notifications and weekly finance reports.

create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('weekly_report')),
  title text not null,
  body text not null,
  payload jsonb not null default '{}',
  period_start date,
  period_end date,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists app_notifications_weekly_report_once_idx
  on public.app_notifications (user_id, type, period_start, period_end)
  where type = 'weekly_report';

create index if not exists app_notifications_user_created_idx
  on public.app_notifications (user_id, created_at desc);

alter table public.app_notifications enable row level security;

create policy app_notifications_select_own
  on public.app_notifications for select to authenticated
  using ((select auth.uid()) = user_id);

create policy app_notifications_insert_own
  on public.app_notifications for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy app_notifications_update_own
  on public.app_notifications for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy app_notifications_delete_own
  on public.app_notifications for delete to authenticated
  using ((select auth.uid()) = user_id);
