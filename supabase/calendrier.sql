-- Houdli — calendrier de l'admin (événements, rendez-vous, montages).
-- À exécuter une seule fois dans Supabase → SQL Editor → Run, après crm-devis-factures.sql.
-- Les relances CRM et les échéances des devis et factures s'affichent sans table supplémentaire.

begin;

create table if not exists public.agenda_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null default 'event' check (kind in ('event', 'meeting', 'setup', 'other')),
  starts_on date not null,
  ends_on date,
  start_time time,
  end_time time,
  location text,
  client_id uuid references public.clients (id) on delete set null,
  document_id uuid references public.documents (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  constraint agenda_items_dates_check check (ends_on is null or ends_on >= starts_on)
);

create index if not exists agenda_items_starts_idx on public.agenda_items (starts_on);
create index if not exists agenda_items_client_idx on public.agenda_items (client_id);
create index if not exists agenda_items_document_idx on public.agenda_items (document_id);
create index if not exists clients_follow_up_idx on public.clients (follow_up_at);
create index if not exists documents_due_idx on public.documents (due_date);

alter table public.agenda_items enable row level security;

drop policy if exists agenda_items_admin on public.agenda_items;
create policy agenda_items_admin on public.agenda_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.agenda_items from anon;
grant select, insert, update, delete on public.agenda_items to authenticated;

commit;

select count(*) as entrees_calendrier from public.agenda_items;
