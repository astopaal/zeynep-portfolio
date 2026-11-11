alter table public.portfolio_projects
drop constraint if exists portfolio_projects_category_check;

update public.portfolio_projects
set category = 'Grafik tasarım'
where category = 'Basılı işler';

alter table public.portfolio_projects
add constraint portfolio_projects_category_check
check (category in (
  'Grafik tasarım',
  'Ambalaj',
  'Sosyal medya',
  'Marka kimliği',
  'Web tasarımı',
  'UI/UX tasarımı',
  'Reklam tasarımı',
  'Video / motion'
));
