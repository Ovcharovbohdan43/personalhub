-- Personal Hub finances: credit card obligations and payments.

create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  credit_limit numeric(12,2) not null check (credit_limit >= 0),
  current_balance numeric(12,2) not null default 0 check (current_balance >= 0),
  monthly_payment numeric(12,2) not null default 0 check (monthly_payment >= 0),
  statement_day int check (statement_day between 1 and 31),
  due_day int check (due_day between 1 and 31),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_cards_balance_within_limit check (current_balance <= credit_limit)
);

create index if not exists credit_cards_user_active_idx
  on public.credit_cards (user_id, is_archived, created_at desc);

alter table public.credit_cards enable row level security;

create policy credit_cards_select_own
  on public.credit_cards for select to authenticated
  using ((select auth.uid()) = user_id);

create policy credit_cards_insert_own
  on public.credit_cards for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy credit_cards_update_own
  on public.credit_cards for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy credit_cards_delete_own
  on public.credit_cards for delete to authenticated
  using ((select auth.uid()) = user_id);

alter table public.transactions
  add column if not exists credit_card_id uuid references public.credit_cards (id) on delete set null;

create index if not exists transactions_credit_card_id_idx
  on public.transactions (credit_card_id);

insert into public.expense_categories (user_id, name, color)
select users.id, 'Оплата кредитки', '#f59e0b'
from auth.users users
where not exists (
  select 1
  from public.expense_categories categories
  where categories.user_id = users.id
    and lower(categories.name) = lower('Оплата кредитки')
);

create or replace function public.seed_default_categories(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.expense_categories (user_id, name, color)
  select p_user_id, category_name, category_color
  from (
    values
      ('Еда', '#22c55e'),
      ('Транспорт', '#3b82f6'),
      ('Жильё', '#a855f7'),
      ('Развлечения', '#ef4444'),
      ('Доход', '#10b981'),
      ('Оплата кредитки', '#f59e0b')
  ) as defaults(category_name, category_color)
  where not exists (
    select 1
    from public.expense_categories existing
    where existing.user_id = p_user_id
      and lower(existing.name) = lower(defaults.category_name)
  );
end;
$$;

create or replace function public.apply_credit_card_payment(
  p_credit_card_id uuid,
  p_amount numeric
)
returns table (
  id uuid,
  current_balance numeric,
  available_limit numeric
)
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_amount <= 0 then
    raise exception 'Payment amount must be positive';
  end if;

  return query
  update public.credit_cards card
  set
    current_balance = greatest(0, card.current_balance - p_amount),
    updated_at = now()
  where card.id = p_credit_card_id
    and card.user_id = (select auth.uid())
    and card.is_archived = false
  returning
    card.id,
    card.current_balance,
    card.credit_limit - card.current_balance as available_limit;
end;
$$;

revoke all on function public.apply_credit_card_payment(uuid, numeric) from public;
grant execute on function public.apply_credit_card_payment(uuid, numeric) to authenticated;
