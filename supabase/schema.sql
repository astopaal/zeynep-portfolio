create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('Basılı işler', 'Web tasarımı', 'Sosyal medya', 'Video / motion')),
  description text not null default '',
  cover_path text,
  media_path text,
  external_url text,
  media_kind text not null default 'image' check (media_kind in ('image', 'video', 'pdf', 'link')),
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.portfolio_projects add column if not exists cover_path text;

alter table public.admin_users enable row level security;
alter table public.portfolio_projects enable row level security;

create policy "Admins can read their own access row"
on public.admin_users for select to authenticated
using (user_id = (select auth.uid()));

create policy "Published projects are public"
on public.portfolio_projects for select to anon, authenticated
using (published or exists (
  select 1 from public.admin_users
  where admin_users.user_id = (select auth.uid())
));

create policy "Admins can add projects"
on public.portfolio_projects for insert to authenticated
with check (exists (
  select 1 from public.admin_users
  where admin_users.user_id = (select auth.uid())
));

create policy "Admins can edit projects"
on public.portfolio_projects for update to authenticated
using (exists (
  select 1 from public.admin_users
  where admin_users.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.admin_users
  where admin_users.user_id = (select auth.uid())
));

create policy "Admins can delete projects"
on public.portfolio_projects for delete to authenticated
using (exists (
  select 1 from public.admin_users
  where admin_users.user_id = (select auth.uid())
));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-media',
  'portfolio-media',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Portfolio media is public to view"
on storage.objects for select to anon, authenticated
using (bucket_id = 'portfolio-media');

create policy "Admins can upload portfolio media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'portfolio-media'
  and exists (select 1 from public.admin_users where user_id = (select auth.uid()))
);

create policy "Admins can update portfolio media"
on storage.objects for update to authenticated
using (
  bucket_id = 'portfolio-media'
  and exists (select 1 from public.admin_users where user_id = (select auth.uid()))
)
with check (
  bucket_id = 'portfolio-media'
  and exists (select 1 from public.admin_users where user_id = (select auth.uid()))
);

create policy "Admins can delete portfolio media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'portfolio-media'
  and exists (select 1 from public.admin_users where user_id = (select auth.uid()))
);
