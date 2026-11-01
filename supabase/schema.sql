-- Houdli — schéma admin
-- À coller dans Supabase → SQL Editor → Run.
-- Lecture publique du contenu publié. Écriture réservée aux profils role = admin.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  phone_display text,
  whatsapp_phone text,
  email text,
  instagram_url text,
  facebook_url text,
  linkedin_url text,
  seo_title text,
  seo_description text,
  seo_keywords text,
  og_image_url text,
  geo_summary text,
  geo_service_area text,
  geo_llms_txt text,
  updated_at timestamptz not null default now()
);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  email text not null,
  phone text,
  service text,
  message text,
  status text not null default 'new' check (status in ('new', 'in_progress', 'done', 'archived', 'spam')),
  spam_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.client_logos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text not null,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  alt text,
  image_url text not null,
  category text not null check (category in ('Team Building', 'Événementiel', 'Communication', 'Stands')),
  ratio text not null default 'landscape' check (ratio in ('landscape', 'portrait', 'square')),
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null,
  content text not null,
  cover_url text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
create index if not exists faqs_sort_idx on public.faqs (sort_order);
create index if not exists client_logos_sort_idx on public.client_logos (sort_order);
create index if not exists gallery_items_sort_idx on public.gallery_items (sort_order);
create index if not exists posts_published_idx on public.posts (published, created_at desc);

insert into public.site_settings (id, phone_display, whatsapp_phone, email, instagram_url, facebook_url, linkedin_url, geo_service_area)
values (
  1,
  '06 61 68 59 01',
  '212661685901',
  'contact@houdli.ma',
  'https://www.instagram.com/houdli',
  'https://www.facebook.com/houdli',
  'https://www.linkedin.com/company/houdli',
  'Casablanca — tout le Maroc'
)
on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Jamais admin d'office : le rôle admin se donne à la main (voir GUIDE.md).
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.inquiries enable row level security;
alter table public.faqs enable row level security;
alter table public.client_logos enable row level security;
alter table public.gallery_items enable row level security;
alter table public.posts enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists settings_read on public.site_settings;
create policy settings_read on public.site_settings
  for select using (true);

drop policy if exists settings_write on public.site_settings;
create policy settings_write on public.site_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Les demandes passent uniquement par /api/contact (clé secrète côté serveur).
drop policy if exists inquiries_insert on public.inquiries;

drop policy if exists inquiries_admin on public.inquiries;
create policy inquiries_admin on public.inquiries
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists faqs_read on public.faqs;
create policy faqs_read on public.faqs
  for select using (published = true or public.is_admin());

drop policy if exists faqs_write on public.faqs;
create policy faqs_write on public.faqs
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists logos_read on public.client_logos;
create policy logos_read on public.client_logos
  for select using (published = true or public.is_admin());

drop policy if exists logos_write on public.client_logos;
create policy logos_write on public.client_logos
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists gallery_read on public.gallery_items;
create policy gallery_read on public.gallery_items
  for select using (published = true or public.is_admin());

drop policy if exists gallery_write on public.gallery_items;
create policy gallery_write on public.gallery_items
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts
  for select using (published = true or public.is_admin());

drop policy if exists posts_write on public.posts;
create policy posts_write on public.posts
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.site_settings, public.faqs, public.client_logos, public.gallery_items, public.posts to anon, authenticated;
revoke insert on public.inquiries from anon;
grant select, insert, update, delete on public.inquiries, public.faqs, public.client_logos, public.gallery_items, public.posts, public.site_settings to authenticated;
revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists media_public_read on storage.objects;
create policy media_public_read on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists media_admin_insert on storage.objects;
create policy media_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists media_admin_update on storage.objects;
create policy media_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists media_admin_delete on storage.objects;
create policy media_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
