-- Personal Hub documents: private file storage + user-owned metadata.

create table if not exists public.user_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  tags text[] not null default '{}',
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint not null default 0,
  signed_by text,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_documents_user_created_idx
  on public.user_documents (user_id, created_at desc);

create index if not exists user_documents_user_title_idx
  on public.user_documents (user_id, title);

alter table public.user_documents enable row level security;

create policy user_documents_select_own
  on public.user_documents for select to authenticated
  using ((select auth.uid()) = user_id);

create policy user_documents_insert_own
  on public.user_documents for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy user_documents_update_own
  on public.user_documents for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy user_documents_delete_own
  on public.user_documents for delete to authenticated
  using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  52428800,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy documents_select_own
  on storage.objects for select to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy documents_insert_own
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy documents_update_own
  on storage.objects for update to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy documents_delete_own
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
