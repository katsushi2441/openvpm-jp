import type { Metadata } from "next";
import { tx } from "@/lib/i18n";

export const metadata: Metadata = {
  title: tx("Book an appointment"),
  description: tx("Book an appointment online"),
};

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
      <footer className="mt-12 border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-6 text-center text-sm text-gray-400">{tx("Powered by")}{" "}
          <a
            href="https://openvpm.com"
            className="underline-offset-2 hover:text-gray-600 hover:underline"
          >{tx("OpenVPM")}</a>
          <span className="mx-2" aria-hidden="true">
            ·
          </span>
          <a
            href="/legal/privacy"
            className="underline-offset-2 hover:text-gray-600 hover:underline"
          >{tx("Privacy")}</a>
        </div>
      </footer>
    </div>
  );
}
