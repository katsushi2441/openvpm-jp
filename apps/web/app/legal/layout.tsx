import Link from "next/link";
import type { Metadata } from "next";
import { tx } from "@/lib/i18n";

export const metadata: Metadata = {
  title: tx("Legal - OpenVPM"),
  description: tx("OpenVPM terms of service and privacy policy"),
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-heading text-lg font-semibold">{tx("OpenVPM")}</Link>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/legal/terms" className="hover:text-foreground">{tx("Terms")}</Link>
            <Link href="/legal/privacy" className="hover:text-foreground">{tx("Privacy")}</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <article className="space-y-6 text-sm leading-6 text-foreground [&_h1]:font-heading [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:mt-8 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
          {children}
        </article>
      </main>
    </div>
  );
}
