import { sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { UI_LANGUAGE } from "@/lib/i18n";

/** SQL full-name expression in the UI language's order (see personName in lib/i18n). */
export function sqlPersonName(first: AnyPgColumn, last: AnyPgColumn): SQL {
  return UI_LANGUAGE === "ja"
    ? sql`concat_ws(' ', ${last}, ${first})`
    : sql`concat_ws(' ', ${first}, ${last})`;
}
