"use client";

import { AppErrorView } from "@/components/common/app-error-view";
import "@/styles/globals.css";
import { htmlLang } from "@/lib/i18n";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang={htmlLang()}>
      <body>
        <AppErrorView error={error} reset={reset} source="global-error" />
      </body>
    </html>
  );
}
