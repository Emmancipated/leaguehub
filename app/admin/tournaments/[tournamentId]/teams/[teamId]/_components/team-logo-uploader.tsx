"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChangeEvent } from "react";

type Props = {
  tournamentId: string;
  teamId: string;
  initialLogoUrl: string | null;
};

export default function TeamLogoUploader({
  tournamentId,
  teamId,
  initialLogoUrl,
}: Props) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const form = new FormData();
      form.append("file", file);

      const upload = await fetch("/api/admin/upload-logo", {
        method: "POST",
        body: form,
      });
      const uploadData = await upload.json();

      if (!upload.ok) {
        throw new Error(uploadData.error || "Upload failed");
      }

      const patch = await fetch(
        `/api/admin/tournaments/${tournamentId}/teams/${teamId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logoUrl: uploadData.url }),
        },
      );

      const patchData = await patch.json();

      if (!patch.ok) {
        throw new Error(patchData.error || "Failed to save logo");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {initialLogoUrl && (
        <p className="text-xs text-gray-500">
          Current logo:{" "}
          <a
            href={initialLogoUrl}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            {initialLogoUrl}
          </a>
        </p>
      )}

      <input
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        onChange={onFileChange}
        disabled={uploading}
        className="mt-2 block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-black file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-gray-800"
      />

      {uploading && (
        <p className="mt-1 text-xs text-blue-600">Uploading logo…</p>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
