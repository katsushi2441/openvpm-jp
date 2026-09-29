/**
 * Read a CSV file with the right text encoding. Spreadsheet software in Japan
 * saves "CSV" as Shift_JIS by default; reading that as UTF-8 garbles every
 * Japanese header and value. Valid UTF-8 (with or without a BOM) is read as
 * UTF-8; anything else is read as Shift_JIS.
 */
export function readCsvAsText(reader: FileReader, file: Blob): void {
  void file
    .arrayBuffer()
    .then((buffer) => {
      let encoding = "utf-8";
      try {
        new TextDecoder("utf-8", { fatal: true }).decode(buffer);
      } catch {
        encoding = "shift_jis";
      }
      reader.readAsText(file, encoding);
    })
    .catch(() => reader.readAsText(file));
}
