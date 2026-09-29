/**
 * Minimal, dependency-free RFC-4180-ish CSV parser. Handles quoted fields,
 * embedded commas/newlines, and escaped double-quotes (""). Returns the header
 * row plus rows keyed by header. Pure — no I/O.
 */
export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
}

export function parseCsv(text: string): ParsedCsv {
  // Spreadsheet exports commonly include a UTF-8 byte-order mark. Remove it
  // only at the beginning so the first header maps like every other header.
  const s = text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const records: string[][] = [];
  const errors: string[] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;

  while (i < s.length) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\n") {
      row.push(field);
      records.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (inQuotes) {
    return {
      headers: [],
      rows: [],
      errors: ["CSV has an unterminated quoted field."],
    };
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    records.push(row);
  }

  // Drop blank lines (a lone empty field).
  const nonEmpty = records.filter(
    (r) => !(r.length === 1 && r[0].trim() === ""),
  );
  if (nonEmpty.length === 0) return { headers: [], rows: [], errors };

  const headers = nonEmpty[0]!.map((h) => h.trim());
  const normalizedHeaders = new Map<string, string>();
  headers.forEach((header, index) => {
    const normalized = normalizeKey(header);
    if (!normalized) {
      errors.push(`CSV header column ${index + 1} is blank or invalid.`);
      return;
    }

    const prior = normalizedHeaders.get(normalized);
    if (prior) {
      errors.push(
        `CSV has duplicate columns after header normalization: "${prior}" and "${header}". Keep only one of them.`,
      );
      return;
    }
    normalizedHeaders.set(normalized, header);
  });

  nonEmpty.slice(1).forEach((record, index) => {
    // Missing trailing fields are unambiguous and have historically mapped to
    // empty optional values. Extra fields would be silently discarded and can
    // indicate an unquoted comma, so reject the whole file before mapping.
    if (record.length > headers.length) {
      errors.push(
        `Row ${index + 1} has ${record.length} columns; expected at most ${headers.length}. Check for an extra or unquoted comma.`,
      );
    }
  });

  if (errors.length > 0) {
    return { headers, rows: [], errors };
  }

  const rows = nonEmpty.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (r[idx] ?? "").trim();
    });
    return obj;
  });

  return { headers, rows, errors };
}

/** Normalize a header to a comparison key: lowercase, alphanumerics only. */
// Japanese column headers (paper charts typed into a spreadsheet) → the
// normalized English header the importer already understands.
const JA_HEADERS: Record<string, string> = {
  飼い主番号: "clientid", 顧客番号: "clientid", 診察券番号: "clientid",
  姓: "lastname", 苗字: "lastname", 名字: "lastname", 氏: "lastname",
  名: "firstname",
  メール: "email", メールアドレス: "email", eメール: "email",
  電話: "phone", 電話番号: "phone", 携帯: "mobile", 携帯電話: "mobile", 連絡先: "phone",
  住所: "address", 番地: "address", 市区町村: "city", 都道府県: "state", 郵便番号: "zip",
  カルテ番号: "patientid", 患者番号: "patientid", 動物番号: "patientid",
  飼い主メール: "owneremail", 飼い主メールアドレス: "owneremail",
  動物名: "petname", ペット名: "petname", 患者名: "petname", 呼び名: "petname",
  動物種: "species", 種類: "species", 種別: "species", 品種: "breed", 犬種: "breed", 猫種: "breed",
  性別: "sex", 生年月日: "dob", 誕生日: "dob", 毛色: "color", 色: "color",
  マイクロチップ: "microchip", マイクロチップ番号: "microchip", 状態: "status",
  ワクチン: "vaccine", ワクチン名: "vaccinename", 接種日: "dategiven", 次回予定日: "nextduedate",
  次回接種日: "nextduedate", 次回: "nextduedate", ロット番号: "lotnumber", メーカー: "manufacturer",
  来院日: "visitdate", 診察日: "visitdate", 受診日: "visitdate",
  稟告: "subjective", 主訴: "subjective", 所見: "objective", 検査所見: "objective",
  診断: "assessment", 評価: "assessment", 治療: "plan", 処置: "plan", 方針: "plan",
  カルテ内容: "notes", 記録: "notes", メモ: "notes", 備考: "notes",
};

export function normalizeKey(key: string): string {
  const ja = key.normalize("NFKC").replace(/[\s　_・()（）]/g, "");
  if (JA_HEADERS[ja]) return JA_HEADERS[ja];
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Re-key a parsed row by normalized header so "First Name" == "first_name". */
export function normalizeRow(
  row: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    out[normalizeKey(k)] = v;
  }
  return out;
}
