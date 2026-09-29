// 日本語のデモデータ（jp/scripts/make-seed-ja.py で seed.ts から生成。直接編集しない）
import { config } from "dotenv";
config({ path: "../../.env" });
import crypto from "crypto";
import { db } from "./client";
import {
  practices,
  locations,
  users,
  clients,
  patients,
  patientWeights,
  patientAllergies,
  appointmentTypes,
  rooms,
  appointments,
  soapNotes,
  vaccinationRecords,
  prescriptions,
  labResults,
  labResultEvents,
  clinicalRecordCorrections,
  labResultReplacements,
  procedures,
  invoices,
  invoiceItems,
  products,
  services,
  payments,
  communications,
  auditLog,
  controlledSubstanceLog,
  treatmentTemplates,
  treatmentTemplateItems,
} from "./schema/index";

// Pre-hashed bcrypt value for "password123"
const PASSWORD_HASH =
  "$2a$10$1Ui3ssO.fTXmUiyu4B7n0.EWb/M9fGHlZ5mjCXaq.Xqf1OdXwLs/K";

// ---------------------------------------------------------------------------
// Helper: date math
// ---------------------------------------------------------------------------
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function setTime(d: Date, hours: number, minutes: number): Date {
  const copy = new Date(d);
  copy.setHours(hours, minutes, 0, 0);
  return copy;
}

