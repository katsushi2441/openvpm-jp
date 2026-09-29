/**
 * UI message catalog (see docs/I18N.md).
 *
 * - English is the canonical source language: the English text itself is the
 *   message id, so untranslated or missing messages render exactly as before.
 * - The UI language is chosen per deployment with NEXT_PUBLIC_OPENVPM_LANGUAGE
 *   (default "en"). It is independent of the clinic's country, currency and
 *   formatting locale.
 * - Catalogs contain user-facing text only — no tax, legal or clinical rules.
 */
import ja from "./messages/ja.json";

type Catalog = Record<string, string>;

const CATALOGS: Record<string, Catalog> = {
  ja: ja as Catalog,
};

export const UI_LANGUAGE = (process.env.NEXT_PUBLIC_OPENVPM_LANGUAGE ?? "en")
  .trim()
  .toLowerCase();

/** BCP 47 tag for <html lang>. */
export function htmlLang(): string {
  return CATALOGS[UI_LANGUAGE] ? UI_LANGUAGE : "en";
}

/**
 * Locale for dates, times and numbers shown in the UI. Follows the UI language
 * so a Japanese UI does not mix in US-formatted dates ("Sep 29, 2026").
 */
export function uiLocale(): string {
  return UI_LANGUAGE === "ja" ? "ja-JP" : "en-US";
}

/**
 * Translate a UI message. `{name}` placeholders are filled from `vars`.
 * Falls back to the English message when no translation exists.
 */
export function tx(message: string, vars?: Record<string, string | number>): string {
  const catalog = CATALOGS[UI_LANGUAGE];
  // An explicitly empty translation is allowed (e.g. the English plural suffix "s" has no Japanese equivalent).
  const translated = catalog && Object.prototype.hasOwnProperty.call(catalog, message) ? catalog[message] : undefined;
  let out = translated !== undefined ? translated : message;
  if (vars) {
    out = out.replace(/\{(\w+)\}/g, (whole, key: string) =>
      Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : whole,
    );
  }
  return out;
}

/**
 * Translate a value that is displayed as-is but may not be a string
 * (e.g. `{tab.label}` from an `as const` array, or a status value).
 * Non-strings are returned unchanged.
 */
export function txv<T>(value: T): T | string {
  return typeof value === "string" ? tx(value) : value;
}
