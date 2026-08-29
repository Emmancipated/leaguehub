"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

function createSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewTournamentPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    description: "",
    numberOfTeams: 8,
    startDate: "",
    endDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(
    field: keyof typeof form,
    value: string | number,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const slug = createSlug(form.name);

      const response = await fetch("/api/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          slug,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create tournament.",
        );
      }

      router.push(
        `/admin/tournaments/${data.tournament.id}`,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Create Tournament
          </h1>

          <p className="mt-2 text-gray-600">
            Set up the basic details for your tournament.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl bg-white p-8 shadow-sm"
        >
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Tournament Name
            </label>

            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                updateField("name", e.target.value)
              }
              placeholder="Achievers 6-A-Side Football Tournament"
              required
              className="w-full rounded-lg border border-gray-400 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Description
            </label>

            <textarea
              value={form.description}
              onChange={(e) =>
                updateField(
                  "description",
                  e.target.value,
                )
              }
              placeholder="Tournament description..."
              rows={4}
              className="w-full rounded-lg border border-gray-400 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Number of Teams
            </label>

            <input
              type="number"
              min={2}
              value={form.numberOfTeams}
              onChange={(e) =>
                updateField(
                  "numberOfTeams",
                  Number(e.target.value),
                )
              }
              required
              className="w-full rounded-lg border border-gray-400 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
            />

            <p className="mt-2 text-sm text-gray-500">
              Teams can be customized later. Fixtures
              will be generated from the registered teams.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Start Date
              </label>

              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  updateField(
                    "startDate",
                    e.target.value,
                  )
                }
                className="w-full rounded-lg border border-gray-400 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                End Date
              </label>

              <input
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  updateField(
                    "endDate",
                    e.target.value,
                  )
                }
                className="w-full rounded-lg border border-gray-400 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
              />
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-5">
            <h2 className="font-semibold text-gray-900">
              Competition Format
            </h2>

            <div className="mt-3 space-y-2 text-sm text-gray-600">
              <p>• League format</p>
              <p>• Every team plays every other team once</p>
              <p>• Win = 3 points</p>
              <p>• Draw = 1 point</p>
              <p>• Loss = 0 points</p>
              <p>
                • Tie-break: Goal Difference → Goals
                Scored → Head-to-Head → Fair Play → Draw
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Creating Tournament..."
              : "Create Tournament"}
          </button>
        </form>
      </div>
    </main>
  );
}
