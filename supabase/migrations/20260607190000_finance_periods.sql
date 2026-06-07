-- Personal Hub finances: user-controlled financial months.

create table if not exists public.finance_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  salary_amount numeric(12,2) not null default 0 check (salary_amount >= 0),
  salary_transaction_id uuid references public.transactions (id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  constraint finance_periods_valid_range check (period_end >= period_start),
  constraint finance_periods_user_start_unique unique (user_id, period_start)
);

create index if not exists finance_periods_user_period_idx
  on public.finance_periods (user_id, period_start desc, period_end desc);

alter table public.finance_periods enable row level security;

create policy finance_periods_select_own
  on public.finance_periods for select to authenticated
  using ((select auth.uid()) = user_id);

create policy finance_periods_insert_own
  on public.finance_periods for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy finance_periods_update_own
  on public.finance_periods for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy finance_periods_delete_own
  on public.finance_periods for delete to authenticated
  using ((select auth.uid()) = user_id);
