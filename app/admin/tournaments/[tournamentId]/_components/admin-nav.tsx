"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  UserRound,
  CalendarDays,
  Clock3,
  Trophy,
  Settings,
} from "lucide-react";

type AdminNavProps = {
  tournamentId: string;
};

const navigation = [
  { label: "Overview", path: "", icon: Home },
  { label: "Teams", path: "/teams", icon: Users },
  { label: "Players", path: "/players", icon: UserRound },
  { label: "Fixtures", path: "/fixtures", icon: CalendarDays },
  { label: "Matches", path: "/matches", icon: Clock3 },
  { label: "Standings", path: "/standings", icon: Trophy },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function AdminNav({ tournamentId }: AdminNavProps) {
  const pathname = usePathname();
  const base = `/admin/tournaments/${tournamentId}`;

  return (
    <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl overflow-x-auto">
        <div className="flex">
          {navigation.map((item) => {
            const href = `${base}${item.path}`;
            const isActive =
              item.path === ""
                ? pathname === base
                : pathname.startsWith(href);

            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={href}
                className={`relative flex shrink-0 items-center gap-2 px-4 py-4 text-sm font-semibold transition sm:px-5 ${
                  isActive
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {isActive && (
                  <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-gray-900 sm:inset-x-5" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
