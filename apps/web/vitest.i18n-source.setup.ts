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
    .replace(/\btxv\(([\w.?]+)\)/g, "$1");
}

const original = fs.readFileSync;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(fs as any).readFileSync = function patched(this: unknown, file: fs.PathOrFileDescriptor, ...rest: unknown[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out = (original as any).call(this, file, ...rest);
  const name = typeof file === "string" ? file : file instanceof URL ? file.pathname : "";
  if (typeof out === "string" && name.endsWith(".tsx")) {
    return unwrapCatalogCalls(out);
  }
  return out;
};
syncBuiltinESMExports();
