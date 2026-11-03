import { Suspense } from "react";
import Link from "next/link";
import { DocumentSheet, legalMentions, type SheetData } from "@/components/admin/billing/DocumentSheet";
import { PrintButton } from "@/components/admin/billing/PrintButton";
import { isDocumentKind, kindConfig } from "@/lib/admin/billing";
import { isUuid } from "@/lib/admin/format";
import { db } from "@/lib/admin/form";

export const instant = false;

type Item = SheetData["items"][number] & { position: number };

export default function PrintPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-white/50">Chargement…</p>}>
      <PrintableDocument searchParams={searchParams} />
    </Suspense>
  );
}

async function PrintableDocument({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id = "" } = await searchParams;
  const supabase = await db();
  if (!isUuid(id)) return <p className="p-8 text-sm">Document introuvable.</p>;

  const [{ data: doc }, { data: billing }, { data: acceptance }] = await Promise.all([
    supabase
      .from("documents")
      .select("id,kind,number,subject,issue_date,due_date,tva_rate,discount_rate,notes,terms,clients(name,company,address,city,ice),document_items(description,unit,quantity,unit_price,position)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("billing_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("documents").select("accepted_at,accepted_by").eq("id", id).maybeSingle(),
  ]);
  if (!doc || !isDocumentKind(doc.kind)) return <p className="p-8 text-sm">Document introuvable.</p>;

  const config = kindConfig[doc.kind];
  const sheet: SheetData = {
    ...doc,
    kind: doc.kind,
    client: doc.clients as unknown as SheetData["client"],
    items: [...((doc.document_items ?? []) as Item[])].sort((a, b) => a.position - b.position),
    billing,
    acceptedAt: acceptance?.accepted_at ?? null,
    acceptedBy: acceptance?.accepted_by ?? null,
  };
  const title = `${doc.number}${sheet.client ? ` - ${sheet.client.company || sheet.client.name}` : ""}`;

  return (
    <div className="min-h-dvh bg-[#0A0A0A] px-4 py-8 print:bg-white print:p-0">
      <style>{`@media print { @page { size: A4; margin: 14mm; } html, body { background: #fff !important; } }`}</style>
      <div className="mx-auto mb-6 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`${config.path}?id=${doc.id}`} className="text-sm text-white/60 hover:text-white">
          ← Retour {doc.kind === "quote" ? "au devis" : "à la facture"}
        </Link>
        <PrintButton title={title} />
      </div>
      {legalMentions(billing).length === 0 ? (
        <p className="mx-auto mb-4 max-w-[210mm] rounded-lg border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 print:hidden">
          Les mentions légales (ICE, RC, IF…) ne sont pas encore remplies :{" "}
          <Link href="/admin/parametres/facturation" className="underline">
            complétez-les dans Paramètres → Facturation
          </Link>
          .
        </p>
      ) : null}
      <DocumentSheet doc={sheet} />
    </div>
  );
}
