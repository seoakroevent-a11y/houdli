import Link from "next/link";
import { WhatsappIcon } from "@/components/icons/Brand";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { Flash } from "@/components/admin/Flash";
import { InquiryActions } from "@/components/admin/InquiryActions";
import { InquiryDialog, type InquiryView } from "@/components/admin/InquiryDialog";
import { InquiryStatusSelect } from "@/components/admin/InquiryStatusSelect";
import { PageHeader } from "@/components/admin/PageHeader";
import { ghostButton, whatsappButton } from "@/components/admin/styles";
import {
  formatInquiryDate,
  inquiryStatuses,
  inquiryTabLabels,
  isInquiryStatus,
  toInquiryStatus,
  whatsappNumber,
} from "@/lib/admin/inquiries";
import { deleteInquiry } from "@/lib/admin/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const instant = false;

type InquiryRow = {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  service: string | null;
  message: string | null;
  status: string;
  spam_reason?: string | null;
  created_at: string;
};

type Supabase = NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>;

/** `spam_reason` n'existe qu'après `supabase/demandes-statuts.sql` : sans elle, on relit sans la colonne. */
async function loadInquiries(supabase: Supabase): Promise<InquiryRow[]> {
  const full = await supabase
    .from("inquiries")
    .select("id,name,company,email,phone,service,message,status,spam_reason,created_at")
    .order("created_at", { ascending: false });
  if (!full.error) return full.data ?? [];
  const basic = await supabase
    .from("inquiries")
    .select("id,name,company,email,phone,service,message,status,created_at")
    .order("created_at", { ascending: false });
  return basic.data ?? [];
}

function toView(row: InquiryRow): InquiryView {
  const firstName = row.name.trim().split(/\s+/)[0] ?? "";
  const subject = row.service ? ` (${row.service})` : "";
  const greeting = `Bonjour ${firstName}, ici l'équipe Houdli. Nous revenons vers vous suite à votre demande de devis${subject}.`;
  const number = whatsappNumber(row.phone);
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    email: row.email,
    phone: row.phone,
    service: row.service,
    message: row.message,
    status: toInquiryStatus(row.status),
    spamReason: row.spam_reason ?? null,
    date: formatInquiryDate(row.created_at),
    whatsappHref: number ? `https://wa.me/${number}?text=${encodeURIComponent(greeting)}` : null,
    mailHref: `mailto:${row.email}?subject=${encodeURIComponent(`Votre demande de devis${subject} — Houdli`)}`,
  };
}

const tabClass = "rounded-md border px-3.5 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] transition";

export default async function DemandesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; statut?: string }>;
}) {
  const query = await searchParams;
  const filter = query.statut && isInquiryStatus(query.statut) ? query.statut : "";
  const supabase = await createServerSupabase();
  const items = (supabase ? await loadInquiries(supabase) : []).map(toView);
  const count = (status: string) => items.filter((item) => item.status === status).length;
  const all = items.filter((item) => item.status !== "spam");
  const rows = filter ? items.filter((item) => item.status === filter) : all;
  const fresh = count("new");
  const tabs = [{ value: "", label: "Tous", total: all.length }, ...inquiryStatuses.map((value) => ({ value, label: inquiryTabLabels[value], total: count(value) }))];

  return (
    <>
      <PageHeader
        title="Demandes de devis"
        text={
          <>
            {all.length} demande{all.length > 1 ? "s" : ""} au total
            {fresh ? <span className="text-[#8FB2F5]"> · {fresh} nouvelle{fresh > 1 ? "s" : ""}</span> : null}
          </>
        }
      />
      <Flash ok={query.ok} error={query.error} />

      <nav aria-label="Filtrer les demandes" className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = tab.value === filter;
          return (
            <Link
              key={tab.value || "all"}
              href={tab.value ? `/admin/demandes?statut=${tab.value}` : "/admin/demandes"}
              aria-current={active ? "page" : undefined}
              className={cn(
                tabClass,
                active ? "border-[#4A82EA] bg-[#2d66d2]/20 text-white" : "border-white/10 text-white/60 hover:border-white/30 hover:text-white",
              )}
            >
              {tab.label}
              <span className={active ? "text-[#8FB2F5]" : "text-white/40"}>({tab.total})</span>
            </Link>
          );
        })}
      </nav>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#111111]">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-white/10 text-[0.65rem] uppercase tracking-[0.16em] text-white/45">
            <tr>
              <th className="px-5 py-4 font-medium">Date</th>
              <th className="px-5 py-4 font-medium">Nom</th>
              <th className="px-5 py-4 font-medium">Entreprise</th>
              <th className="px-5 py-4 font-medium">Service</th>
              <th className="px-5 py-4 font-medium">Statut</th>
              <th className="px-5 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-white/50">
                  {filter ? "Aucune demande avec ce statut." : "Aucune demande pour le moment."}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-white/10 transition last:border-0 hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-5 py-5 text-white/75">{row.date}</td>
                  <td className="px-5 py-5">
                    <p className="font-medium text-white">{row.name}</p>
                    <p className="mt-0.5 break-all text-xs text-white/55">{row.email}</p>
                    {row.phone ? <p className="text-xs text-white/55">{row.phone}</p> : null}
                  </td>
                  <td className="px-5 py-5 text-white/75">{row.company || "—"}</td>
                  <td className="max-w-[11rem] px-5 py-5 text-white/75">{row.service || "—"}</td>
                  <td className="px-5 py-5">
                    <InquiryStatusSelect key={row.status} id={row.id} status={row.status} back={filter} />
                  </td>
                  <td className="px-5 py-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <InquiryDialog inquiry={row} back={filter} />
                      {row.whatsappHref ? (
                        <a href={row.whatsappHref} target="_blank" rel="noopener noreferrer" className={whatsappButton}>
                          <WhatsappIcon size={14} />
                          Contacter
                        </a>
                      ) : (
                        <span className={cn(ghostButton, "cursor-not-allowed opacity-50")}>Pas de numéro</span>
                      )}
                    </div>
                    <InquiryActions id={row.id} className="mt-2" />
                    <div className="mt-2">
                      <form action={deleteInquiry}>
                        <input type="hidden" name="id" value={row.id} />
                        <ConfirmSubmit label={`Supprimer la demande de ${row.name} ?`} />
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
