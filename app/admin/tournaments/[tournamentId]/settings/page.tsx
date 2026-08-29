"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";

const tieBreakerOptions = [
  { value: "GOAL_DIFFERENCE", label: "Goal Difference" },
  { value: "GOALS_SCORED", label: "Goals Scored" },
  { value: "HEAD_TO_HEAD", label: "Head-to-Head" },
  { value: "FAIR_PLAY", label: "Fair Play" },
  { value: "DRAW", label: "Random Draw" },
];

const defaultSettings = {
  competitionFormat: "LEAGUE",
  roundRobinType: "SINGLE",
  numberOfTeams: 8,

  minimumPlayersPerTeam: 0,
  maximumPlayersPerTeam: 0,

  playersOnPitch: 6,
  outfieldPlayers: 5,

  matchDurationMinutes: 15,
  halfTimeDurationMinutes: 5,

  rollingSubstitutions: true,

  offsideEnabled: false,
  goalkeeperBackPassEnabled: false,
  designatedSubstitutionArea: true,

  refereeHasFinalAuthority: true,
  captainOnlyMayApproachReferee: true,

  winPoints: 3,
  drawPoints: 1,
  lossPoints: 0,

  tieBreaker1: "GOAL_DIFFERENCE",
  tieBreaker2: "GOALS_SCORED",
  tieBreaker3: "HEAD_TO_HEAD",
  tieBreaker4: "FAIR_PLAY",
  tieBreaker5: "DRAW",

  yellowCardIsWarning: true,
  secondYellowIsRed: true,
  tournamentCommitteeCanSuspend: true,
  seriousMisconductCanDisqualify: true,

  registrationOpensAt: "",
  registrationClosesAt: "",
};

type Settings = Omit<
  typeof defaultSettings,
  "minimumPlayersPerTeam" | "maximumPlayersPerTeam"
> & {
  minimumPlayersPerTeam: number | "";
  maximumPlayersPerTeam: number | "";
};

