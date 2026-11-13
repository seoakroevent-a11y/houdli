-- Houd-Li — conversations avec Lina (texte et audio), consultables dans l'admin.
-- À exécuter une seule fois dans Supabase → SQL Editor → Run, après schema.sql.
-- Le site enregistre avec la clé secrète ; seuls les admins peuvent lire et supprimer.
-- Les conversations de plus de 90 jours sont supprimées automatiquement par le site.

begin;

create table if not exists public.lina_conversations (
  id uuid primary key default gen_random_uuid(),
  language text not null check (language in ('fr', 'ar', 'en')),
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null default 0 check (duration_seconds between 0 and 3600),
  page text,
  transcript jsonb not null default '[]'::jsonb,
  audio_path text,
  created_at timestamptz not null default now()
);

create index if not exists lina_conversations_started_idx on public.lina_conversations (started_at desc);

alter table public.lina_conversations enable row level security;

drop policy if exists lina_conversations_admin_read on public.lina_conversations;
create policy lina_conversations_admin_read on public.lina_conversations
  for select to authenticated using (public.is_admin());

drop policy if exists lina_conversations_admin_delete on public.lina_conversations;
create policy lina_conversations_admin_delete on public.lina_conversations
  for delete to authenticated using (public.is_admin());

revoke all on public.lina_conversations from anon;
grant select, delete on public.lina_conversations to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lina-audio', 'lina-audio', false, 3145728, array['audio/webm', 'audio/mp4', 'audio/ogg'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists lina_audio_admin_read on storage.objects;
create policy lina_audio_admin_read on storage.objects
  for select to authenticated
  using (bucket_id = 'lina-audio' and public.is_admin());

drop policy if exists lina_audio_admin_delete on storage.objects;
create policy lina_audio_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'lina-audio' and public.is_admin());

commit;

select count(*) as conversations_lina from public.lina_conversations;
