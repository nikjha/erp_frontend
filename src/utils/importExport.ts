import * as XLSX from "xlsx";
import Papa from "papaparse";
import type { GenericRecord } from "../types/api";
import type { FieldConfig } from "../types/module";

export function exportRecords(
  records: GenericRecord[],
  fields: FieldConfig[],
  format: "csv" | "xlsx" | "json",
  filename: string
) {
  const rows = records.map((r) => {
    const row: Record<string, unknown> = {};
    for (const f of fields) row[f.label] = r[f.name];
    return row;
  });

  if (format === "json") {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    downloadBlob(blob, `${filename}.json`);
    return;
  }
  if (format === "csv") {
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${filename}.csv`);
    return;
  }
  // xlsx
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, filename.slice(0, 31));
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImportFile(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => resolve(result.data as Record<string, unknown>[]),
        error: reject,
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(e.target?.result, { type: "binary" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(sheet));
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    }
  });
}