export default function TournamentSettingsPage() {
  const params = useParams<{ tournamentId: string }>();
  const tournamentId = params.tournamentId;

  const [form, setForm] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch(
          `/api/tournaments/${tournamentId}/settings`,
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load settings.");
        }

        setForm({
          ...defaultSettings,
          ...data,
          minimumPlayersPerTeam: data.minimumPlayersPerTeam ?? "",
          maximumPlayersPerTeam: data.maximumPlayersPerTeam ?? "",
          registrationOpensAt: data.registrationOpensAt
            ? new Date(data.registrationOpensAt).toISOString().slice(0, 16)
            : "",
          registrationClosesAt: data.registrationClosesAt
            ? new Date(data.registrationClosesAt).toISOString().slice(0, 16)
            : "",
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load settings.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [tournamentId]);

  function updateField<K extends keyof Settings>(field: K, value: Settings[K]) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        ...form,
        numberOfTeams: Number(form.numberOfTeams),

        minimumPlayersPerTeam:
          form.minimumPlayersPerTeam === ""
            ? null
            : Number(form.minimumPlayersPerTeam),

        maximumPlayersPerTeam:
          form.maximumPlayersPerTeam === ""
            ? null
            : Number(form.maximumPlayersPerTeam),

        playersOnPitch: Number(form.playersOnPitch),
        outfieldPlayers: Number(form.outfieldPlayers),

        matchDurationMinutes: Number(form.matchDurationMinutes),
        halfTimeDurationMinutes: Number(form.halfTimeDurationMinutes),

        winPoints: Number(form.winPoints),
        drawPoints: Number(form.drawPoints),
        lossPoints: Number(form.lossPoints),

        registrationOpensAt: form.registrationOpensAt || null,
        registrationClosesAt: form.registrationClosesAt || null,
      };

      const response = await fetch(
        `/api/tournaments/${tournamentId}/settings`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save settings.");
      }

      setMessage("Tournament settings saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="text-gray-500">Loading tournament settings...</p>
      </div>
    );
  }

  return (
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Tournament Settings
          </h1>

          <p className="mt-2 text-gray-600">
            Configure how this tournament will be played and managed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
              {message}
            </div>
          )}

          <Section title="Competition">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Competition Format">
                <select
                  value={form.competitionFormat}
                  onChange={(e) =>
                    updateField(
                      "competitionFormat",
                      e.target.value as Settings["competitionFormat"],
                    )
                  }
                  className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
                >
                  <option value="LEAGUE">League</option>
                  <option value="KNOCKOUT">Knockout</option>
                  <option value="GROUP_AND_KNOCKOUT">Groups + Knockout</option>
                </select>
              </Field>

              <Field label="Number of Teams">
                <input
                  type="number"
                  min={2}
                  value={form.numberOfTeams}
                  onChange={(e) =>
                    updateField("numberOfTeams", Number(e.target.value))
                  }
                  className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
                />
              </Field>

              <Field label="Round Robin">
                <select
                  value={form.roundRobinType}
                  onChange={(e) =>
                    updateField(
                      "roundRobinType",
                      e.target.value as Settings["roundRobinType"],
                    )
                  }
                  className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
                >
                  <option value="SINGLE">Single Round Robin</option>
                  <option value="DOUBLE">Double Round Robin</option>
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Squad Rules">
            <div className="grid gap-5 md:grid-cols-2">
              <NumberField
                label="Minimum Players Per Team"
                value={form.minimumPlayersPerTeam}
                onChange={(value) =>
                  updateField("minimumPlayersPerTeam", Number(value))
                }
                min={1}
                placeholder="No minimum"
              />

              <NumberField
                label="Maximum Players Per Team"
                value={form.maximumPlayersPerTeam}
                onChange={(value) =>
                  updateField("maximumPlayersPerTeam", Number(value))
                }
                min={1}
                placeholder="No maximum"
              />

              <NumberField
                label="Players On Pitch"
                value={form.playersOnPitch}
                onChange={(value) =>
                  updateField("playersOnPitch", Number(value))
                }
                min={1}
              />

              <NumberField
                label="Outfield Players"
                value={form.outfieldPlayers}
                onChange={(value) =>
                  updateField("outfieldPlayers", Number(value))
                }
                min={1}
              />
            </div>
          </Section>

          <Section title="Match Rules">
            <div className="grid gap-5 md:grid-cols-2">
              <NumberField
                label="Match Duration (minutes)"
                value={form.matchDurationMinutes}
                onChange={(value) =>
                  updateField("matchDurationMinutes", Number(value))
                }
                min={1}
              />

              <NumberField
                label="Half-Time Duration (minutes)"
                value={form.halfTimeDurationMinutes}
                onChange={(value) =>
                  updateField("halfTimeDurationMinutes", Number(value))
                }
                min={0}
              />
            </div>

            <div className="mt-5 space-y-3">
              <Toggle
                label="Rolling substitutions"
                checked={form.rollingSubstitutions}
                onChange={(value) => updateField("rollingSubstitutions", value)}
              />

              <Toggle
                label="Offside enabled"
                checked={form.offsideEnabled}
                onChange={(value) => updateField("offsideEnabled", value)}
              />

              <Toggle
                label="Goalkeeper back-pass restriction"
                checked={form.goalkeeperBackPassEnabled}
                onChange={(value) =>
                  updateField("goalkeeperBackPassEnabled", value)
                }
              />

              <Toggle
                label="Designated substitution area"
                checked={form.designatedSubstitutionArea}
                onChange={(value) =>
                  updateField("designatedSubstitutionArea", value)
                }
              />
            </div>
          </Section>

          <Section title="Points System">
            <div className="grid gap-5 md:grid-cols-3">
              <NumberField
                label="Win"
                value={form.winPoints}
                onChange={(value) => updateField("winPoints", Number(value))}
                min={0}
              />

              <NumberField
                label="Draw"
                value={form.drawPoints}
                onChange={(value) => updateField("drawPoints", Number(value))}
                min={0}
              />

              <NumberField
                label="Loss"
                value={form.lossPoints}
                onChange={(value) => updateField("lossPoints", Number(value))}
                min={0}
              />
            </div>
          </Section>

          <Section title="Tie-Breakers">
            <div className="space-y-4">
              {(
                [
                  "tieBreaker1",
                  "tieBreaker2",
                  "tieBreaker3",
                  "tieBreaker4",
                  "tieBreaker5",
                ] as const
              ).map((field, index) => (
                <Field key={field} label={`Tie-Breaker ${index + 1}`}>
                  <select
                    value={form[field]}
                    onChange={(e) =>
                      updateField(
                        field,
                        e.target.value as Settings[typeof field],
                      )
                    }
                    className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
                  >
                    {tieBreakerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              ))}
            </div>
          </Section>

          <Section title="Referee & Discipline">
            <div className="space-y-3">
              <Toggle
                label="Referee has final authority"
                checked={form.refereeHasFinalAuthority}
                onChange={(value) =>
                  updateField("refereeHasFinalAuthority", value)
                }
              />

              <Toggle
                label="Only the captain may approach the referee"
                checked={form.captainOnlyMayApproachReferee}
                onChange={(value) =>
                  updateField("captainOnlyMayApproachReferee", value)
                }
              />

              <Toggle
                label="Yellow card counts as a warning"
                checked={form.yellowCardIsWarning}
                onChange={(value) => updateField("yellowCardIsWarning", value)}
              />

              <Toggle
                label="Second yellow results in a red card"
                checked={form.secondYellowIsRed}
                onChange={(value) => updateField("secondYellowIsRed", value)}
              />

              <Toggle
                label="Tournament committee can issue suspensions"
                checked={form.tournamentCommitteeCanSuspend}
                onChange={(value) =>
                  updateField("tournamentCommitteeCanSuspend", value)
                }
              />

              <Toggle
                label="Serious misconduct can result in disqualification"
                checked={form.seriousMisconductCanDisqualify}
                onChange={(value) =>
                  updateField("seriousMisconductCanDisqualify", value)
                }
              />
            </div>
          </Section>

          <Section title="Registration">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Registration Opens">
                <input
                  type="datetime-local"
                  value={form.registrationOpensAt}
                  onChange={(e) =>
                    updateField("registrationOpensAt", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
                />
              </Field>

              <Field label="Registration Closes">
                <input
                  type="datetime-local"
                  value={form.registrationClosesAt}
                  onChange={(e) =>
                    updateField("registrationClosesAt", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
                />
              </Field>
            </div>
          </Section>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-black px-8 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-semibold text-gray-900">{title}</h2>

      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      {children}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  placeholder,
}: {
  label: string;
  value: number | string;
  onChange: (value: number | string) => void;
  min?: number;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        min={min}
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value === "" ? "" : Number(e.target.value))
        }
        className="w-full rounded-lg border border-gray-400 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-black focus:ring-2 focus:ring-black/20"
      />
    </Field>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
      <span className="text-sm text-gray-700">{label}</span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
    </label>
  );
}
