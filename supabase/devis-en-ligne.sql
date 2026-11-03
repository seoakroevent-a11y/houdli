-- Houdli — lien de devis en ligne : le client consulte son devis et l'accepte.
-- À exécuter une seule fois dans Supabase → SQL Editor → Run, après crm-devis-factures.sql.
-- Le client n'a accès qu'au devis dont il a le lien secret, au travers des deux fonctions ci-dessous.

begin;

alter table public.documents add column if not exists public_token uuid not null default gen_random_uuid();
alter table public.documents add column if not exists accepted_at timestamptz;
alter table public.documents add column if not exists accepted_by text;
create unique index if not exists documents_public_token_idx on public.documents (public_token);

-- Contenu affichable d'un devis : rien d'autre que ce qui figure sur le PDF.
create or replace function public.public_quote(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'number', d.number,
    'status', d.status,
    'subject', d.subject,
    'issue_date', d.issue_date,
    'due_date', d.due_date,
    'tva_rate', d.tva_rate,
    'discount_rate', d.discount_rate,
    'notes', d.notes,
    'terms', d.terms,
    'accepted_at', d.accepted_at,
    'accepted_by', d.accepted_by,
    'client', jsonb_build_object('name', c.name, 'company', c.company, 'address', c.address, 'city', c.city, 'ice', c.ice),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('description', i.description, 'unit', i.unit, 'quantity', i.quantity, 'unit_price', i.unit_price) order by i.position)
      from public.document_items i where i.document_id = d.id
    ), '[]'::jsonb),
    'billing', (
      select jsonb_build_object('legal_name', b.legal_name, 'address', b.address, 'city', b.city, 'phone', b.phone, 'email', b.email,
        'ice', b.ice, 'rc', b.rc, 'if_number', b.if_number, 'patente', b.patente, 'cnss', b.cnss, 'bank_name', b.bank_name, 'rib', b.rib)
      from public.billing_settings b where b.id = 1
    )
  )
  from public.documents d
  join public.clients c on c.id = d.client_id
  where d.public_token = p_token and d.kind = 'quote';
$$;

-- Acceptation en ligne. Renvoie : accepted, already, expired, closed ou not_found.
create or replace function public.accept_quote(p_token uuid, p_name text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  doc public.documents;
  signer text := left(btrim(coalesce(p_name, '')), 120);
begin
  if length(signer) < 2 then
    raise exception 'name required';
  end if;
  select * into doc from public.documents where public_token = p_token and kind = 'quote' for update;
  if not found then
    return 'not_found';
  end if;
  if doc.status = 'accepted' then
    return 'already';
  end if;
  if doc.status not in ('draft', 'sent') then
    return 'closed';
  end if;
  if doc.due_date is not null and doc.due_date < (now() at time zone 'Africa/Casablanca')::date then
    return 'expired';
  end if;

  update public.documents
    set status = 'accepted', accepted_at = now(), accepted_by = signer, updated_at = now()
    where id = doc.id;
  insert into public.client_activities (client_id, kind, content)
    values (doc.client_id, 'note', 'Devis ' || doc.number || ' accepté en ligne par ' || signer || '.');
  update public.clients set status = 'won', updated_at = now() where id = doc.client_id and status in ('lead', 'negotiation');
  return 'accepted';
end;
$$;

revoke all on function public.public_quote(uuid) from public;
revoke all on function public.accept_quote(uuid, text) from public;
grant execute on function public.public_quote(uuid) to anon, authenticated;
grant execute on function public.accept_quote(uuid, text) to anon, authenticated;

commit;

select count(*) as devis_avec_lien from public.documents where kind = 'quote';
