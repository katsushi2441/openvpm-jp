/**
 * Many UI tests read component source and assert the English copy verbatim
 * (e.g. `label="Clinic country"`). With the message catalog, that copy is
 * written as `label={tx("Clinic country")}`. When a test reads a .tsx file,
 * unwrap the catalog calls back to the literal English so those assertions
 * keep checking the same copy. Runtime behavior is not affected.
 */
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";

const CALL = String.raw`(?:tx|txUi)\(("(?:[^"\\]|\\.)*")\)`;

export function unwrapCatalogCalls(source: string): string {
  return source
    .replace(new RegExp(String.raw`=\{` + CALL + String.raw`\}`, "g"), (_m, lit: string) => `=${lit}`)
    .replace(new RegExp(String.raw`\{" "\}\{` + CALL + String.raw`\}\{" "\}`, "g"), (_m, lit: string) => ` ${JSON.parse(lit)} `)
    .replace(new RegExp(String.raw`\{" "\}\{` + CALL + String.raw`\}`, "g"), (_m, lit: string) => ` ${JSON.parse(lit)}`)
    .replace(new RegExp(String.raw`\{` + CALL + String.raw`\}\{" "\}`, "g"), (_m, lit: string) => `${JSON.parse(lit)} `)
    .replace(new RegExp(String.raw`\{` + CALL + String.raw`\}`, "g"), (_m, lit: string) => JSON.parse(lit))
    .replace(new RegExp(CALL, "g"), (_m, lit: string) => lit)
    .replace(/\btxv\(([\w.?]+)\)/g, "$1")
    .replace(/\$\{personName\(([\w.?]+), ([\w.?]+)\)\}/g, "${$1} ${$2}")
    .replace(/\{personName\(([\w.?]+), ([\w.?]+)\)\}/g, "{$1} {$2}")
    .replace(/\bsqlPersonName\((\w+)\.firstName, \1\.lastName\)/g, "sql`concat_ws(' ', ${$1.firstName}, ${$1.lastName})`");
}

const original = fs.readFileSync;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(fs as any).readFileSync = function patched(this: unknown, file: fs.PathOrFileDescriptor, ...rest: unknown[]) {
  // The Japanese fork keeps the upstream README as README.en.md; README checks read that one.
  const asName = typeof file === "string" ? file : file instanceof URL ? file.pathname : "";
  if (asName.endsWith("README.md")) {
    const en = asName.slice(0, -"README.md".length) + "README.en.md";
    if (fs.existsSync(en)) file = en;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out = (original as any).call(this, file, ...rest);
  const name = typeof file === "string" ? file : file instanceof URL ? file.pathname : "";
  if (typeof out === "string" && /\.(tsx|ts)$/.test(name) && !name.includes("__tests__")) {
    return unwrapCatalogCalls(out);
  }
  return out;
};
syncBuiltinESMExports();
