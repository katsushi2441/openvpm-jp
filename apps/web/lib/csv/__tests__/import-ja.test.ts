import { describe, expect, it } from "vitest";
import { csvToClientRecords, csvToPatientRecords } from "../import";
import {
  normalizeDateValue,
  normalizeSexValue,
  normalizeSpeciesValue,
} from "../../import/normalize";

// Paper charts in Japan are usually typed into a spreadsheet with Japanese
// column names and values before they are imported.
describe("Japanese spreadsheet import", () => {
  it("reads owners from Japanese column names", () => {
    const csv = [
      "飼い主番号,姓,名,メールアドレス,電話番号,郵便番号,都道府県,市区町村,住所",
      "C-001,鈴木,一郎,ichiro@example.com,090-0000-1001,000-0001,愛知県,名古屋市（架空）,1-2-3",
    ].join("\n");
    const { records, errors } = csvToClientRecords(csv);
    expect(errors).toEqual([]);
    expect(records[0]).toMatchObject({
      externalClientId: "C-001",
      lastName: "鈴木",
      firstName: "一郎",
      email: "ichiro@example.com",
      state: "愛知県",
    });
  });

  it("reads pets with Japanese species, sex and dates", () => {
    const csv = [
      "カルテ番号,飼い主番号,動物名,動物種,品種,性別,生年月日",
      "P-001,C-001,もち,猫,スコティッシュフォールド,避妊メス,2021/2/20",
      "P-002,C-001,くま,犬,柴犬,去勢オス,令和3年12月1日",
    ].join("\n");
    const { records, errors } = csvToPatientRecords(csv);
    expect(errors).toEqual([]);
    expect(records[0]).toMatchObject({ name: "もち", species: "feline", sex: "female_spayed", dob: "2021-02-20" });
    expect(records[1]).toMatchObject({ name: "くま", species: "canine", sex: "male_neutered", dob: "2021-12-01" });
  });
});

describe("Japanese value normalizers", () => {
  it("maps species", () => {
    expect(normalizeSpeciesValue("犬")).toBe("canine");
    expect(normalizeSpeciesValue("ネコ")).toBe("feline");
    expect(normalizeSpeciesValue("ウサギ")).toBe("rabbit");
    expect(normalizeSpeciesValue("ハムスター")).toBe("other");
  });
  it("maps sex", () => {
    expect(normalizeSexValue("オス")).toBe("male");
    expect(normalizeSexValue("メス（避妊済み）")).toBe("female_spayed");
    expect(normalizeSexValue("去勢済み")).toBe("male_neutered");
  });
  it("reads year-first and Japanese era dates", () => {
    expect(normalizeDateValue("2019/3/5")).toBe("2019-03-05");
    expect(normalizeDateValue("2019年3月5日")).toBe("2019-03-05");
    expect(normalizeDateValue("２０１９／０３／０５")).toBe("2019-03-05");
    expect(normalizeDateValue("令和元年5月1日")).toBe("2019-05-01");
    expect(normalizeDateValue("平成31年4月30日")).toBe("2019-04-30");
    expect(normalizeDateValue("R5.3.5")).toBe("2023-03-05");
    expect(normalizeDateValue("2019/2/30")).toBeNull();
    // US month/day/year is unchanged
    expect(normalizeDateValue("3/5/2019")).toBe("2019-03-05");
  });
});
