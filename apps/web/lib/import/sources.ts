import { tx } from "@/lib/i18n";
/**
 * Migration source presets: where a clinic's data is coming from and how
 * to get it out of that system. The importers themselves are source
 * agnostic (header aliases + value normalization in lib/csv/import.ts);
 * these presets exist so the UI and docs can meet people where they are.
 * Voice: fourth grade, no em dashes.
 */

export type MigrationSourcePresetId =
  | "avimark"
  | "cornerstone"
  | "ezyvet"
  | "shepherd"
  | "other";

export interface MigrationSource {
  id: MigrationSourcePresetId;
  name: string;
  /** How to get CSV exports out of that system, in one breath. */
  exportHint: string;
}

export const MIGRATION_SOURCES: MigrationSource[] = [
  {
    id: "avimark",
    name: "AVImark",
    exportHint:
      tx("In AVImark, use Information Search to pull Clients and Patients, then choose Results, then Export and save as CSV. Your Covetrus rep can also send full exports."),
  },
  {
    id: "cornerstone",
    name: "Cornerstone",
    exportHint:
      tx("In Cornerstone, run the Client and Patient reports under Reports, then save or print each one to CSV. IDEXX support can also pull full exports for you."),
  },
  {
    id: "ezyvet",
    name: "ezyVet",
    exportHint:
      tx("In ezyVet, open the Records dashboard, search Contacts and Animals, and use Export to download CSV files."),
  },
  {
    id: "shepherd",
    name: "Shepherd",
    exportHint:
      tx("In Shepherd, use Reports to export your client and patient lists as CSV. For your full records, ask Shepherd support for your data export. Shepherd is cloud based, so support sends the files."),
  },
  {
    id: "other",
    name: tx("Another system or spreadsheet"),
    exportHint:
      tx("Use a CSV with the columns shown below. The dry run shows exactly what will import before anything is saved."),
  },
];

/**
 * Source IDs namespace external client and patient IDs across staged imports.
 * Keep this in sync with the server input so a resumed custom migration can
 * safely reuse its exact source instead of being collapsed into `other`.
 */
export const MIGRATION_SOURCE_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;

export function isValidMigrationSource(value: unknown): value is string {
  return typeof value === "string" && MIGRATION_SOURCE_PATTERN.test(value);
}

export function migrationSourceName(sourceId: string): string {
  return (
    MIGRATION_SOURCES.find((source) => source.id === sourceId)?.name ??
    `Previous source (${sourceId})`
  );
}

export function migrationSourceExportHint(sourceId: string): string {
  return (
    MIGRATION_SOURCES.find((source) => source.id === sourceId)?.exportHint ??
    "Keep using this exact source for the rest of this migration so saved owner and patient IDs stay linked. Ask OpenVPM support if you need help exporting another file."
  );
}

export type MigrationImportMode =
  | "clients"
  | "patients"
  | "vaccinations"
  | "soapNotes";

export interface MigrationStep {
  mode: MigrationImportMode;
  label: string;
  shortLabel: string;
  columnHint: string;
  placeholder: string;
  unmatchedLabel?: string;
}

/**
 * One shared contract for every migration surface. The order is deliberate:
 * history can only attach safely after owner and patient identities exist.
 */
export const MIGRATION_STEPS: readonly MigrationStep[] = [
  {
    mode: "clients",
    label: tx("Clients (pet owners)"),
    shortLabel: tx("client"),
    columnHint:
      tx("firstName, lastName, plus email or client ID. Optional: phone, address, city, state, zip"),
    placeholder:
      tx("clientId,firstName,lastName,email,phone,address,city,state,zip"),
  },
  {
    mode: "patients",
    label: tx("Patients (pets)"),
    shortLabel: tx("pet"),
    columnHint:
      tx("clientEmail or client ID, name, species. Patient ID is recommended. Optional: breed, sex, dob, color, microchipNumber"),
    placeholder:
      tx("clientId,clientEmail,patientId,name,species,breed,sex,dob,color,microchipNumber"),
    unmatchedLabel: "Missing owners",
  },
  {
    mode: "vaccinations",
    label: tx("Vaccine history"),
    shortLabel: tx("vaccine history"),
    columnHint:
      tx("patient ID, or an owner reference plus patientName; vaccineName and dateGiven. Optional: nextDueDate, lotNumber, manufacturer"),
    placeholder:
      tx("patientId,clientId,clientEmail,patientName,vaccineName,dateGiven,nextDueDate,lotNumber,manufacturer"),
    unmatchedLabel: "Missing pets",
  },
  {
    mode: "soapNotes",
    label: tx("Medical history (visit notes)"),
    shortLabel: tx("medical history"),
    columnHint:
      tx("patient ID, or an owner reference plus patientName; date, and either subjective, objective, assessment, plan or a single notes column"),
    placeholder:
      tx("patientId,clientId,clientEmail,patientName,date,subjective,objective,assessment,plan"),
    unmatchedLabel: "Missing pets",
  },
];
