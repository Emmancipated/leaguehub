export type MatchStatus =
  | "SCHEDULED"
  | "LIVE"
  | "HALF_TIME"
  | "COMPLETED"
  | "POSTPONED"
  | "CANCELLED";

export function matchStatusLabel(status: string): string {
  switch (status) {
    case "SCHEDULED":
      return "Upcoming";
    case "LIVE":
      return "Live";
    case "HALF_TIME":
      return "Half Time";
    case "COMPLETED":
      return "Full Time";
    case "POSTPONED":
      return "Postponed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status.replaceAll("_", " ");
  }
}

export function matchStatusClasses(status: string): string {
  switch (status) {
    case "LIVE":
      return "bg-red-50 text-red-700 ring-red-200";
    case "HALF_TIME":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "POSTPONED":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "CANCELLED":
      return "bg-slate-100 text-slate-600 ring-slate-300";
    default:
      return "bg-blue-50 text-blue-700 ring-blue-200";
  }
}

export function teamInitials(name: string, shortName?: string | null): string {
  if (shortName) {
    return shortName.slice(0, 3).toUpperCase();
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function formatMatchDate(date: Date | null): string {
  if (!date) return "Date not confirmed";

  return new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatMatchTime(date: Date | null): string | null {
  if (!date) return null;

  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function eventIcon(type: string): string {
  switch (type) {
    case "GOAL":
    case "OWN_GOAL":
      return "⚽";
    case "YELLOW_CARD":
    case "SECOND_YELLOW":
      return "🟨";
    case "RED_CARD":
      return "🟥";
    case "SUBSTITUTION":
      return "↔️";
    case "PENALTY_MISSED":
      return "❌";
    default:
      return "•";
  }
}

export function eventLabel(type: string): string {
  switch (type) {
    case "GOAL":
      return "Goal";
    case "OWN_GOAL":
      return "Own Goal";
    case "YELLOW_CARD":
      return "Yellow Card";
    case "SECOND_YELLOW":
      return "Second Yellow";
    case "RED_CARD":
      return "Red Card";
    case "SUBSTITUTION":
      return "Substitution";
    case "PENALTY_MISSED":
      return "Penalty Missed";
    default:
      return type.replaceAll("_", " ");
  }
}
