/**
 * Value normalizers for migration imports. Real PIMS exports (AVImark,
 * Cornerstone, ezyVet, spreadsheets) spell species, sex, and dates a dozen
 * ways; these map the common spellings onto OpenVPM's enums and ISO dates
 * so clinics do not have to hand-edit their files. Pure — no I/O.
 */

import type { PatientSpecies } from "@/lib/patients/species";

export type NormalizedSpecies = PatientSpecies;

const SPECIES_ALIASES: Record<string, NormalizedSpecies> = {
  canine: "canine",
  dog: "canine",
  puppy: "canine",
  k9: "canine",
  feline: "feline",
  cat: "feline",
  kitten: "feline",
  avian: "avian",
  bird: "avian",
  parrot: "avian",
  parakeet: "avian",
  cockatiel: "avian",
  chicken: "poultry",
  rabbit: "rabbit",
  bunny: "rabbit",
  lagomorph: "rabbit",
  reptile: "reptile",
  lizard: "reptile",
  snake: "reptile",
  turtle: "reptile",
  tortoise: "reptile",
  gecko: "reptile",
  iguana: "reptile",
  "bearded dragon": "reptile",
  equine: "equine",
  horse: "equine",
  pony: "equine",
  donkey: "equine",
  mule: "equine",
  bovine: "bovine",
  cow: "bovine",
  cattle: "bovine",
  calf: "bovine",
  ovine: "ovine",
  sheep: "ovine",
  lamb: "ovine",
  caprine: "caprine",
  goat: "caprine",
  kid: "caprine",
  porcine: "porcine",
  pig: "porcine",
  swine: "porcine",
  poultry: "poultry",
  hen: "poultry",
  rooster: "poultry",
  turkey: "poultry",
  duck: "poultry",
  camelid: "camelid",
  alpaca: "camelid",
  llama: "camelid",
  other: "other",
  exotic: "other",
  "pocket pet": "other",
  ferret: "other",
  "guinea pig": "other",
  hamster: "other",
  rat: "other",
  mouse: "other",
  hedgehog: "other",
  chinchilla: "other",
};

// Japanese species names used on paper charts and spreadsheets in Japan.
const JA_SPECIES_ALIASES: Record<string, NormalizedSpecies> = {
  犬: "canine", いぬ: "canine", イヌ: "canine", 子犬: "canine",
  猫: "feline", ねこ: "feline", ネコ: "feline", 子猫: "feline",
  鳥: "avian", とり: "avian", トリ: "avian", 小鳥: "avian", インコ: "avian", 文鳥: "avian", オウム: "avian",
  ウサギ: "rabbit", うさぎ: "rabbit", 兎: "rabbit",
  爬虫類: "reptile", カメ: "reptile", 亀: "reptile", トカゲ: "reptile", ヘビ: "reptile", 蛇: "reptile",
  馬: "equine", 牛: "bovine", 羊: "ovine", ヤギ: "caprine", 山羊: "caprine", 豚: "porcine", ブタ: "porcine",
  鶏: "poultry", ニワトリ: "poultry",
  フェレット: "other", ハムスター: "other", モルモット: "other", チンチラ: "other", ハリネズミ: "other",
  その他: "other",
};

/** Map a source species value onto our enum, or null when unrecognized. */
export function normalizeSpeciesValue(
  value: string | undefined,
): NormalizedSpecies | null {
  const v = value?.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
  if (!v) return null;
  return SPECIES_ALIASES[v] ?? JA_SPECIES_ALIASES[v] ?? null;
}

export type NormalizedSex =
  | "male"
  | "female"
  | "male_neutered"
  | "female_spayed";

const SEX_ALIASES: Record<string, NormalizedSex> = {
  male: "male",
  m: "male",
  "male intact": "male",
  "intact male": "male",
  female: "female",
  f: "female",
  "female intact": "female",
  "intact female": "female",
  male_neutered: "male_neutered",
  mn: "male_neutered",
  nm: "male_neutered",
  neutered: "male_neutered",
  "neutered male": "male_neutered",
  "male neutered": "male_neutered",
  castrated: "male_neutered",
  "castrated male": "male_neutered",
  female_spayed: "female_spayed",
  fs: "female_spayed",
  sf: "female_spayed",
  spayed: "female_spayed",
  "spayed female": "female_spayed",
  "female spayed": "female_spayed",
};

