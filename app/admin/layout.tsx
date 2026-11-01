import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { absolute: "Administration | Houdli" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#0A0A0A] font-sans text-white">
      <style>{`html, body { background-color: #0A0A0A !important; color: #ffffff; }`}</style>
      {children}
    </div>
  );
}
