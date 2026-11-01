-- Houdli — correctif de sécurité (à exécuter une fois sur la base existante)
-- Supabase → SQL Editor → coller ce fichier → Run.
-- Avant : tout compte créé (inscription publique comprise) recevait le rôle admin.

begin;

-- 1. Le rôle par défaut devient « user ».
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles alter column role set default 'user';
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'user'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 2. Seul admin@houdli.ma reste admin.
update public.profiles p
set role = 'user'
from auth.users u
where u.id = p.id
  and lower(u.email) <> 'admin@houdli.ma'
  and p.role = 'admin';

-- 3. Personne ne peut modifier son propre profil (donc son rôle).
revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

-- 4. Plus d'écriture directe dans les demandes : uniquement via /api/contact.
drop policy if exists inquiries_insert on public.inquiries;
revoke insert on public.inquiries from anon;

-- 5. Stockage : images PNG, JPG, WEBP de 5 Mo maximum.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'media';

commit;

-- 6. Contrôle : tous les comptes. Supprimez ceux que vous ne connaissez pas
--    (Authentication → Users → … → Delete user).
select u.email, u.created_at, u.email_confirmed_at, p.role
from auth.users u
left join public.profiles p on p.id = u.id
order by u.created_at;
