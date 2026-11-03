-- Houdli — CRM, devis et factures.
-- À exécuter une seule fois dans Supabase → SQL Editor → Run (après schema.sql).
-- Tout est réservé aux profils role = admin : rien n'est lisible depuis le site public.

begin;

-- Mentions légales imprimées sur les devis et factures (une seule ligne).
create table if not exists public.billing_settings (
  id int primary key default 1 check (id = 1),
  legal_name text,
  address text,
  city text,
  phone text,
  email text,
  ice text,
  rc text,
  if_number text,
  patente text,
  cnss text,
  bank_name text,
  rib text,
  quote_terms text,
  invoice_terms text,
  default_tva numeric(5, 2) not null default 20 check (default_tva between 0 and 100),
  updated_at timestamptz not null default now()
);

insert into public.billing_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  email text,
  phone text,
  address text,
  city text,
  ice text,
  status text not null default 'lead' check (status in ('lead', 'negotiation', 'won', 'lost')),
  source text,
  notes text,
  follow_up_at date,
  inquiry_id uuid references public.inquiries (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_activities (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  kind text not null default 'note' check (kind in ('note', 'call', 'email', 'meeting', 'whatsapp')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('quote', 'invoice')),
  number text not null unique,
  client_id uuid not null references public.clients (id) on delete restrict,
  quote_id uuid references public.documents (id) on delete set null,
  status text not null default 'draft',
  subject text,
  issue_date date not null default current_date,
  due_date date,
  tva_rate numeric(5, 2) not null default 20 check (tva_rate between 0 and 100),
  discount_rate numeric(5, 2) not null default 0 check (discount_rate between 0 and 100),
  notes text,
  terms text,
  paid_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint documents_status_check check (
    (kind = 'quote' and status in ('draft', 'sent', 'accepted', 'refused'))
    or (kind = 'invoice' and status in ('draft', 'sent', 'paid', 'cancelled'))
  )
);

create table if not exists public.document_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  position int not null default 0,
  description text not null,
  unit text,
  quantity numeric(12, 2) not null default 1 check (quantity > 0),
  unit_price numeric(12, 2) not null default 0 check (unit_price >= 0)
);

-- Compteur par type et par année : DEV-2026-001, FAC-2026-001…
create table if not exists public.document_counters (
  kind text not null check (kind in ('quote', 'invoice')),
  year int not null,
  last int not null default 0,
  primary key (kind, year)
);

create index if not exists clients_status_idx on public.clients (status, created_at desc);
create index if not exists clients_inquiry_idx on public.clients (inquiry_id);
create index if not exists client_activities_client_idx on public.client_activities (client_id, created_at desc);
create index if not exists documents_client_idx on public.documents (client_id);
create index if not exists documents_kind_idx on public.documents (kind, issue_date desc);
create index if not exists documents_quote_idx on public.documents (quote_id);
create index if not exists document_items_document_idx on public.document_items (document_id, position);

alter table public.billing_settings enable row level security;
alter table public.clients enable row level security;
alter table public.client_activities enable row level security;
alter table public.documents enable row level security;
alter table public.document_items enable row level security;
alter table public.document_counters enable row level security;

drop policy if exists billing_settings_admin on public.billing_settings;
create policy billing_settings_admin on public.billing_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists clients_admin on public.clients;
create policy clients_admin on public.clients
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists client_activities_admin on public.client_activities;
create policy client_activities_admin on public.client_activities
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists documents_admin on public.documents;
create policy documents_admin on public.documents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists document_items_admin on public.document_items;
create policy document_items_admin on public.document_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists document_counters_admin on public.document_counters;
create policy document_counters_admin on public.document_counters
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.billing_settings, public.clients, public.client_activities, public.documents, public.document_items, public.document_counters from anon;
grant select, insert, update, delete on public.billing_settings, public.clients, public.client_activities, public.documents, public.document_items, public.document_counters to authenticated;

