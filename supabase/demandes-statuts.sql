-- Statuts des demandes : Nouveau, En cours, Traité, Archivé, Indésirable.
-- À exécuter une seule fois dans Supabase → SQL Editor.

begin;

alter table public.inquiries drop constraint if exists inquiries_status_check;

update public.inquiries set status = 'done' where status = 'read';

alter table public.inquiries
  add constraint inquiries_status_check check (status in ('new', 'in_progress', 'done', 'archived', 'spam'));

-- Raison donnée par le filtre anti-spam, visible dans l'onglet « Indésirables ».
alter table public.inquiries add column if not exists spam_reason text;

commit;

select status, count(*) from public.inquiries group by status order by status;
