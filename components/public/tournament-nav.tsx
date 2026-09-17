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
    <nav
      aria-label="Tournament navigation"
      className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-[0_4px_18px_rgba(16,42,67,0.06)] backdrop-blur"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                aria-current={isActive ? "page" : undefined}
                className={`relative flex shrink-0 items-center gap-2 px-3 py-3.5 text-sm font-semibold transition sm:px-5 ${
                  isActive
                    ? "text-[#102a43]"
                    : "text-slate-500 hover:text-[#102a43]"
                }`}
              >
                <Icon className="h-4 w-4" />

                {item.label}

                {isActive && (
                  <span className="absolute inset-x-3 bottom-0 h-1 rounded-t-full bg-[#ef806d] sm:inset-x-5" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
