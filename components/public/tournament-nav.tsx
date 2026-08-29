"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Trophy, Users } from "lucide-react";

type TournamentNavProps = {
  slug: string;
};

const navigation = [
  {
    label: "Overview",
    path: "",
    icon: Home,
  },
  {
    label: "Fixtures",
    path: "/fixtures",
    icon: CalendarDays,
  },
  {
    label: "Standings",
    path: "/standings",
    icon: Trophy,
  },
  {
    label: "Teams",
    path: "/teams",
    icon: Users,
  },
];

export function TournamentNav({ slug }: TournamentNavProps) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex overflow-x-auto">
          {navigation.map((item) => {
            const href = `/tournaments/${slug}${item.path}`;

            const isActive =
              item.path === ""
                ? pathname === `/tournaments/${slug}`
                : pathname.startsWith(href);

            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={href}
                className={`relative flex shrink-0 items-center gap-2 px-4 py-4 text-sm font-semibold transition sm:px-5 ${
                  isActive
                    ? "text-slate-950"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />

                {item.label}

                {isActive && (
                  <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-slate-950 sm:inset-x-5" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