-- Enregistre un devis ou une facture et ses lignes en une seule transaction.
-- p_id null : création avec un nouveau numéro. Les lignes existantes sont remplacées.
create or replace function public.save_document(p_id uuid, p_kind text, p_doc jsonb, p_items jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  doc_id uuid := p_id;
  doc_year int := extract(year from coalesce((p_doc ->> 'issue_date')::date, current_date))::int;
  next_number int;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_kind not in ('quote', 'invoice') then
    raise exception 'invalid kind';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'items required';
  end if;

  if doc_id is null then
    insert into public.document_counters (kind, year, last) values (p_kind, doc_year, 1)
    on conflict (kind, year) do update set last = public.document_counters.last + 1
    returning last into next_number;

    insert into public.documents (kind, number, client_id, quote_id, status, subject, issue_date, due_date, tva_rate, discount_rate, notes, terms, paid_at)
    values (
      p_kind,
      (case when p_kind = 'quote' then 'DEV' else 'FAC' end) || '-' || doc_year || '-' || lpad(next_number::text, 3, '0'),
      (p_doc ->> 'client_id')::uuid,
      nullif(p_doc ->> 'quote_id', '')::uuid,
      p_doc ->> 'status',
      nullif(p_doc ->> 'subject', ''),
      (p_doc ->> 'issue_date')::date,
      nullif(p_doc ->> 'due_date', '')::date,
      (p_doc ->> 'tva_rate')::numeric,
      (p_doc ->> 'discount_rate')::numeric,
      nullif(p_doc ->> 'notes', ''),
      nullif(p_doc ->> 'terms', ''),
      nullif(p_doc ->> 'paid_at', '')::date
    )
    returning id into doc_id;
  else
    update public.documents set
      client_id = (p_doc ->> 'client_id')::uuid,
      status = p_doc ->> 'status',
      subject = nullif(p_doc ->> 'subject', ''),
      issue_date = (p_doc ->> 'issue_date')::date,
      due_date = nullif(p_doc ->> 'due_date', '')::date,
      tva_rate = (p_doc ->> 'tva_rate')::numeric,
      discount_rate = (p_doc ->> 'discount_rate')::numeric,
      notes = nullif(p_doc ->> 'notes', ''),
      terms = nullif(p_doc ->> 'terms', ''),
      paid_at = nullif(p_doc ->> 'paid_at', '')::date,
      updated_at = now()
    where id = doc_id and kind = p_kind;
    if not found then
      raise exception 'document not found';
    end if;
    delete from public.document_items where document_id = doc_id;
  end if;

  insert into public.document_items (document_id, position, description, unit, quantity, unit_price)
  select doc_id, item.ordinality::int, item.value ->> 'description', nullif(item.value ->> 'unit', ''),
         (item.value ->> 'quantity')::numeric, (item.value ->> 'unit_price')::numeric
  from jsonb_array_elements(p_items) with ordinality as item;

  return doc_id;
end;
$$;

-- Crée la facture d'un devis (une seule par devis) et marque le devis accepté.
create or replace function public.invoice_from_quote(p_quote uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  quote public.documents;
  invoice_id uuid;
  items jsonb;
  terms text;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into quote from public.documents where id = p_quote and kind = 'quote';
  if not found then
    raise exception 'quote not found';
  end if;
  select id into invoice_id from public.documents where quote_id = p_quote and kind = 'invoice' limit 1;
  if invoice_id is not null then
    return invoice_id;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('description', description, 'unit', unit, 'quantity', quantity, 'unit_price', unit_price) order by position), '[]'::jsonb)
    into items from public.document_items where document_id = p_quote;
  select invoice_terms into terms from public.billing_settings where id = 1;

  invoice_id := public.save_document(null, 'invoice', jsonb_build_object(
    'client_id', quote.client_id,
    'quote_id', quote.id,
    'status', 'draft',
    'subject', quote.subject,
    'issue_date', current_date,
    'due_date', current_date + 30,
    'tva_rate', quote.tva_rate,
    'discount_rate', quote.discount_rate,
    'notes', quote.notes,
    'terms', terms
  ), items);

  update public.documents set status = 'accepted', updated_at = now() where id = p_quote;
  return invoice_id;
end;
$$;

revoke all on function public.save_document(uuid, text, jsonb, jsonb) from public, anon;
revoke all on function public.invoice_from_quote(uuid) from public, anon;
grant execute on function public.save_document(uuid, text, jsonb, jsonb) to authenticated;
grant execute on function public.invoice_from_quote(uuid) to authenticated;

commit;

select 'clients' as tableau, count(*) from public.clients
union all select 'documents', count(*) from public.documents;
