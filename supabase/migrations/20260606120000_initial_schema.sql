-- Personal Hub initial schema
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#22c55e',
  icon text,
  created_at timestamptz not null default now()
);
create index if not exists expense_categories_user_id_idx on public.expense_categories (user_id);
alter table public.expense_categories enable row level security;
create policy expense_categories_all_own on public.expense_categories for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.expense_categories (id) on delete set null,
  amount numeric(12,2) not null,
  currency text not null default 'GBP',
  type text not null check (type in ('income','expense')),
  occurred_on date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_id_occurred_on_idx on public.transactions (user_id, occurred_on desc);
alter table public.transactions enable row level security;
create policy transactions_all_own on public.transactions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.expense_categories (id) on delete cascade,
  limit_amount numeric(12,2) not null,
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default now()
);
create index if not exists budgets_user_id_period_idx on public.budgets (user_id, period_start, period_end);
alter table public.budgets enable row level security;
create policy budgets_all_own on public.budgets for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  content text not null default '',
  tags text[] not null default '{}',
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notes_user_id_updated_at_idx on public.notes (user_id, updated_at desc);
alter table public.notes enable row level security;
create policy notes_all_own on public.notes for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'active' check (status in ('active','completed','archived')),
  target_date date,
  created_at timestamptz not null default now()
);
create index if not exists projects_user_id_idx on public.projects (user_id);
alter table public.projects enable row level security;
create policy projects_all_own on public.projects for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  title text not null,
  status text not null default 'todo' check (status in ('todo','in_progress','done','cancelled')),
  priority int not null default 2 check (priority between 1 and 3),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists tasks_user_id_status_idx on public.tasks (user_id, status);
alter table public.tasks enable row level security;
create policy tasks_all_own on public.tasks for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  url text not null,
  type text not null default 'link' check (type in ('link','video','article')),
  description text,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists bookmarks_user_id_created_at_idx on public.bookmarks (user_id, created_at desc);
alter table public.bookmarks enable row level security;
create policy bookmarks_all_own on public.bookmarks for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public) values ('avatars','avatars',true) on conflict (id) do nothing;
create policy avatars_select_public on storage.objects for select using (bucket_id = 'avatars');
create policy avatars_insert_own on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_update_own on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_delete_own on storage.objects for delete to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create or replace function public.seed_default_categories(p_user_id uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.expense_categories (user_id, name, color) values
    (p_user_id,'Еда','#22c55e'),(p_user_id,'Транспорт','#3b82f6'),(p_user_id,'Жильё','#a855f7'),(p_user_id,'Развлечения','#ef4444'),(p_user_id,'Доход','#10b981');
end; $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1))) on conflict (id) do nothing;
  perform public.seed_default_categories(new.id);
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
