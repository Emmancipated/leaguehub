export type CsvRow = string[];

export function parseCsv(text: string): CsvRow[] {
  const rows: CsvRow[] = [];
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  let row: CsvRow = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];

    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }

  row.push(field);
  rows.push(row);

  return rows;
}

export function normalizeHeader(cell: string): string {
  return cell.trim().toLowerCase().replace(/\s+/g, "");
}

export function columnIndex(
  header: string[],
  key: string,
): number {
  return header.indexOf(normalizeHeader(key));
}
