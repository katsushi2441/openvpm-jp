import type { Metadata } from "next";
import { PortalShell } from "@/components/portal/portal-shell";
import { tx } from "@/lib/i18n";

export const metadata: Metadata = {
  title: tx("Pet Portal - OpenVPM"),
  description: tx("View your pet's health information"),
  referrer: "no-referrer",
  robots: { index: false, follow: false, nocache: true },
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalShell>{children}</PortalShell>;
}
