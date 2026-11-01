"use client";

import { createContext, useContext, type ReactNode } from "react";
import { site } from "@/lib/site";
import type { PublicSettings } from "@/lib/public-data";

const fallback: PublicSettings = {
  email: site.contact.email,
  phoneDisplay: site.contact.phoneDisplay,
  phoneHref: site.contact.phoneHref,
  whatsapp: site.contact.whatsapp,
  whatsappMessage: site.contact.whatsappMessage,
  area: site.contact.area,
  areaDetail: site.contact.areaDetail,
  instagram: site.social.instagram,
  facebook: site.social.facebook,
  linkedin: site.social.linkedin,
  handle: site.social.handle,
  llmsTxt: "",
  hasGallery: false,
};

const PublicSettingsContext = createContext<PublicSettings>(fallback);

export function PublicSettingsProvider({ value, children }: { value: PublicSettings; children: ReactNode }) {
  return <PublicSettingsContext.Provider value={value}>{children}</PublicSettingsContext.Provider>;
}

export function usePublicSettings() {
  return useContext(PublicSettingsContext);
}