function addMinutes(d: Date, mins: number): Date {
  return new Date(d.getTime() + mins * 60_000);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------
async function seed() {
  console.log("データベースにシード中...\n");

  // =========================================================================
  // 1. Practice
  // =========================================================================
  const [practice] = await db
    .insert(practices)
    .values({
      name: "なごみ動物病院",
      address: "〒000-0000 愛知県名古屋市みなと区ひかり町1-2-3（架空）",
      phone: "052-000-0000",
      email: "hello@neighborhoodvet.example.com",
      website: "https://neighborhoodvet.example.com",
      timezone: "Asia/Tokyo",
      country: "JP",
      currency: "jpy",
      taxRatePercent: "10.00",
      subscriptionTier: "cloud",
      // The demo practice is a fully set-up clinic; the first-run wizard
      // must not greet it like a new signup.
      settings: { onboardingCompletedAt: new Date().toISOString() },
    })
    .returning();
  console.log(`Practice: ${practice!.name} (${practice!.id})`);
  const practiceId = practice!.id;

  // =========================================================================
  // 2. Location
  // =========================================================================
  const [location] = await db
    .insert(locations)
    .values({
      practiceId,
      name: "本院",
      address: "〒000-0000 愛知県名古屋市みなと区ひかり町1-2-3（架空）",
      phone: "052-000-0000",
      isPrimary: true,
    })
    .returning();
  console.log(`Location: ${location!.name}`);
  const locationId = location!.id;

  // =========================================================================
  // 3. Users (7 staff)
  // =========================================================================
  const usersData = [
    {
      email: "admin@neighborhoodvet.example.com",
      name: "病院管理者",
      role: "admin" as const,
      licenseNumber: null,
      phone: "052-000-0000（内線100）",
    },
    {
      email: "sarah.chen@neighborhoodvet.example.com",
      name: "佐藤 美咲 先生",
      role: "veterinarian" as const,
      licenseNumber: "VET-NJ-28491",
      phone: "052-000-0000（内線101）",
    },
    {
      email: "marcus.rivera@neighborhoodvet.example.com",
      name: "高橋 健太 先生",
      role: "veterinarian" as const,
      licenseNumber: "VET-NJ-31057",
      phone: "052-000-0000（内線102）",
    },
    {
      email: "emily.walsh@neighborhoodvet.example.com",
      name: "田中 さくら 先生",
      role: "veterinarian" as const,
      licenseNumber: "VET-NJ-34219",
      phone: "052-000-0000（内線103）",
    },
    {
      email: "jamie.torres@neighborhoodvet.example.com",
      name: "伊藤 陽菜",
      role: "technician" as const,
      licenseNumber: "LVT-NJ-7823",
      phone: "052-000-0000（内線201）",
    },
    {
      email: "alex.kim@neighborhoodvet.example.com",
      name: "渡辺 翔",
      role: "technician" as const,
      licenseNumber: "LVT-NJ-8104",
      phone: "052-000-0000（内線202）",
    },
    {
      email: "morgan.bailey@neighborhoodvet.example.com",
      name: "山本 あおい",
      role: "front_desk" as const,
      licenseNumber: null,
      phone: "052-000-0000（内線301）",
    },
    {
      email: "casey.reed@neighborhoodvet.example.com",
      name: "中村 蓮",
      role: "front_desk" as const,
      licenseNumber: null,
      phone: "052-000-0000（内線302）",
    },
  ];

  const insertedUsers = await db
    .insert(users)
    .values(
      usersData.map((u) => ({
        ...u,
        isVeterinarian: u.role === "veterinarian",
        passwordHash: PASSWORD_HASH,
        practiceId,
        locationId,
      }))
    )
    .returning();
  console.log(`Users: ${insertedUsers.length} created`);

  const vets = insertedUsers.filter((u) => u.role === "veterinarian");
  const techs = insertedUsers.filter((u) => u.role === "technician");

  // =========================================================================
  // 4. Clients (25)
  // =========================================================================
  const clientsData = [
    { firstName: "一郎", lastName: "鈴木", address: "1-1-1", city: "名古屋市みなと区（架空）", state: "愛知県", zip: "000-0000", phone: "090-0000-1001", email: "james.patterson@example.com" },
    { firstName: "恵子", lastName: "田中", address: "2-8-4", city: "名古屋市みどり区（架空）", state: "愛知県", zip: "000-0001", phone: "090-0000-1002", email: "maria.gonzalez@example.com" },
    { firstName: "誠", lastName: "佐藤", address: "3-15-7", city: "名古屋市あおい区（架空）", state: "愛知県", zip: "000-0002", phone: "090-0000-1003", email: "robert.thompson@example.com" },
    { firstName: "由美", lastName: "小林", address: "4-2-1", city: "名古屋市さくら区（架空）", state: "愛知県", zip: "000-0003", phone: "090-0000-1004", email: "jennifer.obrien@example.com" },
    { firstName: "大輔", lastName: "加藤", address: "5-9-4", city: "名古屋市ひかり区（架空）", state: "愛知県", zip: "000-0004", phone: "090-0000-1005", email: "michael.rossi@example.com" },
    { firstName: "真由美", lastName: "吉田", address: "6-16-7", city: "名古屋市みなと区（架空）", state: "愛知県", zip: "000-0005", phone: "090-0000-1006", email: "susan.park@example.com" },
    { firstName: "浩", lastName: "山田", address: "7-3-1", city: "名古屋市みどり区（架空）", state: "愛知県", zip: "000-0006", phone: "090-0000-1007", email: "david.murphy@example.com" },
    { firstName: "直子", lastName: "松本", address: "8-10-4", city: "名古屋市あおい区（架空）", state: "愛知県", zip: "000-0007", phone: "090-0000-1008", email: "linda.hoffman@example.com" },
    { firstName: "剛", lastName: "井上", address: "9-17-7", city: "名古屋市さくら区（架空）", state: "愛知県", zip: "000-0008", phone: "090-0000-1009", email: "william.anderson@example.com" },
    { firstName: "香織", lastName: "木村", address: "10-4-1", city: "名古屋市ひかり区（架空）", state: "愛知県", zip: "000-0009", phone: "090-0000-1010", email: "patricia.lee@example.com" },
    { firstName: "拓也", lastName: "林", address: "11-11-4", city: "名古屋市みなと区（架空）", state: "愛知県", zip: "000-0010", phone: "090-0000-1011", email: "richard.nguyen@example.com" },
    { firstName: "裕子", lastName: "斎藤", address: "12-18-7", city: "名古屋市みどり区（架空）", state: "愛知県", zip: "000-0011", phone: "090-0000-1012", email: "barbara.schmidt@example.com" },
    { firstName: "哲也", lastName: "清水", address: "13-5-1", city: "名古屋市あおい区（架空）", state: "愛知県", zip: "000-0012", phone: "090-0000-1013", email: "thomas.wilson@example.com" },
    { firstName: "美穂", lastName: "山口", address: "14-12-4", city: "名古屋市さくら区（架空）", state: "愛知県", zip: "000-0013", phone: "090-0000-1014", email: "elizabeth.martin@example.com" },
    { firstName: "健一", lastName: "森", address: "15-19-7", city: "名古屋市ひかり区（架空）", state: "愛知県", zip: "000-0014", phone: "090-0000-1015", email: "charles.taylor@example.com" },
    { firstName: "智子", lastName: "池田", address: "16-6-1", city: "名古屋市みなと区（架空）", state: "愛知県", zip: "000-0015", phone: "090-0000-1016", email: "karen.davis@example.com" },
    { firstName: "亮", lastName: "橋本", address: "17-13-4", city: "名古屋市みどり区（架空）", state: "愛知県", zip: "000-0016", phone: "090-0000-1017", email: "daniel.clark@example.com" },
    { firstName: "千尋", lastName: "阿部", address: "18-20-7", city: "名古屋市あおい区（架空）", state: "愛知県", zip: "000-0017", phone: "090-0000-1018", email: "nancy.lewis@example.com" },
    { firstName: "修", lastName: "石川", address: "19-7-1", city: "名古屋市さくら区（架空）", state: "愛知県", zip: "000-0018", phone: "090-0000-1019", email: "joseph.walker@example.com" },
    { firstName: "明美", lastName: "前田", address: "20-14-4", city: "名古屋市ひかり区（架空）", state: "愛知県", zip: "000-0019", phone: "090-0000-1020", email: "margaret.young@example.com" },
    { firstName: "隆", lastName: "藤田", address: "21-1-7", city: "名古屋市みなと区（架空）", state: "愛知県", zip: "000-0020", phone: "090-0000-1021", email: "steven.hall@example.com" },
    { firstName: "純子", lastName: "後藤", address: "22-8-1", city: "名古屋市みどり区（架空）", state: "愛知県", zip: "000-0021", phone: "090-0000-1022", email: "dorothy.allen@example.com" },
    { firstName: "聡", lastName: "岡田", address: "23-15-4", city: "名古屋市あおい区（架空）", state: "愛知県", zip: "000-0022", phone: "090-0000-1023", email: "andrew.king@example.com" },
    { firstName: "彩", lastName: "長谷川", address: "24-2-7", city: "名古屋市さくら区（架空）", state: "愛知県", zip: "000-0023", phone: "090-0000-1024", email: "sandra.wright@example.com" },
    { firstName: "悠", lastName: "村上", address: "25-9-1", city: "名古屋市ひかり区（架空）", state: "愛知県", zip: "000-0024", phone: "090-0000-1025", email: "kevin.lopez@example.com" },
  ];

  const insertedClients = await db
    .insert(clients)
    .values(
      clientsData.map((c) => ({
        ...c,
        practiceId,
        preferredContactMethod: "phone" as const,
        accessToken: null,
      })),
    )
    .returning();
  console.log(`Clients: ${insertedClients.length} created`);

  // =========================================================================
  // 5. Patients (40) — dogs ~20, cats ~15, rabbits 2, birds 2, reptile 1
  // =========================================================================
  const patientsData: {
    clientIdx: number;
    name: string;
    species: "canine" | "feline" | "avian" | "rabbit" | "reptile";
    breed: string;
    sex: "male" | "female" | "male_neutered" | "female_spayed";
    dob: string;
    color: string;
    weightKg: string;
  }[] = [
    // Dogs (20)
    { clientIdx: 0, name: "マックス", species: "canine", breed: "ゴールデン・レトリバー", sex: "male_neutered", dob: "2020-03-15", color: "ゴールデン", weightKg: "31.8" },
    { clientIdx: 1, name: "ルナ", species: "canine", breed: "ジャーマン・シェパード", sex: "female_spayed", dob: "2019-08-22", color: "ブラック＆タン", weightKg: "28.6" },
    { clientIdx: 2, name: "チャーリー", species: "canine", breed: "ラブラドール・レトリバー", sex: "male_neutered", dob: "2021-01-10", color: "チョコレート", weightKg: "33.2" },
    { clientIdx: 3, name: "ベラ", species: "canine", breed: "フレンチブルドッグ", sex: "female_spayed", dob: "2022-05-18", color: "フォーン", weightKg: "11.3" },
    { clientIdx: 4, name: "クーパー", species: "canine", breed: "ビーグル", sex: "male_neutered", dob: "2020-11-03", color: "トライカラー", weightKg: "10.9" },
    { clientIdx: 5, name: "デイジー", species: "canine", breed: "プードル", sex: "female_spayed", dob: "2018-06-25", color: "白", weightKg: "6.8" },
    { clientIdx: 6, name: "ロッキー", species: "canine", breed: "ロットワイラー", sex: "male", dob: "2021-09-14", color: "ブラック＆ラスト", weightKg: "45.4" },
    { clientIdx: 7, name: "さくら", species: "canine", breed: "キャバリア・キング・チャールズ・スパニエル", sex: "female_spayed", dob: "2022-02-28", color: "ブレンハイム", weightKg: "7.3" },
    { clientIdx: 8, name: "タッカー", species: "canine", breed: "オーストラリアン・シェパード", sex: "male_neutered", dob: "2020-07-12", color: "ブルーマーレ", weightKg: "25.0" },
    { clientIdx: 9, name: "モモ", species: "canine", breed: "ボクサー", sex: "female_spayed", dob: "2019-04-05", color: "ブリンドル", weightKg: "27.2" },
    { clientIdx: 10, name: "くま", species: "canine", breed: "バーニーズ・マウンテン・ドッグ", sex: "male_neutered", dob: "2021-12-01", color: "トライカラー", weightKg: "43.5" },
    { clientIdx: 11, name: "ロージー", species: "canine", breed: "コッカー・スパニエル", sex: "female_spayed", dob: "2020-10-17", color: "バフ", weightKg: "12.7" },
    { clientIdx: 12, name: "デューク", species: "canine", breed: "グレート・デーン", sex: "male", dob: "2022-08-09", color: "ブルー", weightKg: "54.4" },
    { clientIdx: 13, name: "ぺんぺん", species: "canine", breed: "シーズー", sex: "female_spayed", dob: "2019-01-20", color: "ゴールドとホワイト", weightKg: "5.9" },
    { clientIdx: 14, name: "フィン", species: "canine", breed: "ボーダーコリー", sex: "male_neutered", dob: "2021-04-30", color: "ブラック＆ホワイト", weightKg: "18.6" },
    { clientIdx: 15, name: "ゾーイ", species: "canine", breed: "ダックスフンド", sex: "female_spayed", dob: "2020-02-14", color: "赤", weightKg: "5.4" },
    { clientIdx: 16, name: "ガス", species: "canine", breed: "ミニチュア・シュナウザー", sex: "male_neutered", dob: "2022-11-25", color: "ソルト＆ペッパー", weightKg: "7.7" },
    { clientIdx: 0, name: "バディ", species: "canine", breed: "ミックス犬種", sex: "male_neutered", dob: "2018-09-08", color: "タン", weightKg: "22.7" },
    { clientIdx: 3, name: "チロル", species: "canine", breed: "ヨークシャー・テリア", sex: "female", dob: "2023-03-12", color: "ブルー＆タン", weightKg: "3.2" },
    { clientIdx: 7, name: "ウィンストン", species: "canine", breed: "イングリッシュ・ブルドッグ", sex: "male_neutered", dob: "2021-06-15", color: "白と赤", weightKg: "22.0" },
    // Cats (15)
    { clientIdx: 1, name: "ひげまる", species: "feline", breed: "ドメスティック・ショートヘア", sex: "male_neutered", dob: "2019-05-10", color: "オレンジのトラ猫", weightKg: "5.0" },
    { clientIdx: 4, name: "ミトン", species: "feline", breed: "シャム", sex: "female_spayed", dob: "2020-12-05", color: "シールポイント", weightKg: "3.9" },
    { clientIdx: 6, name: "クロ", species: "feline", breed: "ドメスティック・ロングヘア", sex: "male_neutered", dob: "2018-03-18", color: "ブラック", weightKg: "5.9" },
    { clientIdx: 9, name: "トラ", species: "feline", breed: "メインクーン", sex: "male", dob: "2021-07-22", color: "ブラウン・タビー", weightKg: "7.3" },
    { clientIdx: 11, name: "クレオ", species: "feline", breed: "ロシアブルー", sex: "female_spayed", dob: "2020-09-30", color: "ブルー", weightKg: "4.1" },
    { clientIdx: 14, name: "オリバー", species: "feline", breed: "ブリティッシュショートヘア", sex: "male_neutered", dob: "2022-01-14", color: "ブルー", weightKg: "5.4" },
    { clientIdx: 17, name: "ナナ", species: "feline", breed: "アビシニアン", sex: "female_spayed", dob: "2021-11-08", color: "ラディ", weightKg: "3.6" },
    { clientIdx: 18, name: "シンバ", species: "feline", breed: "ペルシャ猫", sex: "male_neutered", dob: "2019-06-17", color: "白", weightKg: "4.5" },
    { clientIdx: 19, name: "リリー", species: "feline", breed: "ラグドール", sex: "female_spayed", dob: "2020-04-25", color: "ブルーバイカラー", weightKg: "4.8" },
    { clientIdx: 20, name: "ジャスパー", species: "feline", breed: "ベンガル", sex: "male_neutered", dob: "2022-06-03", color: "ブラウン・スポッテッド", weightKg: "5.0" },
    { clientIdx: 21, name: "もち", species: "feline", breed: "スコティッシュフォールド", sex: "female_spayed", dob: "2021-02-20", color: "グレー", weightKg: "3.8" },
    { clientIdx: 22, name: "フェリックス", species: "feline", breed: "ドメスティック・ショートヘア", sex: "male_neutered", dob: "2018-10-11", color: "タキシード", weightKg: "5.7" },
    { clientIdx: 23, name: "ルナ", species: "feline", breed: "スフィンクス", sex: "female", dob: "2023-01-05", color: "ピンク", weightKg: "3.4" },
    { clientIdx: 24, name: "オレオ", species: "feline", breed: "ドメスティック・ショートヘア", sex: "male_neutered", dob: "2020-08-15", color: "ブラック＆ホワイト", weightKg: "4.9" },
    { clientIdx: 5, name: "ミケ", species: "feline", breed: "三毛猫", sex: "female_spayed", dob: "2019-12-01", color: "三毛猫", weightKg: "4.0" },
    // Rabbits (2)
    { clientIdx: 10, name: "ぴょん吉", species: "rabbit", breed: "ホランドロップ", sex: "male_neutered", dob: "2022-04-10", color: "トコット", weightKg: "1.8" },
    { clientIdx: 16, name: "クローバー", species: "rabbit", breed: "ミニレックス", sex: "female_spayed", dob: "2023-02-14", color: "カスター", weightKg: "1.5" },
    // Birds (2)
    { clientIdx: 13, name: "キウイ", species: "avian", breed: "セキチョウ", sex: "male", dob: "2021-08-05", color: "グレーとイエロー", weightKg: "0.09" },
    { clientIdx: 19, name: "サニー", species: "avian", breed: "コンールインコ", sex: "female", dob: "2022-03-20", color: "黄とオレンジ", weightKg: "0.11" },
    // Reptile (1)
    { clientIdx: 20, name: "レックス", species: "reptile", breed: "フトアゴヒゲトカゲ", sex: "male", dob: "2021-05-15", color: "タン", weightKg: "0.45" },
  ];

  const insertedPatients = await db
    .insert(patients)
    .values(
      patientsData.map((p) => ({
        practiceId,
        clientId: insertedClients[p.clientIdx]!.id,
        name: p.name,
        species: p.species,
        breed: p.breed,
        sex: p.sex,
        dob: p.dob,
        color: p.color,
        status: "active" as const,
      }))
    )
    .returning();
  console.log(`Patients: ${insertedPatients.length} created`);

  // Patient weights
  await db.insert(patientWeights).values(
    patientsData.map((p, i) => ({
      patientId: insertedPatients[i]!.id,
      weightKg: p.weightKg,
      recordedAt: daysAgo(Math.floor(Math.random() * 30)),
      recordedBy: pickRandom(techs).id,
    }))
  );
  console.log("患者の体重を記録");

  // Patient allergies (a few)
  await db.insert(patientAllergies).values([
    { patientId: insertedPatients[0]!.id, allergen: "ペニシリン", reaction: "じんましん、顔面の腫れ", severity: "severe" as const, notedBy: vets[0]!.id },
    { patientId: insertedPatients[3]!.id, allergen: "鶏肉", reaction: "胃腸の不調、痒み", severity: "moderate" as const, notedBy: vets[1]!.id },
    { patientId: insertedPatients[9]!.id, allergen: "蜂の刺傷", reaction: "アナフィラキシー", severity: "severe" as const, notedBy: vets[2]!.id },
    { patientId: insertedPatients[21]!.id, allergen: "ラテックス", reaction: "接触皮膚炎", severity: "mild" as const, notedBy: vets[0]!.id },
  ]);
  console.log("患者のアレルギーを記録");

  // =========================================================================
  // 6. Appointment Types
  // =========================================================================
  const apptTypesData = [
    { name: "健康診断", durationMinutes: 30, color: "#0d9488", requiresDoctor: 1, defaultRoomType: "exam" as const },
    { name: "一般診療", durationMinutes: 30, color: "#dc2626", requiresDoctor: 1, defaultRoomType: "exam" as const },
    { name: "ワクチン接種", durationMinutes: 15, color: "#2563eb", requiresDoctor: 1, defaultRoomType: "exam" as const },
    { name: "手術", durationMinutes: 60, color: "#7c3aed", requiresDoctor: 1, defaultRoomType: "surgery" as const },
    { name: "歯科", durationMinutes: 45, color: "#ea580c", requiresDoctor: 1, defaultRoomType: "exam" as const },
    { name: "再診", durationMinutes: 15, color: "#16a34a", requiresDoctor: 1, defaultRoomType: "exam" as const },
  ];

  const insertedApptTypes = await db
    .insert(appointmentTypes)
    .values(apptTypesData.map((t) => ({ ...t, practiceId })))
    .returning();
  console.log(`Appointment types: ${insertedApptTypes.length} created`);

  // =========================================================================
  // 7. Exam Rooms (3)
  // =========================================================================
  const insertedRooms = await db
    .insert(rooms)
    .values([
      { practiceId, locationId, name: "診察室1", type: "exam" as const },
      { practiceId, locationId, name: "診察室2", type: "exam" as const },
      { practiceId, locationId, name: "診察室3", type: "exam" as const },
    ])
    .returning();
  console.log(`Rooms: ${insertedRooms.length} created`);

  // =========================================================================
  // 8. Appointments — 2 weeks (past week + current week)
  //    ~5-8 per day per vet, Mon-Fri, 9am-5pm
  // =========================================================================
  const appointmentValues: {
    practiceId: string;
    locationId: string;
    startTime: Date;
    endTime: Date;
    typeId: string;
    patientId: string;
    clientId: string;
    doctorId: string;
    roomId: string;
    status: "scheduled" | "confirmed" | "checked_in" | "in_exam" | "checked_out" | "no_show" | "cancelled";
    notes: string | null;
  }[] = [];

  const today = new Date();
  const currentDow = today.getDay(); // 0=Sun

  // Generate 10 weekdays: 5 from last week (Mon-Fri) + 5 from this week
  const weekdays: Date[] = [];
  // Last Monday = today - currentDow - 6 (if currentDow is e.g. 3/Wed, last Mon = -8)
  // More robust: last week Mon = this week Mon - 7
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - (currentDow === 0 ? 6 : currentDow - 1));
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);

  for (let w = 0; w < 2; w++) {
    const weekStart = w === 0 ? lastMonday : thisMonday;
    for (let d = 0; d < 5; d++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + d);
      weekdays.push(day);
    }
  }

  const timeSlots = [
    { hour: 9, min: 0 },
    { hour: 9, min: 30 },
    { hour: 10, min: 0 },
    { hour: 10, min: 30 },
    { hour: 11, min: 0 },
    { hour: 11, min: 30 },
    { hour: 13, min: 0 },
    { hour: 13, min: 30 },
    { hour: 14, min: 0 },
    { hour: 14, min: 30 },
    { hour: 15, min: 0 },
    { hour: 15, min: 30 },
    { hour: 16, min: 0 },
    { hour: 16, min: 30 },
  ];

  const pastStatuses: ("checked_out" | "no_show" | "cancelled")[] = [
    "checked_out", "checked_out", "checked_out", "checked_out",
    "checked_out", "checked_out", "checked_out", "checked_out",
    "no_show", "cancelled",
  ];

  const futureStatuses: ("scheduled" | "confirmed")[] = ["scheduled", "confirmed", "confirmed"];

  for (const day of weekdays) {
    const isPast = day < today && day.toDateString() !== today.toDateString();
    const isToday = day.toDateString() === today.toDateString();

    for (const vet of vets) {
      // 5-8 appointments per day per vet
      const numAppts = 5 + Math.floor(Math.random() * 4);
      const daySlots = pickN(timeSlots, numAppts);
      daySlots.sort((a, b) => a.hour * 60 + a.min - (b.hour * 60 + b.min));

      for (const slot of daySlots) {
        const apptType = pickRandom(insertedApptTypes);
        const patient = pickRandom(insertedPatients);
        // The appointment's client MUST be the patient's actual owner. The
        // schedule/dashboard patient-name join requires
        // patient.clientId === appointment.clientId, so a mismatched client
        // makes the name resolve to null and render as "不明な患者".
        // Map by the patient's own clientIdx, not its position in the array.
        const patientIdx = insertedPatients.indexOf(patient);
        const clientForPatient = insertedClients[patientsData[patientIdx]!.clientIdx];
        const startTime = setTime(day, slot.hour, slot.min);
        const endTime = addMinutes(startTime, apptType.durationMinutes);

        let status: typeof appointmentValues[0]["status"];
        if (isPast) {
          status = pickRandom(pastStatuses);
        } else if (isToday) {
          const nowHour = today.getHours();
          if (slot.hour < nowHour) {
            status = pickRandom(["checked_out", "checked_out", "checked_out", "no_show"] as const);
          } else if (slot.hour === nowHour) {
            status = pickRandom(["in_exam", "checked_in"] as const);
          } else {
            status = pickRandom(["scheduled", "confirmed", "confirmed"] as const);
          }
        } else {
          status = pickRandom(futureStatuses);
        }

        appointmentValues.push({
          practiceId,
          locationId,
          startTime,
          endTime,
          typeId: apptType.id,
          patientId: patient.id,
          clientId: clientForPatient
            ? clientForPatient.id
            : insertedClients[0]!.id,
          doctorId: vet.id,
          roomId: pickRandom(insertedRooms).id,
          status,
          notes: crypto.randomInt(10) > 6 ? "飼い主より特記事項なし" : null,
        });
      }
    }
  }

  const insertedAppointments = await db
    .insert(appointments)
    .values(appointmentValues)
    .returning();
  console.log(`Appointments: ${insertedAppointments.length} created`);

  // =========================================================================
  // 9. SOAP Notes for past checked_out appointments (sample)
  // =========================================================================
  const pastCheckedOut = insertedAppointments.filter(
    (a) => a.status === "checked_out"
  );

  const soapTemplates = [
    {
      subjective: "飼い主より、患者は通常通り食事と水分を摂取しているとの報告あり。嘔吐や下痢なし。活動量はปกติ。ノミ・マダニ予防は最新の状態。",
      objective: "体温: 38.4℃, 心拍数: 80bpm, 呼吸数: 20. BCS: 5/9。活気があり、意識清明。被毛の状態は良好。身体診察で異常なし。臼歯に軽度の歯石の付着あり。",
      assessment: "健康な患者、定期的な健康診断。軽度の歯石を確認 - 6ヶ月以内に歯科クリーニングを推奨。",
      plan: "現在の食事と運動を継続。歯科クリーニングの予約を入れること。プロトコルに従いワクチン接種を更新。1年後または必要に応じて再診。",
    },
    {
      subjective: "飼い主より、2日前から食欲が低下しているとの報告あり。患者は元気がない様子。嘔吐はないが軟便を認める。水分摂取はปกติ。",
      objective: "体温: 39.3℃, 心拍数: 110bpm, 呼吸数: 28. BCS: 4/9. 軽度の脱水あり。触診で腹部がやや緊張している。腫瘍は触知なし。頭側腹部に軽度の不快感あり。",
      assessment: "胃腸炎の疑い。鑑別診断には誤食、膵炎、異物を含む。血液検査と経過観察を推奨。",
      plan: "血液検査（CBC・生化学）提出済み。3〜5日間は療法食（鶏肉とご飯の煮込み）を給与。セレニア1mg/kgを皮下投与。改善が見られない場合は48時間後に再診。嘔吐の開始や元気лоの悪化がある場合は救急対応。",
    },
    {
      subjective: "年次のワクチン接種。飼い主に懸念事項なし。患者は毎月のハートガードとネックスガードを服用中。",
      objective: "体温: 38.2℃, 心拍数: 90bpm, 呼吸数: 18. BCS: 6/9。やや肥満。診察における全システムは正常範囲内。心音および肺音は正常。",
      assessment: "健康な患者、やや過体重。本日ワクチン接種を実施。",
      plan: "混合ワクチン（DHPP）および狂犬病ワクチンを接種。毎日の給餌量を10%減らし、運動量を増やすことを推奨。3ヶ月後に体重を再確認。次回の年次接種は1年後。",
    },
    {
      subjective: "右前肢の跛行で来院。昨日公園で遊んだ後に飼い主が発見。既知の外傷なし。一晩経っても改善せず。",
      objective: "体温: 38.6℃, 心拍数: 95bpm, 呼吸数: 22. 右前肢の跛行（グレード2/5）。右肘の屈曲時に痛みあり。外側肘部に軽度の軟部組織の腫れを認める。捻挫音なし。肩および手根関節の可動域は良好。",
      assessment: "右前肢の跛行。肘付近の軟部組織損傷の可能性あり。レントゲン検査では異常なし。骨折やOCD病変は認められない。",
      plan: "リマディル 2mg/kgを7日間、食事と一緒に1日2回投与。2週間の厳重な安静（リード歩行のみ）。最初の3日間は冷湿布を1日3回、各10分間。2週間後に再診。改善が見られない場合は、高度な画像診断のための紹介を検討。",
    },
    {
      subjective: "麻酔下での定期的な歯科クリーニング。術前の血液検査は先週実施済みで正常範囲内。昨夜10時以降の絶食を指示。",
      objective: "麻酔前バイタル：体温 38.3℃、心拍数 88bpm、呼吸数 16回/分。ASAクラスI。小臼歯と大臼歯に中程度の歯石を伴うグレード2の歯科疾患あり。軽度の歯肉炎を確認。口腔内レントゲン撮影済み。",
      assessment: "歯科疾患グレード2。中程度の歯石の付着あり。レントゲンで歯根膿瘍は認められない。すべての歯が健全で生存している。",
      plan: "全身麻酔下で完全な歯科予防処置を実施（プロポフォール導入、イソフルラン維持）。すべての歯石を除去。歯をポリッシュ。フッ素塗布。回復は順調。今晩退院。3日間はソフトフードを与えること。",
    },
  ];

  const soapNotesCount = Math.min(pastCheckedOut.length, 40);
  const soapNotesToCreate = pastCheckedOut.slice(0, soapNotesCount);
  await db.insert(soapNotes).values(
    soapNotesToCreate.map((appt) => {
      const template = pickRandom(soapTemplates);
      const author = insertedUsers.find((user) => user.id === appt.doctorId)!;
      const finalizedAt = new Date();
      return {
        practiceId,
        patientId: appt.patientId!,
        appointmentId: appt.id,
        authorId: author.id,
        authorName: author.name,
        status: "finalized" as const,
        revision: 1,
        finalizedAt,
        finalizedBy: author.id,
        finalizerName: author.name,
        subjective: template.subjective,
        objective: template.objective,
        assessment: template.assessment,
        plan: template.plan,
      };
    })
  );
  console.log(`SOAP notes: ${soapNotesCount} created`);

  // =========================================================================
  // 10. Vaccination Records
  // =========================================================================
  const vaccineData = [
    { name: "混合ワクチン（DHPP）", manufacturer: "ゾエティス", nextDueMonths: 12 },
    { name: "狂犬病（3年）", manufacturer: "ベーリンガーインゲルハイム", nextDueMonths: 36 },
    { name: "ボルデテラ", manufacturer: "ゾエティス", nextDueMonths: 12 },
    { name: "ライム病 (Borrelia burgdorferi)", manufacturer: "ゾエティス", nextDueMonths: 12 },
    { name: "犬インフルエンザ（H3N2/H3N8）", manufacturer: "ゾエティス", nextDueMonths: 12 },
    { name: "レプトスピラ症", manufacturer: "ノビバック", nextDueMonths: 12 },
    { name: "FVRCP（猫3種混合ワクチン）", manufacturer: "ベーリンガーインゲルハイム", nextDueMonths: 12 },
    { name: "FeLV（猫白血病）", manufacturer: "ベーリンガーインゲルハイム", nextDueMonths: 12 },
    { name: "狂犬病（1年、猫用）", manufacturer: "ベーリンガーインゲルハイム", nextDueMonths: 12 },
  ];

  const vaccinationValues: {
    practiceId: string;
    patientId: string;
    vaccineName: string;
    lotNumber: string;
    manufacturer: string;
    administeredBy: string;
    administeredAt: Date;
    nextDueDate: string;
  }[] = [];

  // Dogs get DHPP, Rabies, Bordetella; Cats get FVRCP, Rabies, FeLV
  for (const patient of insertedPatients) {
    const pData = patientsData[insertedPatients.indexOf(patient)]!;
    let applicableVaccines: typeof vaccineData;
    if (pData.species === "canine") {
      applicableVaccines = vaccineData.filter((v) =>
        ["DHPP", "狂犬病（3年）", "ボルデテラ", "ライム病", "レプトスピラ症"].some((n) => v.name.startsWith(n))
      );
    } else if (pData.species === "feline") {
      applicableVaccines = vaccineData.filter((v) =>
        ["FVRCP", "FeLV", "狂犬病（1年）"].some((n) => v.name.startsWith(n))
      );
    } else if (pData.species === "rabbit") {
      // Rabbits: RHDV2
      applicableVaccines = [{ name: "RHDV2（ウサギ出血性疾患ウイルス）", manufacturer: "メドジェン", nextDueMonths: 12 }];
    } else {
      continue; // Birds/reptiles — skip vaccines
    }

    // Give 1-3 vaccines per patient
    const numVax = 1 + Math.floor(Math.random() * Math.min(3, applicableVaccines.length));
    const selectedVax = pickN(applicableVaccines, numVax);

    for (const vax of selectedVax) {
      const adminDate = daysAgo(Math.floor(Math.random() * 180) + 30);
      const nextDue = new Date(adminDate);
      nextDue.setMonth(nextDue.getMonth() + vax.nextDueMonths);

      vaccinationValues.push({
        practiceId,
        patientId: patient.id,
        vaccineName: vax.name,
        lotNumber: `LOT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        manufacturer: vax.manufacturer,
        administeredBy: pickRandom(vets).id,
        administeredAt: adminDate,
        nextDueDate: dateStr(nextDue),
      });
    }
  }

  await db.insert(vaccinationRecords).values(vaccinationValues);
  console.log(`Vaccination records: ${vaccinationValues.length} created`);

  // =========================================================================
  // 11. Prescriptions
  // =========================================================================
  const prescriptionData = [
    { medicationName: "リマディル（カルプロフェン）", dosage: "75mg", frequency: "毎食後（BID）", quantity: 60, instructions: "食事の साथ 1日2回、タブレットを口から1錠ずつ与える。胃腸の不調を観察すること。他のNSAIDsや副腎皮質ステロイド剤とは併用しないこと。" },
    { medicationName: "メタカム (Meloxicam)", dosage: "0.1mg/kg", frequency: "SID", quantity: 30, instructions: "1日1回経口投与。正確な用量のために付属のシリンジを使用すること。食事と一緒に与える。" },
    { medicationName: "クラバモックス（アモキシシリン/クラブラン酸）", dosage: "250mg", frequency: "BID", quantity: 28, instructions: "14日間、1日2回、タブレットを口から1錠ずつ与える。症状が改善しても抗生物質は全期間服用すること。" },
    { medicationName: "アポケル（オクラシチニブ）", dosage: "16mg", frequency: "1日2回を14日間、その後1日1回", quantity: 42, instructions: "14日間は1日2回、その後維持のために1日1回、1錠を服用。感染の有無を観察すること。" },
    { medicationName: "ガバペンチン", dosage: "100mg", frequency: "BID", quantity: 60, instructions: "痛み管理のため、1日2回、カプセルを口から1錠ずつ与える。初期に鎮静作用が現れる可能性がある。" },
    { medicationName: "セレニア（マロピタン）", dosage: "24mg", frequency: "SID x5日間", quantity: 5, instructions: "吐き気・嘔吐に対して最大5日間、1日1回、タブレットを口から1錠ずつ与える。食事の有無に関わらず服用可能。" },
    { medicationName: "トラゾドン", dosage: "50mg", frequency: "1日2回、必要に応じて", quantity: 30, instructions: "不安の緩和のため、必要に応じて1日2回、タブレットを口から1錠ずつ与える。鎮静作用が現れる可能性がある。" },
    { medicationName: "プレドニゾン", dosage: "10mg", frequency: "SIDテーパリング", quantity: 21, instructions: "1〜7日目：毎日2錠。8〜14日目：毎日1錠。15〜21日目：隔日で1錠。食事と一緒に与えること。" },
    { medicationName: "ベトメジン（ピモベンダン）", dosage: "2.5mg", frequency: "BID", quantity: 60, instructions: "食事の1時間前に、1日2回、タブレットを口から1錠ずつ与える。食事と一緒に与えないこと。心機能に不可欠。" },
    { medicationName: "コンベニア（セフォベシン）", dosage: "8mg/kg", frequency: "単回注射", quantity: 1, instructions: "クリニックにて単回皮下注射を実施。14日間の抗菌薬効果を提供。" },
    { medicationName: "メトロニダゾール", dosage: "250mg", frequency: "1日2回、10日間", quantity: 20, instructions: "10日間、1日2回、タブレットを口から1錠ずつ与える。食欲不振を起こす可能性がある。全期間服用すること。" },
    { medicationName: "フォルトフローラ（プロバイオティクス）", dosage: "1袋", frequency: "SID", quantity: 30, instructions: "1日1回、フードにサシェを1包振りかける。消化器系の健康のために長期使用可能。" },
  ];

  const prescriptionValues = [];
  // Create ~15 prescriptions for various patients
  for (let i = 0; i < 15; i++) {
    const rx = prescriptionData[i % prescriptionData.length]!;
    const patient = pickRandom(insertedPatients.slice(0, 20)); // mostly dogs/cats
    const startDate = daysAgo(crypto.randomInt(60));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (rx.quantity / (rx.frequency.includes("BID") ? 2 : 1)));

    const isCompleted = endDate < new Date();
    prescriptionValues.push({
      practiceId,
      patientId: patient.id,
      medicationName: rx.medicationName,
      dosage: rx.dosage,
      frequency: rx.frequency,
      quantity: rx.quantity,
      refillsRemaining: isCompleted ? 0 : Math.floor(Math.random() * 3),
      prescribedBy: pickRandom(vets).id,
      startDate: dateStr(startDate),
      endDate: dateStr(endDate),
      status: isCompleted ? ("completed" as const) : ("active" as const),
      instructions: rx.instructions,
    });
  }

  await db.insert(prescriptions).values(prescriptionValues);
  console.log(`Prescriptions: ${prescriptionValues.length} created`);

  // =========================================================================
  // 11b. Lab Results
  // =========================================================================
  const labTestData = [
    { testName: "血液検査（CBC）", unit: "x10^9/L", low: "5.5", high: "16.9", normalValue: () => (5.5 + Math.random() * 11.4).toFixed(1) },
    { testName: "BUN（血中尿素窒素）", unit: "mg/dL", low: "7.0", high: "27.0", normalValue: () => (7 + Math.random() * 20).toFixed(1) },
    { testName: "クレアチニン", unit: "mg/dL", low: "0.5", high: "1.8", normalValue: () => (0.5 + Math.random() * 1.3).toFixed(2) },
    { testName: "ALT（アラニンアミノトランスフェラーゼ）", unit: "U/L", low: "10.0", high: "125.0", normalValue: () => (10 + Math.random() * 115).toFixed(0) },
    { testName: "グルコース", unit: "mg/dL", low: "74.0", high: "143.0", normalValue: () => (74 + Math.random() * 69).toFixed(0) },
    { testName: "総タンパク質", unit: "g/dL", low: "5.2", high: "8.2", normalValue: () => (5.2 + Math.random() * 3).toFixed(1) },
    { testName: "尿検査 - 比重", unit: "", low: "1.015", high: "1.045", normalValue: () => (1.015 + Math.random() * 0.03).toFixed(3) },
    { testName: "T4（甲状腺）", unit: "ug/dL", low: "1.0", high: "4.0", normalValue: () => (1 + Math.random() * 3).toFixed(1) },
    { testName: "アルカリホスファターゼ (ALP)", unit: "U/L", low: "23.0", high: "212.0", normalValue: () => (23 + Math.random() * 189).toFixed(0) },
    { testName: "アルブミン", unit: "g/dL", low: "2.3", high: "4.0", normalValue: () => (2.3 + Math.random() * 1.7).toFixed(1) },
  ];

  const labResultValues: (typeof labResults.$inferInsert)[] = [];

  // Create 12 lab results across different patients. Pending rows intentionally
  // carry no partial values; completed/reviewed rows carry explicit evidence.
  const labPatients = pickN(insertedPatients.slice(0, 20), 8);
  for (let i = 0; i < 12; i++) {
    const patient = labPatients[i % labPatients.length]!;
    const test = labTestData[i % labTestData.length]!;
    const vet = pickRandom(vets);

    let measuredValue: string;
    if (i === 1) {
      measuredValue = "42.5";
    } else if (i === 3) {
      measuredValue = "198";
    } else if (i === 7) {
      measuredValue = "0.6";
    } else {
      measuredValue = test.normalValue();
    }

    const status: "pending" | "completed" | "reviewed" =
      i < 3 ? "pending" : i < 7 ? "completed" : "reviewed";
    const hasValues = status !== "pending";
    const createdAt = daysAgo(14 - i);
    const completedAt = hasValues ? addMinutes(createdAt, 30) : null;
    const reviewedAt = status === "reviewed"
      ? addMinutes(completedAt!, 45)
      : null;
    const creationOperationId = crypto.randomUUID();
    const creationPayloadHash = crypto
      .createHash("sha256")
      .update(`seed:lab:create:${creationOperationId}`)
      .digest("hex");
    const resultFlag = status === "pending"
      ? "unknown"
      : i === 3 || i === 7
        ? "abnormal"
        : "normal";

    labResultValues.push({
      practiceId,
      patientId: patient.id,
      creationOperationId,
      creationPayloadHash,
      testName: test.testName,
      resultValue: hasValues ? measuredValue : null,
      unit: hasValues ? test.unit : null,
      referenceRangeLow: hasValues ? test.low : null,
      referenceRangeHigh: hasValues ? test.high : null,
      status,
      resultFlag,
      orderedBy: vet.id,
      completedAt,
      reviewedBy: status === "reviewed" ? vet.id : null,
      reviewedAt,
      createdAt,
      updatedAt: reviewedAt ?? completedAt ?? createdAt,
    });
  }

  const insertedLabResults = await db
    .insert(labResults)
    .values(labResultValues)
    .returning();

  const userNameById = new Map(insertedUsers.map((user) => [user.id, user.name]));
  const labEventValues: (typeof labResultEvents.$inferInsert)[] = [];
  for (const result of insertedLabResults) {
    const actorName = userNameById.get(result.orderedBy ?? "") ?? "シード・クリニシャン";
    labEventValues.push({
      practiceId,
      labResultId: result.id,
      patientId: result.patientId,
      appointmentId: result.appointmentId,
      eventType: "created",
      statusBefore: null,
      statusAfter: "pending",
      resultValue: null,
      unit: null,
      referenceRangeLow: null,
      referenceRangeHigh: null,
      resultFlag: "unknown",
      followUpStatus: "not_required",
      actorId: result.orderedBy!,
      actorName,
      createdAt: result.createdAt,
      operationId: result.creationOperationId!,
      operationPayloadHash: result.creationPayloadHash!,
    });
    if (result.status !== "pending") {
      const completionOperationId = crypto.randomUUID();
      labEventValues.push({
        practiceId,
        labResultId: result.id,
        patientId: result.patientId,
        appointmentId: result.appointmentId,
        eventType: "completed",
        statusBefore: "pending",
        statusAfter: "completed",
        resultValue: result.resultValue,
        unit: result.unit,
        referenceRangeLow: result.referenceRangeLow,
        referenceRangeHigh: result.referenceRangeHigh,
        resultFlag: result.resultFlag,
        followUpStatus: "not_required",
        actorId: result.orderedBy!,
        actorName,
        note: "シード結果値を記録。",
        createdAt: result.completedAt!,
        operationId: completionOperationId,
        operationPayloadHash: crypto
          .createHash("sha256")
          .update(`seed:lab:complete:${completionOperationId}`)
          .digest("hex"),
      });
    }
    if (result.status === "reviewed") {
      const reviewOperationId = crypto.randomUUID();
      labEventValues.push({
        practiceId,
        labResultId: result.id,
        patientId: result.patientId,
        appointmentId: result.appointmentId,
        eventType: "reviewed",
        statusBefore: "completed",
        statusAfter: "reviewed",
        resultValue: result.resultValue,
        unit: result.unit,
        referenceRangeLow: result.referenceRangeLow,
        referenceRangeHigh: result.referenceRangeHigh,
        resultFlag: result.resultFlag,
        followUpStatus: "not_required",
        actorId: result.reviewedBy!,
        actorName,
        createdAt: result.reviewedAt!,
        operationId: reviewOperationId,
        operationPayloadHash: crypto
          .createHash("sha256")
          .update(`seed:lab:review:${reviewOperationId}`)
          .digest("hex"),
      });
    }
  }
  await db.insert(labResultEvents).values(labEventValues);
  const enteredInErrorSource = insertedLabResults.find(
    (result) => result.status === "completed",
  );
  if (!enteredInErrorSource?.orderedBy) {
    throw new Error("デモ用検査修正治具には完了したソースが必要です。");
  }
  const correctionOperationId = crypto.randomUUID();
  const correctionPayloadHash = crypto
    .createHash("sha256")
    .update(`seed:lab:entered-in-error:${correctionOperationId}`)
    .digest("hex");
  const correctionCreatedAt = addMinutes(
    enteredInErrorSource.completedAt ?? enteredInErrorSource.createdAt,
    5,
  );
  const [labCorrection] = await db
    .insert(clinicalRecordCorrections)
    .values({
      practiceId,
      recordType: "lab_result",
      action: "entered_in_error",
      labResultId: enteredInErrorSource.id,
      patientId: enteredInErrorSource.patientId,
      appointmentId: enteredInErrorSource.appointmentId,
      reason:
        "デモおよび監査用に誤って転記された値を保持。",
      correctedBy: enteredInErrorSource.orderedBy,
      correctedByName:
        userNameById.get(enteredInErrorSource.orderedBy) ?? "シード・クリニシャン",
      operationId: correctionOperationId,
      operationPayloadHash: correctionPayloadHash,
      createdAt: correctionCreatedAt,
    })
    .returning();
  const replacementOperationId = crypto.randomUUID();
  const replacementPayloadHash = crypto
    .createHash("sha256")
    .update(`seed:lab:replacement:${replacementOperationId}`)
    .digest("hex");
  const replacementCreatedAt = addMinutes(correctionCreatedAt, 5);
  const replacementCompletedAt = addMinutes(replacementCreatedAt, 15);
  const replacementReviewedAt = addMinutes(replacementCompletedAt, 10);
  const replacementValue = "87";
  const [replacementResult] = await db
    .insert(labResults)
    .values({
      practiceId,
      patientId: enteredInErrorSource.patientId,
      creationOperationId: replacementOperationId,
      creationPayloadHash: replacementPayloadHash,
      testName: enteredInErrorSource.testName,
      resultValue: replacementValue,
      unit: enteredInErrorSource.unit,
      referenceRangeLow: enteredInErrorSource.referenceRangeLow,
      referenceRangeHigh: enteredInErrorSource.referenceRangeHigh,
      status: "reviewed",
      resultFlag: "normal",
      orderedBy: enteredInErrorSource.orderedBy,
      completedAt: replacementCompletedAt,
      reviewedBy: enteredInErrorSource.orderedBy,
      reviewedAt: replacementReviewedAt,
      createdAt: replacementCreatedAt,
      updatedAt: replacementReviewedAt,
    })
    .returning();
  const replacementCompletionOperationId = crypto.randomUUID();
  const replacementReviewOperationId = crypto.randomUUID();
  const replacementActorName =
    userNameById.get(enteredInErrorSource.orderedBy) ?? "シード・クリニシャン";
  await db.insert(labResultEvents).values([
    {
      practiceId,
      labResultId: replacementResult!.id,
      patientId: replacementResult!.patientId,
      appointmentId: null,
      eventType: "created",
      statusBefore: null,
      statusAfter: "pending",
      resultValue: null,
      unit: null,
      referenceRangeLow: null,
      referenceRangeHigh: null,
      resultFlag: "unknown",
      followUpStatus: "not_required",
      actorId: enteredInErrorSource.orderedBy,
      actorName: replacementActorName,
      createdAt: replacementCreatedAt,
      operationId: replacementOperationId,
      operationPayloadHash: replacementPayloadHash,
    },
    {
      practiceId,
      labResultId: replacementResult!.id,
      patientId: replacementResult!.patientId,
      appointmentId: null,
      eventType: "completed",
      statusBefore: "pending",
      statusAfter: "completed",
      resultValue: replacementValue,
      unit: replacementResult!.unit,
      referenceRangeLow: replacementResult!.referenceRangeLow,
      referenceRangeHigh: replacementResult!.referenceRangeHigh,
      resultFlag: "normal",
      followUpStatus: "not_required",
      actorId: enteredInErrorSource.orderedBy,
      actorName: replacementActorName,
      note: "修正後に新しい置換値を記録。",
      createdAt: replacementCompletedAt,
      operationId: replacementCompletionOperationId,
      operationPayloadHash: crypto
        .createHash("sha256")
        .update(
          `seed:lab:replacement-complete:${replacementCompletionOperationId}`,
        )
        .digest("hex"),
    },
    {
      practiceId,
      labResultId: replacementResult!.id,
      patientId: replacementResult!.patientId,
      appointmentId: null,
      eventType: "reviewed",
      statusBefore: "completed",
      statusAfter: "reviewed",
      resultValue: replacementValue,
      unit: replacementResult!.unit,
      referenceRangeLow: replacementResult!.referenceRangeLow,
      referenceRangeHigh: replacementResult!.referenceRangeHigh,
      resultFlag: "normal",
      followUpStatus: "not_required",
      actorId: enteredInErrorSource.orderedBy,
      actorName: replacementActorName,
      createdAt: replacementReviewedAt,
      operationId: replacementReviewOperationId,
      operationPayloadHash: crypto
        .createHash("sha256")
        .update(`seed:lab:replacement-review:${replacementReviewOperationId}`)
        .digest("hex"),
    },
  ]);
  await db.insert(labResultReplacements).values({
    practiceId,
    correctionId: labCorrection!.id,
    sourceLabResultId: enteredInErrorSource.id,
    replacementLabResultId: replacementResult!.id,
    actorId: enteredInErrorSource.orderedBy,
    actorName: replacementActorName,
    operationId: replacementOperationId,
    operationPayloadHash: replacementPayloadHash,
    createdAt: replacementCreatedAt,
  });
  console.log(
    `Lab results: ${insertedLabResults.length + 1} created with ${labEventValues.length + 3} evidence events`,
  );

  // =========================================================================
  // 11c. Procedures
  // =========================================================================
  const procedureData = [
    { name: "歯科予防", description: "全身麻酔下でのスケーリングおよびポリッシングを含む完全な歯科クリーニング", anesthesiaUsed: "イソフルラン + プロポフォール 導入麻酔", durationMinutes: 60 },
    { name: "腫瘍切除", description: "右側腹部の皮下腫瘍の外科的切除、病理組織検査へ提出", anesthesiaUsed: "イソフルラン + 局所リドカインブロック", durationMinutes: 45 },
    { name: "裂傷縫合", description: "左前肢の4cmの裂傷のデブリドマンおよび一次縫合", anesthesiaUsed: "鎮静（デクスドミトール）＋局所麻酔リドカイン", durationMinutes: 30 },
    { name: "異物除去", description: "胃内からの靴下の破片の内視鏡摘出", anesthesiaUsed: "イソフルラン 全身麻酔", durationMinutes: 90 },
    { name: "避妊手術（卵管切除術）", description: "腹部正中アプローチによる通常の避妊手術", anesthesiaUsed: "イソフルラン + プロポフォール 導入麻酔 + メロキシカム", durationMinutes: 45 },
    { name: "去勢手術", description: "通常の去勢手術、陰嚢前アプローチ、閉鎖法", anesthesiaUsed: "イソフルラン + プロポフォール 導入麻酔", durationMinutes: 25 },
    { name: "膀胱切開術", description: "腹腔鏡下での膀胱結石の外科的除去", anesthesiaUsed: "イソフルラン 全身麻酔 + 硬膜外麻酔", durationMinutes: 75 },
  ];

  const procedureValues: {
    practiceId: string;
    patientId: string;
    name: string;
    description: string;
    performedBy: string;
    anesthesiaUsed: string;
    durationMinutes: number;
    notes: string;
  }[] = [];

  const procPatients = pickN(insertedPatients.slice(0, 20), 7);
  for (let i = 0; i < 7; i++) {
    const patient = procPatients[i % procPatients.length]!;
    const proc = procedureData[i]!;
    const vet = pickRandom(vets);

    procedureValues.push({
      practiceId,
      patientId: patient.id,
      name: proc.name,
      description: proc.description,
      performedBy: vet.id,
      anesthesiaUsed: proc.anesthesiaUsed,
      durationMinutes: proc.durationMinutes,
      notes: `Patient recovered well. Post-op monitoring for ${Math.floor(proc.durationMinutes / 2)} minutes. Discharged with standard post-operative instructions.`,
    });
  }

  await db.insert(procedures).values(procedureValues);
  console.log(`Procedures: ${procedureValues.length} created`);

  // =========================================================================
  // 12. Services
  // =========================================================================
  const servicesData = [
    { name: "健康診断", code: "EXAM-WE", category: "診察", defaultPrice: "9750.00" },
    { name: "一般診療の診察", code: "EXAM-SV", category: "診察", defaultPrice: "11250.00" },
    { name: "手術相談", code: "EXAM-SC", category: "診察", defaultPrice: "12750.00" },
    { name: "歯科予防", code: "DENT-01", category: "歯科", defaultPrice: "52500.00" },
    { name: "抜歯（単純）", code: "DENT-02", category: "歯科", defaultPrice: "22500.00" },
    { name: "避妊手術（23kg未満）", code: "SURG-01", category: "手術", defaultPrice: "60000.00" },
    { name: "去勢手術（23kg未満）", code: "SURG-02", category: "手術", defaultPrice: "45000.00" },
    { name: "腫瘍切除", code: "SURG-03", category: "手術", defaultPrice: "75000.00" },
    { name: "レントゲン（2方向）", code: "DIAG-01", category: "検査", defaultPrice: "27750.00" },
    { name: "血液検査（CBC・生化学）", code: "LAB-01", category: "検査", defaultPrice: "21750.00" },
    { name: "尿検査", code: "LAB-02", category: "検査", defaultPrice: "8250.00" },
    { name: "糞便浮遊法", code: "LAB-03", category: "検査", defaultPrice: "5250.00" },
    { name: "DHPPワクチン", code: "VAX-01", category: "ワクチン", defaultPrice: "4200.00" },
    { name: "狂犬病ワクチン", code: "VAX-02", category: "ワクチン", defaultPrice: "3300.00" },
    { name: "ボルデテラワクチン", code: "VAX-03", category: "ワクチン", defaultPrice: "3750.00" },
    { name: "FVRCPワクチン", code: "VAX-04", category: "ワクチン", defaultPrice: "4200.00" },
    { name: "FeLVワクチン", code: "VAX-05", category: "ワクチン", defaultPrice: "4500.00" },
    { name: "爪切り", code: "GROO-01", category: "グルーミング", defaultPrice: "2700.00" },
    { name: "肛門腺の圧出", code: "GROO-02", category: "グルーミング", defaultPrice: "3750.00" },
    { name: "マイクロチップ埋め込み", code: "MISC-01", category: "その他", defaultPrice: "8250.00" },
  ];

  const insertedServices = await db
    .insert(services)
    .values(servicesData.map((s) => ({ ...s, practiceId, taxable: true })))
    .returning();
  console.log(`Services: ${insertedServices.length} created`);

  // =========================================================================
  // 13. Invoices (various states)
  // =========================================================================
  const invoiceStatuses: ("draft" | "sent" | "paid" | "overdue")[] = [
    "paid", "paid", "paid", "paid", "paid",
    "paid", "paid", "sent", "sent", "sent",
    "draft", "draft", "overdue", "overdue",
  ];

  const invoiceValues: {
    practiceId: string;
    clientId: string;
    patientId: string;
    appointmentId: string | null;
    status: "draft" | "sent" | "paid" | "overdue";
    subtotal: string;
    tax: string;
    total: string;
    paidAmount: string;
    dueDate: string;
    createdAt: Date;
  }[] = [];

  for (let i = 0; i < invoiceStatuses.length; i++) {
    const status = invoiceStatuses[i]!;
    const client = insertedClients[i % insertedClients.length]!;
    const patientIdx = patientsData.findIndex(
      (p) => insertedClients[p.clientIdx]?.id === client.id
    );
    const patient = patientIdx >= 0 ? insertedPatients[patientIdx]! : insertedPatients[0]!;
    const appt = i < insertedAppointments.length ? insertedAppointments[i]! : null;

    const subtotal = (Math.round((50 + Math.random() * 400) * 15) * 10).toFixed(2);
    const tax = Math.floor(parseFloat(subtotal) * 0.10).toFixed(2);
    const total = (parseFloat(subtotal) + parseFloat(tax)).toFixed(2);
    const paidAmount = status === "paid" ? total : status === "overdue" ? "0.00" : "0.00";

    // Issue every invoice before its due date so no invoice reads as "期限\n    // 作成前に" in the UI.
    let dueDate: string;
    let createdAt: Date;
    if (status === "paid") {
      const dueDaysAgo = Math.floor(Math.random() * 30);
      createdAt = daysAgo(dueDaysAgo + 14);
      dueDate = dateStr(daysAgo(dueDaysAgo));
    } else if (status === "overdue") {
      const dueDaysAgo = Math.floor(Math.random() * 14) + 1;
      createdAt = daysAgo(dueDaysAgo + 14);
      dueDate = dateStr(daysAgo(dueDaysAgo));
    } else {
      createdAt = daysAgo(Math.floor(Math.random() * 5));
      dueDate = dateStr(daysFromNow(30));
    }

    invoiceValues.push({
      practiceId,
      clientId: client.id,
      patientId: patient.id,
      appointmentId: appt?.id ?? null,
      status,
      subtotal,
      tax,
      total,
      paidAmount,
      dueDate,
      createdAt,
    });
  }

  const insertedInvoices = await db
    .insert(invoices)
    .values(invoiceValues)
    .returning();
  console.log(`Invoices: ${insertedInvoices.length} created`);

  // Invoice items
  const invoiceItemValues: {
    invoiceId: string;
    description: string;
    quantity: number;
    unitPrice: string;
    total: string;
    taxable: boolean;
    itemType: "service" | "product";
  }[] = [];

  for (const inv of insertedInvoices) {
    const numItems = 1 + Math.floor(Math.random() * 4);
    let runningTotal = 0;

    for (let j = 0; j < numItems; j++) {
      const svc = pickRandom(insertedServices);
      const qty = 1;
      const unitPrice = svc.defaultPrice;
      const itemTotal = (parseFloat(unitPrice) * qty).toFixed(2);
      runningTotal += parseFloat(itemTotal);

      invoiceItemValues.push({
        invoiceId: inv.id,
        description: svc.name,
        quantity: qty,
        unitPrice,
        total: itemTotal,
        taxable: svc.taxable,
        itemType: "service",
      });
    }
  }

  await db.insert(invoiceItems).values(invoiceItemValues);
  console.log(`Invoice items: ${invoiceItemValues.length} created`);

  // =========================================================================
  // 14. Products (50)
  // =========================================================================
  const productsData = [
    // Medications
    { name: "リマディル 75mg錠", sku: "MED-001", category: "薬", unitPrice: "210.00", costPrice: "100.00", stockQuantity: 2700, reorderPoint: 900 },
    { name: "メタカム 1.5mg/mL 経口懸濁液 — 1mLあたり", sku: "MED-002", category: "薬", unitPrice: "300.00", costPrice: "150.00", stockQuantity: 960, reorderPoint: 320 },
    { name: "クラバモックス 250mg タブレット", sku: "MED-003", category: "薬", unitPrice: "260.00", costPrice: "120.00", stockQuantity: 1400, reorderPoint: 420 },
    { name: "アポケル 16mg錠", sku: "MED-004", category: "薬", unitPrice: "630.00", costPrice: "390.00", stockQuantity: 750, reorderPoint: 300 },
    { name: "ガバペンチン 100mg カプセル", sku: "MED-005", category: "薬", unitPrice: "90.00", costPrice: "30.00", stockQuantity: 3600, reorderPoint: 1200 },
    { name: "セレニア 24mg タブレット", sku: "MED-006", category: "薬", unitPrice: "3560.00", costPrice: "2060.00", stockQuantity: 80, reorderPoint: 32 },
    { name: "トラゾドン 50mg錠", sku: "MED-007", category: "薬", unitPrice: "140.00", costPrice: "50.00", stockQuantity: 1200, reorderPoint: 450 },
    { name: "プレドニゾン 10mg錠", sku: "MED-008", category: "薬", unitPrice: "80.00", costPrice: "30.00", stockQuantity: 1650, reorderPoint: 600 },
    { name: "ベトメジン 2.5mg錠", sku: "MED-009", category: "薬", unitPrice: "440.00", costPrice: "260.00", stockQuantity: 750, reorderPoint: 250 },
    { name: "メトロニダゾール 250mg 錠剤", sku: "MED-010", category: "薬", unitPrice: "110.00", costPrice: "40.00", stockQuantity: 1500, reorderPoint: 450 },
    { name: "ドキサイクリン 100mg錠", sku: "MED-011", category: "薬", unitPrice: "160.00", costPrice: "60.00", stockQuantity: 1200, reorderPoint: 450 },
    { name: "エンロフロキサシン 68mg タブレット", sku: "MED-012", category: "薬", unitPrice: "160.00", costPrice: "80.00", stockQuantity: 1500, reorderPoint: 500 },
    { name: "セファレキシン 500mg カプセル", sku: "MED-013", category: "薬", unitPrice: "70.00", costPrice: "30.00", stockQuantity: 3500, reorderPoint: 1200 },
    { name: "トラマドール 50mg錠", sku: "MED-014", category: "薬", unitPrice: "90.00", costPrice: "40.00", stockQuantity: 1500, reorderPoint: 600 },
    { name: "エナラプリル 5mg錠", sku: "MED-015", category: "薬", unitPrice: "60.00", costPrice: "20.00", stockQuantity: 1800, reorderPoint: 600 },
    // Preventives
    { name: "ハートガード プラス (12kg-23kg, 6個入り)", sku: "PREV-001", category: "予防薬", unitPrice: "8250.00", costPrice: "4800.00", stockQuantity: 40, reorderPoint: 15 },
    { name: "ネクスガード (22.7-27.2kg, 6個入り)", sku: "PREV-002", category: "予防薬", unitPrice: "18000.00", costPrice: "10800.00", stockQuantity: 35, reorderPoint: 12 },
    { name: "シンパリカ トリオ (9.5-20kg, 6回分)", sku: "PREV-003", category: "予防薬", unitPrice: "20250.00", costPrice: "12300.00", stockQuantity: 28, reorderPoint: 10 },
    { name: "レボリューションプラス 猫用（2.5〜5kg、6本入り）", sku: "PREV-004", category: "予防薬", unitPrice: "18750.00", costPrice: "11250.00", stockQuantity: 25, reorderPoint: 10 },
    { name: "ブラベクト（10-20kg、1個）", sku: "PREV-005", category: "予防薬", unitPrice: "8700.00", costPrice: "5250.00", stockQuantity: 30, reorderPoint: 10 },
    // Supplements
    { name: "フォルトフローラ 犬用（30包）", sku: "SUP-001", category: "サプリメント", unitPrice: "4800.00", costPrice: "2700.00", stockQuantity: 45, reorderPoint: 15 },
    { name: "フォルトフローラ 猫用（30包）", sku: "SUP-002", category: "サプリメント", unitPrice: "4800.00", costPrice: "2700.00", stockQuantity: 35, reorderPoint: 12 },
    { name: "ダスクイン アドバンスド (84個入り)", sku: "SUP-003", category: "サプリメント", unitPrice: "9750.00", costPrice: "5700.00", stockQuantity: 25, reorderPoint: 8 },
    { name: "ウェラクチン オメガ3（120ソフトジェル）", sku: "SUP-004", category: "サプリメント", unitPrice: "6300.00", costPrice: "3300.00", stockQuantity: 20, reorderPoint: 8 },
    { name: "コセキン DS Plus MSM (132個)", sku: "SUP-005", category: "サプリメント", unitPrice: "8250.00", costPrice: "4500.00", stockQuantity: 22, reorderPoint: 8 },
    // Food
    { name: "ヒルズ サイエンスディライト 成犬用 (14kg)", sku: "FOOD-001", category: "フード", unitPrice: "10800.00", costPrice: "6750.00", stockQuantity: 15, reorderPoint: 5 },
    { name: "ロイヤルカナン 消化器サポート 低脂肪（8kg）", sku: "FOOD-002", category: "フード", unitPrice: "12750.00", costPrice: "7800.00", stockQuantity: 12, reorderPoint: 4 },
    { name: "ヒルズ 処方食 k/d (4kg)", sku: "FOOD-003", category: "フード", unitPrice: "7200.00", costPrice: "4200.00", stockQuantity: 10, reorderPoint: 4 },
    { name: "ロイヤルカナン ユリナリーS/O（8kg）", sku: "FOOD-004", category: "フード", unitPrice: "11700.00", costPrice: "7200.00", stockQuantity: 8, reorderPoint: 3 },
    { name: "ヒルズ サイエンスディライト 子猫用 (3kg)", sku: "FOOD-005", category: "フード", unitPrice: "4800.00", costPrice: "2700.00", stockQuantity: 10, reorderPoint: 4 },
    { name: "ピュリナ プロプラン センシティブスキン (13.6kg)", sku: "FOOD-006", category: "フード", unitPrice: "9300.00", costPrice: "5700.00", stockQuantity: 12, reorderPoint: 4 },
    { name: "ロイヤルカナン 加水分解タンパク（8kg）", sku: "FOOD-007", category: "フード", unitPrice: "13800.00", costPrice: "8700.00", stockQuantity: 6, reorderPoint: 3 },
    { name: "ヒルズ i/d 消化器ケア (4kg)", sku: "FOOD-008", category: "フード", unitPrice: "6750.00", costPrice: "3900.00", stockQuantity: 14, reorderPoint: 5 },
    // Supplies
    { name: "エリザベスカラー（中型）", sku: "SUP-S01", category: "消耗品", unitPrice: "2250.00", costPrice: "750.00", stockQuantity: 30, reorderPoint: 10 },
    { name: "エリザベスカラー（大型）", sku: "SUP-S02", category: "消耗品", unitPrice: "2700.00", costPrice: "900.00", stockQuantity: 25, reorderPoint: 10 },
    { name: "ピルポケット - チキン (30個入り)", sku: "SUP-S03", category: "消耗品", unitPrice: "1800.00", costPrice: "900.00", stockQuantity: 50, reorderPoint: 15 },
    { name: "ピルポケット - ピーナッツバター (30個入り)", sku: "SUP-S04", category: "消耗品", unitPrice: "1800.00", costPrice: "900.00", stockQuantity: 45, reorderPoint: 15 },
    { name: "ジェントルリーダー ヘッドカラー（Mサイズ）", sku: "SUP-S05", category: "消耗品", unitPrice: "3300.00", costPrice: "1800.00", stockQuantity: 15, reorderPoint: 5 },
    { name: "マイクロチップ (HomeAgain)", sku: "SUP-S06", category: "消耗品", unitPrice: "5250.00", costPrice: "2700.00", stockQuantity: 40, reorderPoint: 15 },
    { name: "ベトラップ包帯 (4インチ x 5ヤード)", sku: "SUP-S07", category: "消耗品", unitPrice: "600.00", costPrice: "220.00", stockQuantity: 100, reorderPoint: 30 },
    { name: "絆創膏ロール", sku: "SUP-S08", category: "消耗品", unitPrice: "900.00", costPrice: "300.00", stockQuantity: 80, reorderPoint: 25 },
    { name: "耳洗浄液 (8 oz)", sku: "SUP-S09", category: "消耗品", unitPrice: "2100.00", costPrice: "1050.00", stockQuantity: 35, reorderPoint: 10 },
    { name: "クロルヘキシジン洗浄液 (8 oz)", sku: "SUP-S10", category: "消耗品", unitPrice: "2400.00", costPrice: "1200.00", stockQuantity: 30, reorderPoint: 10 },
    { name: "デンタルチュー（大型、30個入り）", sku: "SUP-S11", category: "消耗品", unitPrice: "4200.00", costPrice: "2100.00", stockQuantity: 25, reorderPoint: 8 },
    { name: "シリンジ 3mL（100本入り）", sku: "SUP-S12", category: "消耗品", unitPrice: "2700.00", costPrice: "1200.00", stockQuantity: 20, reorderPoint: 5 },
    { name: "IVカテーテル 20ga (50本)", sku: "SUP-S13", category: "消耗品", unitPrice: "6750.00", costPrice: "3300.00", stockQuantity: 15, reorderPoint: 5 },
    { name: "手術用手袋（Mサイズ、100枚入り）", sku: "SUP-S14", category: "消耗品", unitPrice: "3750.00", costPrice: "1800.00", stockQuantity: 18, reorderPoint: 5 },
    { name: "KYジェリー潤滑剤 (4 oz)", sku: "SUP-S15", category: "消耗品", unitPrice: "1200.00", costPrice: "450.00", stockQuantity: 20, reorderPoint: 8 },
    { name: "糞便採取容器 (50個入り)", sku: "SUP-S16", category: "消耗品", unitPrice: "2250.00", costPrice: "900.00", stockQuantity: 25, reorderPoint: 8 },
    { name: "ペット用爪切り（プロ仕様）", sku: "SUP-S17", category: "消耗品", unitPrice: "2700.00", costPrice: "1200.00", stockQuantity: 10, reorderPoint: 3 },
  ];

  const insertedProducts = await db
    .insert(products)
    .values(
      productsData.map((p) => ({
        practiceId,
        locationId,
        name: p.name,
        sku: p.sku,
        category: p.category,
        unitPrice: p.unitPrice,
        taxable: true,
        costPrice: p.costPrice,
        stockQuantity: p.stockQuantity,
        reorderPoint: p.reorderPoint,
      }))
    )
    .returning();
  console.log(`Products: ${insertedProducts.length} created`);

  // =========================================================================
  // 16. Payments — one per paid invoice
  // =========================================================================
  const frontDeskUsers = insertedUsers.filter((u) => u.role === "front_desk");
  const vetUsers = insertedUsers.filter((u) => u.role === "veterinarian");
  const techUsers = insertedUsers.filter((u) => u.role === "technician");
  const adminUser = insertedUsers.find((u) => u.role === "admin")!;
  const paidInvoices = insertedInvoices.filter((i) => i.status === "paid");
  const paymentMethods = ["credit_card", "credit_card", "debit_card", "cash", "check", "credit_card", "online"] as const;

  const paymentValues = paidInvoices.map((inv, i) => ({
    invoiceId: inv.id,
    amount: inv.total,
    method: paymentMethods[i % paymentMethods.length]!,
    receivedBy: frontDeskUsers[i % frontDeskUsers.length]!.id,
    receivedAt: daysAgo(Math.floor(Math.random() * 14)),
    notes: null,
  }));
  const insertedPayments = await db.insert(payments).values(paymentValues).returning();
  console.log(`Payments: ${insertedPayments.length} created`);

  // =========================================================================
  // 17. Communications — messages, calls, emails, portal
  // =========================================================================
  type CommRow = typeof communications.$inferInsert;
  const commValues: CommRow[] = [];
  const someClients = insertedClients.slice(0, 12);

  // SMS appointment reminders (outbound, delivered)
  for (let i = 0; i < 5; i++) {
    commValues.push({
      practiceId,
      clientId: someClients[i]!.id,
      channel: "sms",
      direction: "outbound",
      subject: null,
      content: `Hi ${someClients[i]!.firstName}, this is Neighborhood Veterinary reminding you of your appointment tomorrow. Reply C to confirm or R to reschedule.`,
      status: "delivered",
      assignedTo: frontDeskUsers[i % frontDeskUsers.length]!.id,
      createdAt: daysAgo(Math.floor(Math.random() * 7)),
    });
  }

  // Emails — wellness reminders + Rx refill reply + invoice copy
  const emailSubjects = [
    { subject: "ペットの年次健康診断の時期です", content: "年次の健康診断の時期です。このメールに返信するか、クリニックにお電話で予約をしてください。" },
    { subject: "ワクチン追加接種の通知", content: "あなたのペットは今月、混合ワクチン（DHPP）の追加接種が必要です。火曜日と木曜日の午後に空きがあります。" },
    { subject: "件名：リマディの処方再発行について", content: "処方再依頼ありがとうございます。30日分の再処方を承認しました。今週の診療時間内にいつでもお受け取りいただけます。" },
    { subject: "請求書の写し — 直近の来院分", content: "最近のご診察の詳細な請求書を添付いたします。ご不明な点がございましたらお知らせください。" },
  ];
  emailSubjects.forEach((e, i) => {
    commValues.push({
      practiceId,
      clientId: someClients[5 + i]!.id,
      channel: "email",
      direction: "outbound",
      subject: e.subject,
      content: e.content,
      status: "sent",
      assignedTo: frontDeskUsers[i % frontDeskUsers.length]!.id,
      createdAt: daysAgo(Math.floor(Math.random() * 10) + 1),
    });
  });

  // Portal messages — inbound from clients
  const portalMessages = [
    { subject: "ルナの投薬に関する質問", content: "ルナにリマディールを食事と一緒に与えても大丈夫ですか？空腹時に服用した後、胃腸の調子が悪いようです。" },
    { subject: "火曜日の予約変更", content: "こんにちは。仕事のスケジュールが変わりました。火曜日の予約を週の後半に変更できますか？" },
    { subject: "預かりに必要なワクチン接種記録", content: "来週末にマックスを預けます。彼のワクチン接種記録をケネルに送ってもらえますか？" },
  ];
  portalMessages.forEach((m, i) => {
    commValues.push({
      practiceId,
      clientId: someClients[9 + i]!.id,
      channel: "portal",
      direction: "inbound",
      subject: m.subject,
      content: m.content,
      status: "delivered",
      assignedTo: i === 0 ? vetUsers[0]!.id : frontDeskUsers[0]!.id,
      createdAt: daysAgo(Math.floor(Math.random() * 5)),
    });
  });

  // Phone call logs
  const callLogs = [
    { content: "飼い主より左後肢の跛行について電話あり。今朝から症状が出ているとのこと。本日来院するよう指導し、午後3時の枠を予約。", direction: "inbound" as const },
    { content: "明日の歯科手術の同意確認のため電話。飼い主は午前7時30分の預かり、午後10時からの絶食を確認済み。", direction: "outbound" as const },
    { content: "術後経過確認電話 — 患者は通常通り食事を摂取しており、縫合糸も清潔。10日後に再診を予約。", direction: "outbound" as const },
  ];
  callLogs.forEach((c, i) => {
    commValues.push({
      practiceId,
      clientId: someClients[i]!.id,
      channel: "phone",
      direction: c.direction,
      subject: null,
      content: c.content,
      status: "delivered",
      assignedTo: frontDeskUsers[i % frontDeskUsers.length]!.id,
      createdAt: daysAgo(Math.floor(Math.random() * 5)),
    });
  });

  const insertedComms = await db.insert(communications).values(commValues).returning();
  console.log(`Communications: ${insertedComms.length} created`);

  // =========================================================================
  // 18. Audit log — recent practice activity
  // =========================================================================
  type AuditRow = typeof auditLog.$inferInsert;
  const auditValues: AuditRow[] = [];

  const samplePatients = insertedPatients.slice(0, 15);
  const sampleAppts = insertedAppointments.slice(0, 20);
  const sampleInvoicesForAudit = insertedInvoices.slice(0, 10);
  const auditIp = () => `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;

  // Appointment lifecycle events
  sampleAppts.slice(0, 12).forEach((appt, i) => {
    auditValues.push({
      practiceId,
      userId: frontDeskUsers[i % frontDeskUsers.length]!.id,
      action: "appointment.created",
      entityType: "appointment",
      entityId: appt.id,
      changes: { status: "scheduled" },
      ipAddress: auditIp(),
      createdAt: daysAgo(Math.floor(Math.random() * 7)),
    });
  });
  sampleAppts.slice(0, 6).forEach((appt, i) => {
    auditValues.push({
      practiceId,
      userId: frontDeskUsers[i % frontDeskUsers.length]!.id,
      action: "appointment.checked_in",
      entityType: "appointment",
      entityId: appt.id,
      changes: { status: "checked_in" },
      ipAddress: auditIp(),
      createdAt: daysAgo(Math.floor(Math.random() * 3)),
    });
  });

  // Invoice lifecycle
  sampleInvoicesForAudit.slice(0, 6).forEach((inv, i) => {
    auditValues.push({
      practiceId,
      userId: frontDeskUsers[i % frontDeskUsers.length]!.id,
      action: "invoice.created",
      entityType: "invoice",
      entityId: inv.id,
      changes: { total: inv.total },
      ipAddress: auditIp(),
      createdAt: daysAgo(Math.floor(Math.random() * 14)),
    });
  });
  paidInvoices.slice(0, 4).forEach((inv, i) => {
    auditValues.push({
      practiceId,
      userId: frontDeskUsers[i % frontDeskUsers.length]!.id,
      action: "invoice.paid",
      entityType: "invoice",
      entityId: inv.id,
      changes: { status: "paid", paidAmount: inv.total },
      ipAddress: auditIp(),
      createdAt: daysAgo(Math.floor(Math.random() * 10)),
    });
  });

  // Patient record edits by vets
  samplePatients.slice(0, 5).forEach((patient, i) => {
    auditValues.push({
      practiceId,
      userId: vetUsers[i % vetUsers.length]!.id,
      action: "patient.updated",
      entityType: "patient",
      entityId: patient.id,
      changes: { weight: "updated" },
      ipAddress: auditIp(),
      createdAt: daysAgo(Math.floor(Math.random() * 5)),
    });
  });

  // Login events (practice-level, not tied to an entity)
  [adminUser, ...vetUsers, ...frontDeskUsers].forEach((user, i) => {
    auditValues.push({
      practiceId,
      userId: user.id,
      action: "user.login",
      entityType: "user",
      entityId: user.id,
      changes: null,
      ipAddress: auditIp(),
      createdAt: daysAgo(Math.floor(Math.random() * 2)),
    });
  });

  const insertedAudit = await db.insert(auditLog).values(auditValues).returning();
  console.log(`Audit log entries: ${insertedAudit.length} created`);

  // =========================================================================
  // 19. Controlled substance log — DEA-compliant dispense trail
  // =========================================================================
  type CsLogRow = typeof controlledSubstanceLog.$inferInsert;
  const csEntries: CsLogRow[] = [
    {
      practiceId,
      drugName: "トラマドール塩酸塩 50mg",
      deaSchedule: "IV",
      action: "administered",
      quantity: "2.000",
      unit: "tablet",
      patientId: samplePatients[0]!.id,
      performedBy: vetUsers[0]!.id,
      witnessedBy: techUsers[0]!.id,
      lotNumber: "TR-2026-0318-A",
      notes: "術後の痛み管理、抜歯",
      performedAt: daysAgo(2),
    },
    {
      practiceId,
      drugName: "ブプレノルフィン 0.3 mg/mL",
      deaSchedule: "III",
      action: "administered",
      quantity: "0.500",
      unit: "mL",
      patientId: samplePatients[1]!.id,
      performedBy: vetUsers[1]!.id,
      witnessedBy: techUsers[0]!.id,
      lotNumber: "BUP-2026-Q1-7",
      notes: "術前鎮痛",
      performedAt: daysAgo(4),
    },
    {
      practiceId,
      drugName: "フェノバルビタール 30mg",
      deaSchedule: "IV",
      action: "administered",
      quantity: "30.000",
      unit: "tablet",
      patientId: samplePatients[2]!.id,
      performedBy: vetUsers[0]!.id,
      witnessedBy: techUsers[1]!.id,
      lotNumber: "PB-2026-0201",
      notes: "痙攣コントロールのための30日分を処方",
      performedAt: daysAgo(6),
    },
    {
      practiceId,
      drugName: "ケタミン 100 mg/mL",
      deaSchedule: "III",
      action: "administered",
      quantity: "1.200",
      unit: "mL",
      patientId: samplePatients[3]!.id,
      performedBy: vetUsers[2]!.id,
      witnessedBy: techUsers[0]!.id,
      lotNumber: "KET-2026-0405",
      notes: "避妊手術のための導入麻酔",
      performedAt: daysAgo(1),
    },
    {
      practiceId,
      drugName: "モルヒネ 15 mg/mL",
      deaSchedule: "II",
      action: "wasted",
      quantity: "0.200",
      unit: "mL",
      patientId: null,
      performedBy: vetUsers[0]!.id,
      witnessedBy: vetUsers[1]!.id,
      lotNumber: "MOR-2026-0112",
      notes: "投与準備後のバイアルの残量廃棄 — 廃棄を確認済み",
      performedAt: daysAgo(3),
    },
    {
      practiceId,
      drugName: "ガバペンチン 100mg",
      deaSchedule: "V",
      action: "administered",
      quantity: "60.000",
      unit: "capsule",
      patientId: samplePatients[4]!.id,
      performedBy: vetUsers[1]!.id,
      witnessedBy: techUsers[1]!.id,
      lotNumber: "GAB-2026-0227",
      notes: "慢性疼痛管理のための30日分",
      performedAt: daysAgo(8),
    },
  ];
  const insertedCs = await db.insert(controlledSubstanceLog).values(csEntries).returning();
  console.log(`Controlled substance log: ${insertedCs.length} created`);

  // =========================================================================
  // 20. Treatment templates — common procedure bundles
  // =========================================================================
  type TemplateRow = typeof treatmentTemplates.$inferInsert;
  const templatesData: Array<TemplateRow & { items: Array<{ description: string; defaultQuantity: number; defaultUnitPrice: string }> }> = [
    {
      practiceId,
      name: "健康診断 — 成犬",
      description: "成犬の標準的な年次健康診断。身体検査、フィラリア検査、および便検査を含む。",
      category: "健康診断",
      isActive: true,
      items: [
        { description: "身体診察 (15分)", defaultQuantity: 1, defaultUnitPrice: "65.00" },
        { description: "フィラリア抗原検査", defaultQuantity: 1, defaultUnitPrice: "45.00" },
        { description: "糞便浮遊法", defaultQuantity: 1, defaultUnitPrice: "35.00" },
      ],
    },
    {
      practiceId,
      name: "子犬用混合ワクチン（DHPP）追加接種",
      description: "子犬の定期ワクチン接種 — DHPPブースターと簡易診察。",
      category: "ワクチン接種",
      isActive: true,
      items: [
        { description: "簡易診察（10分）", defaultQuantity: 1, defaultUnitPrice: "45.00" },
        { description: "DHPPワクチン", defaultQuantity: 1, defaultUnitPrice: "32.00" },
      ],
    },
    {
      practiceId,
      name: "歯科予防 — 標準",
      description: "麻酔下での定期的な歯科クリーニング。術前の血液検査およびスケーリング・ポリッシングを含む。",
      category: "歯科",
      isActive: true,
      items: [
        { description: "麻酔前血液検査", defaultQuantity: 1, defaultUnitPrice: "95.00" },
        { description: "全身麻酔（最初の30分）", defaultQuantity: 1, defaultUnitPrice: "180.00" },
        { description: "スケーリングおよびポリッシング", defaultQuantity: 1, defaultUnitPrice: "220.00" },
        { description: "点滴静注", defaultQuantity: 1, defaultUnitPrice: "55.00" },
      ],
    },
    {
      practiceId,
      name: "犬避妊手術 — 18kg未満",
      description: "小型・中型犬の通常の避妊手術。麻酔、手術、および3日間の鎮痛剤を含む。",
      category: "手術",
      isActive: true,
      items: [
        { description: "術前診察および血液検査", defaultQuantity: 1, defaultUnitPrice: "135.00" },
        { description: "避妊手術（18kg未満）", defaultQuantity: 1, defaultUnitPrice: "385.00" },
        { description: "全身麻酔（60分）", defaultQuantity: 1, defaultUnitPrice: "220.00" },
        { description: "内服用鎮痛薬（3日分）", defaultQuantity: 1, defaultUnitPrice: "28.00" },
        { description: "エリザベスカラー", defaultQuantity: 1, defaultUnitPrice: "18.00" },
      ],
    },
  ];

  for (const tpl of templatesData) {
    const { items, ...tplFields } = tpl;
    const [inserted] = await db.insert(treatmentTemplates).values(tplFields).returning();
    await db.insert(treatmentTemplateItems).values(
      items.map((item, idx) => ({
        templateId: inserted!.id,
        itemType: "service" as const,
        itemId: null,
        description: item.description,
        defaultQuantity: item.defaultQuantity,
        defaultUnitPrice: item.defaultUnitPrice,
        sortOrder: idx,
      }))
    );
  }
  console.log(`Treatment templates: ${templatesData.length} created`);

  // =========================================================================
  // Done!
  // =========================================================================
  console.log("\nシードが正常に完了しました！");
  console.log(`
Summary:
  - 1 practice
  - 1 location
  - ${insertedUsers.length} users (3 vets, 2 techs, 2 front desk)
  - ${insertedClients.length} clients
  - ${insertedPatients.length} patients
  - ${insertedApptTypes.length} appointment types
  - ${insertedRooms.length} exam rooms
  - ${insertedAppointments.length} appointments
  - ${soapNotesCount} SOAP notes
  - ${vaccinationValues.length} vaccination records
  - ${prescriptionValues.length} prescriptions
  - ${labResultValues.length + 1} lab results
  - ${procedureValues.length} procedures
  - ${insertedInvoices.length} invoices with ${invoiceItemValues.length} line items
  - ${insertedPayments.length} payments
  - ${insertedComms.length} communications (SMS/email/portal/phone)
  - ${insertedAudit.length} audit log entries
  - ${insertedCs.length} controlled substance log entries
  - ${templatesData.length} treatment templates
  - ${insertedServices.length} services
  - ${insertedProducts.length} products
  `);
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("シード失敗:", err);
    process.exit(1);
  });
