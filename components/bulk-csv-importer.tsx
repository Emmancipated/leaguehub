"use client";

import { useState, type ReactNode, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload, Download, Check, X, Loader2 } from "lucide-react";

import { parseCsv } from "@/lib/csv";

export type BulkColumn = {
  key: string;
  label: string;
  required?: boolean;
};

export type BulkCsvImporterProps = {
  tournamentId: string;
  endpoint: string;
  resourceLabel: string;
  title?: string;
  columns: BulkColumn[];
  sampleCsv: string;
};

export type BulkResult = {
  created: number;
  skipped: number;
  errors: { row: number; error: string }[];
};

function classNames(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function BulkCsvImporter({
  tournamentId,
  endpoint,
  resourceLabel,
  title,
  columns,
  sampleCsv,
}: BulkCsvImporterProps) {
  const router = useRouter();

  const [csvText, setCsvText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BulkResult | null>(null);

  const parsedRows = csvText ? parseCsv(csvText) : [];
  const dataRowCount =
    parsedRows.length > 1
      ? parsedRows.filter((row) => row.some((cell) => cell && cell.trim() !== ""))
          .length - 1
      : 0;

  const sampleUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(sampleCsv)}`;

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const text = await file.text();
      setCsvText(text);
      setError("");
      setResult(null);
    } catch {
      setError("Failed to read the selected file.");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csv: csvText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import rows.");
      }

      const bulkResult: BulkResult = data;
      setResult(bulkResult);

      if (bulkResult.created > 0) {
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-10 rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {title ?? `Bulk Import ${resourceLabel}`}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Upload a CSV file or paste CSV text below to register multiple{" "}
            {resourceLabel.toLowerCase()} at once.
          </p>
        </div>

        <a
          href={sampleUrl}
          download={`sample-${resourceLabel.toLowerCase()}.csv`}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Sample CSV
        </a>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-600">
        {columns.map((column) => (
          <span
            key={column.key}
            className={classNames(
              "rounded-full border px-2.5 py-0.5",
              column.required
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-gray-200 bg-gray-50 text-gray-600",
            )}
          >
            {column.label}
            {column.required && " (required)"}
          </span>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Upload CSV file
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-100">
            <Upload className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">{`Choose a .csv file for ${resourceLabel.toLowerCase()}`}</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            CSV text
          </label>

          <textarea
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value);
              setResult(null);
            }}
            placeholder={sampleCsv}
            rows={8}
            className="w-full rounded-lg border border-gray-400 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
          />
        </div>

        {dataRowCount > 0 && (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Parsed <strong className="text-gray-700">{dataRowCount}</strong>{" "}
              data row(s) (excluding header).
            </span>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500">
            Tournament: {tournamentId}
          </span>

          <button
            type="submit"
            disabled={submitting || dataRowCount === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>Import</>
            )}
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-4">
          <div className="flex items-center gap-4 text-sm">
            <StatusIcon ok={true}>
              <Check className="h-4 w-4" />
            </StatusIcon>
            <span className="font-medium text-emerald-700">
              {result.created} {resourceLabel.toLowerCase()} imported.
            </span>

            {result.skipped > 0 && (
              <>
                <StatusIcon ok={false}>
                  <X className="h-4 w-4" />
                </StatusIcon>
                <span className="font-medium text-red-700">
                  {result.skipped} skipped.
                </span>
              </>
            )}
          </div>

          {result.errors.length > 0 && (
            <div className="mt-3">
              <div className="mb-2 text-xs font-medium text-gray-600">
                Errors ({result.errors.length})
              </div>

              <div className="max-h-56 overflow-y-auto rounded-md border bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 font-medium">Row</th>
                      <th className="px-3 py-2 font-medium">Error</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {result.errors.map((entry, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2">{entry.row}</td>
                        <td className="px-3 py-2 text-red-700">
                          {entry.error}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusIcon({
  ok,
  children,
}: {
  ok: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={
        ok
          ? "flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
          : "flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-700"
      }
    >
      {children}
    </span>
  );
}

const TEAMS_COLUMNS: BulkColumn[] = [
  { key: "name", label: "name", required: true },
  { key: "shortName", label: "shortName" },
  { key: "logoUrl", label: "logoUrl" },
  { key: "group", label: "group" },
];

const PLAYERS_COLUMNS: BulkColumn[] = [
  { key: "firstName", label: "firstName", required: true },
  { key: "lastName", label: "lastName" },
  { key: "displayName", label: "displayName" },
  { key: "jerseyNumber", label: "jerseyNumber" },
  { key: "dateOfBirth", label: "dateOfBirth" },
  { key: "phoneNumber", label: "phoneNumber" },
  { key: "team", label: "team" },
];

export const TEAMS_SAMPLE_CSV = [
  "name,shortName,logoUrl,group",
  "Arsenal FC,ARS,https://example.com/ars.png,Group A",
  'Chelsea FC,CHE,,Group B',
  "Liverpool FC,LIV,https://example.com/liv.png,Group B",
].join("\n");

export const PLAYERS_SAMPLE_CSV = [
  "firstName,lastName,displayName,jerseyNumber,dateOfBirth,phoneNumber,team",
  "John,Smith,John \"JD\" Smith,10,1998-05-12,08012345678,Arsenal FC",
  "Jane,Doe,JD,7,2000-03-08,,Chelsea FC",
  "Sam,Brown,,12,1999-11-22,08087654321,",
].join("\n");

export const TEAMS_COLUMNS_CONFIG = TEAMS_COLUMNS;
export const PLAYERS_COLUMNS_CONFIG = PLAYERS_COLUMNS;

export function BulkTeamsImporter({
  tournamentId,
}: {
  tournamentId: string;
}) {
  return (
    <BulkCsvImporter
      tournamentId={tournamentId}
      endpoint={`/api/tournaments/${tournamentId}/teams/bulk`}
      resourceLabel="Teams"
      title="Bulk Import Teams"
      columns={TEAMS_COLUMNS_CONFIG}
      sampleCsv={TEAMS_SAMPLE_CSV}
    />
  );
}

export function BulkPlayersImporter({
  tournamentId,
}: {
  tournamentId: string;
}) {
  return (
    <BulkCsvImporter
      tournamentId={tournamentId}
      endpoint={`/api/tournaments/${tournamentId}/players/bulk`}
      resourceLabel="Players"
      title="Bulk Import Players"
      columns={PLAYERS_COLUMNS_CONFIG}
      sampleCsv={PLAYERS_SAMPLE_CSV}
    />
  );
}
