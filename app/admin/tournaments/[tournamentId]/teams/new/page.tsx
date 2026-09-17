"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function NewTeamPage() {
  const router = useRouter();
  const params = useParams();

  const tournamentId = params.tournamentId as string;

  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onLogoFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    setError("");

    try {
      const form = new FormData();
      form.append("file", file);

      const response = await fetch("/api/admin/upload-logo", {
        method: "POST",
        body: form,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Logo upload failed");
      }

      setLogoUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logo upload failed");
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/teams`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            shortName,
            logoUrl,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create team");
      }

      router.push(`/admin/tournaments/${tournamentId}/teams`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
      <div className="mx-auto max-w-2xl">

        <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Add Team</h1>

          <p className="mt-1 text-sm text-gray-500">
            Add a team to this tournament.
          </p>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Team name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Arsenal FC"
                required
                className="w-full rounded-lg border border-gray-400 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Short name
              </label>

              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="e.g. ARS"
                maxLength={10}
                className="w-full rounded-lg border border-gray-400 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Logo URL
              </label>

              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-400 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
              />

              <p className="mt-3 text-xs text-gray-500">
                Or upload an image — it&apos;s stored on Vercel and the URL is saved
                into the team record automatically.
              </p>

              <input
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={onLogoFileChange}
                disabled={logoUploading}
                className="mt-3 block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-gray-800"
              />

              {logoUploading && (
                <p className="mt-2 text-xs text-blue-600">Uploading logo…</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Team"}
            </button>
          </form>
        </div>
      </div>
  );
}
