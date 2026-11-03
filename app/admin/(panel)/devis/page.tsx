import { DocumentsPage } from "@/components/admin/billing/DocumentsPage";

export const instant = false;

export default function DevisPage({ searchParams }: { searchParams: Promise<{ id?: string; client?: string; statut?: string; ok?: string; error?: string }> }) {
  return <DocumentsPage kind="quote" searchParams={searchParams} />;
}
