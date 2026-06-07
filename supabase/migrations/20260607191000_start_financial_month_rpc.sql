-- Atomic start of a user financial month.

create or replace function public.start_financial_month(
  p_period_start date,
  p_salary_amount numeric,
  p_salary_note text default null
)
returns table (
  period_id uuid,
  salary_transaction_id uuid
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_period_end date;
  v_salary_note text := coalesce(nullif(trim(p_salary_note), ''), 'Зарплата');
  v_period_id uuid;
  v_salary_transaction_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_period_start is null then
    raise exception 'Period start is required';
  end if;

  if p_salary_amount <= 0 then
    raise exception 'Salary amount must be positive';
  end if;

  v_period_end := (p_period_start + interval '1 month' - interval '1 day')::date;

  insert into public.transactions (
    user_id,
    amount,
    currency,
    type,
    category_id,
    credit_card_id,
    occurred_on,
    note
  )
  values (
    v_user_id,
    p_salary_amount,
    'GBP',
    'income',
    null,
    null,
    p_period_start,
    v_salary_note
  )
  returning id into v_salary_transaction_id;

  insert into public.finance_periods (
    user_id,
    period_start,
    period_end,
    salary_amount,
    salary_transaction_id,
    note
  )
  values (
    v_user_id,
    p_period_start,
    v_period_end,
    p_salary_amount,
    v_salary_transaction_id,
    v_salary_note
  )
  returning id into v_period_id;

  with latest_budgets as (
    select distinct on (category_id)
      category_id,
      limit_amount
    from public.budgets
    where user_id = v_user_id
      and period_start <= p_period_start
    order by category_id, period_start desc, created_at desc
  ),
  updated_budgets as (
    update public.budgets target
    set limit_amount = source.limit_amount
    from latest_budgets source
    where target.user_id = v_user_id
      and target.category_id = source.category_id
      and target.period_start = p_period_start
      and target.period_end = v_period_end
    returning target.category_id
  )
  insert into public.budgets (
    user_id,
    category_id,
    limit_amount,
    period_start,
    period_end
  )
  select
    v_user_id,
    source.category_id,
    source.limit_amount,
    p_period_start,
    v_period_end
  from latest_budgets source
  where not exists (
    select 1
    from updated_budgets updated
    where updated.category_id = source.category_id
  );

  return query select v_period_id, v_salary_transaction_id;
end;
$$;

revoke all on function public.start_financial_month(date, numeric, text) from public;
grant execute on function public.start_financial_month(date, numeric, text) to authenticated;
