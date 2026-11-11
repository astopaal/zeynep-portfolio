alter table public.portfolio_project_media
add column if not exists brand_name text not null default 'Diğer işler';

alter table public.portfolio_project_media
add column if not exists media_kind text not null default 'image';

alter table public.portfolio_project_media
add column if not exists title text;

alter table public.portfolio_project_media
drop constraint if exists portfolio_project_media_media_kind_check;

alter table public.portfolio_project_media
add constraint portfolio_project_media_media_kind_check
check (media_kind in ('image', 'pdf', 'video'));
