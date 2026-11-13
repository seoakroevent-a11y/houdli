"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AudioLines, Award, CalendarDays, CircleHelp, FileSignature, ImageIcon, Inbox, LayoutDashboard, LogOut, Menu, Newspaper, Receipt, Settings, Users, X } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { signOut } from "@/lib/admin/session";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/demandes", label: "Demandes", icon: Inbox },
  { href: "/admin/conversations", label: "Conversations Lina", icon: AudioLines },
  { href: "/admin/crm", label: "CRM", icon: Users },
  { href: "/admin/devis", label: "Devis", icon: FileSignature },
  { href: "/admin/factures", label: "Factures", icon: Receipt },
  { href: "/admin/calendrier", label: "Calendrier", icon: CalendarDays },
  { href: "/admin/faq", label: "FAQ", icon: CircleHelp },
  { href: "/admin/references", label: "Références", icon: Award },
  { href: "/admin/galerie", label: "Galerie", icon: ImageIcon },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
];

function AdminNavigation({ email, onNavigate }: { email: string; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-dvh flex-col border-r border-white/10 bg-[#111111] px-4 py-6">
      <div className="px-2">
        <Logo tone="light" height={42} eager />
        <p className="mt-4 font-display text-xs font-bold uppercase tracking-[0.22em] text-white/70">Administration</p>
      </div>
      <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Administration">
        {links.map((link) => {
          const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                active ? "bg-[#2d66d2] text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon size={16} aria-hidden="true" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 border-t border-white/10 pt-4">
        <p className="truncate px-2 text-xs text-white/50" title={email}>
          {email}
        </p>
        <form action={signOut} className="mt-3">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut size={16} aria-hidden="true" />
            Déconnexion
          </button>
        </form>
      </div>
    </aside>
  );
}

export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-[#0A0A0A] text-white">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#0A0A0A] px-4 py-3 lg:hidden">
        <Logo tone="light" height={36} eager />
        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      <div className="lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <AdminNavigation email={email} />
        </div>
        {open ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button type="button" aria-label="Fermer le menu" className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
            <div className="relative h-full w-[min(100%,18rem)]">
              <AdminNavigation email={email} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        ) : null}
        <div className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </div>
    </div>
  );
}
