create table if not exists public.portfolio_project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.portfolio_projects(id) on delete cascade,
  file_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.portfolio_project_media enable row level security;

create policy "Project media is public for published projects"
on public.portfolio_project_media for select to anon, authenticated
using (exists (
  select 1 from public.portfolio_projects
  where portfolio_projects.id = project_id
  and (portfolio_projects.published or exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  ))
));

create policy "Admins can add project media"
on public.portfolio_project_media for insert to authenticated
with check (exists (
  select 1 from public.admin_users where user_id = (select auth.uid())
));

create policy "Admins can delete project media"
on public.portfolio_project_media for delete to authenticated
using (exists (
  select 1 from public.admin_users where user_id = (select auth.uid())
));