// Japanese sex notation: オス/メス, with 去勢/避妊 for neutered/spayed.
const JA_SEX_ALIASES: Record<string, NormalizedSex> = {
  オス: "male", 雄: "male", おす: "male", "♂": "male",
  メス: "female", 雌: "female", めす: "female", "♀": "female",
  去勢オス: "male_neutered", オス去勢: "male_neutered", オス去勢済み: "male_neutered", 去勢済みオス: "male_neutered",
  去勢: "male_neutered", 去勢済み: "male_neutered", 雄去勢: "male_neutered",
  避妊メス: "female_spayed", メス避妊: "female_spayed", メス避妊済み: "female_spayed", 避妊済みメス: "female_spayed",
  避妊: "female_spayed", 避妊済み: "female_spayed", 雌避妊: "female_spayed",
};

/** Map a source sex value onto our enum, or undefined when unrecognized. */
export function normalizeSexValue(
  value: string | undefined,
): NormalizedSex | undefined {
  const nfkc = value?.normalize("NFKC");
  const v = nfkc
    ?.trim()
    .toLowerCase()
    .replace(/[\s/-]+/g, " ");
  if (!v) return undefined;
  return SEX_ALIASES[v] ?? JA_SEX_ALIASES[v.replace(/[\s()（）・]/g, "")];
}

export type NormalizedPatientStatus = "active" | "inactive" | "deceased";

const PATIENT_STATUS_ALIASES: Record<string, NormalizedPatientStatus> = {
  active: "active",
  current: "active",
  inactive: "inactive",
  archived: "inactive",
  deceased: "deceased",
  dead: "deceased",
};

/** Map source chart status without ever turning an unknown status active. */
export function normalizePatientStatusValue(
  value: string | undefined,
): NormalizedPatientStatus | undefined {
  const normalized = value
    ?.trim()
    .toLowerCase()
    .replace(/[\s/-]+/g, "_");
  if (!normalized) return undefined;
  return PATIENT_STATUS_ALIASES[normalized];
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function isRealDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

/**
 * Normalize a source date to YYYY-MM-DD. Accepts ISO (2019-03-05) and the
 * US formats PIMS exports actually use: 3/5/2019, 03-05-2019, 3.5.19.
 * Two-digit years resolve to the past (birthdays and history, never the
 * future). Returns null when the value cannot be read as a date.
 */
export function normalizeDateValue(
  value: string | undefined,
  now: Date = new Date(),
): string | null {
  const v = value?.normalize("NFKC").trim();
  if (!v) return null;

  // Japanese spreadsheets write year/month/day: 2019/3/5, 2019.3.5, 2019年3月5日
  const ymd = v.match(/^(\d{4})\s*[/.年]\s*(\d{1,2})\s*[/.月]\s*(\d{1,2})\s*日?$/);
  if (ymd) {
    const year = Number(ymd[1]);
    const month = Number(ymd[2]);
    const day = Number(ymd[3]);
    if (!isRealDate(year, month, day)) return null;
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }
  // Japanese era dates: 令和5年3月5日, 平成31年4月30日, R5.3.5, H31/4/30 (元年 = year 1)
  const era = v.match(/^(令和|平成|昭和|R|H|S)\s*(元|\d{1,2})\s*[年./]\s*(\d{1,2})\s*[月./]\s*(\d{1,2})\s*日?$/i);
  if (era) {
    const base: Record<string, number> = { 令和: 2018, R: 2018, 平成: 1988, H: 1988, 昭和: 1925, S: 1925 };
    const year = base[era[1]!.toUpperCase()]! + (era[2] === "元" ? 1 : Number(era[2]));
    const month = Number(era[3]);
    const day = Number(era[4]);
    if (!isRealDate(year, month, day)) return null;
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  const iso = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/);
  if (iso) {
    const [, y, m, d] = iso;
    const year = Number(y);
    const month = Number(m);
    const day = Number(d);
    if (!isRealDate(year, month, day)) return null;
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  const us = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/);
  if (us) {
    const month = Number(us[1]);
    const day = Number(us[2]);
    let year = Number(us[3]);
    if (us[3]!.length === 2) {
      const century = Math.floor(now.getUTCFullYear() / 100) * 100;
      year += century;
      if (year > now.getUTCFullYear()) year -= 100;
    }
    if (!isRealDate(year, month, day)) return null;
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  return null;
}
