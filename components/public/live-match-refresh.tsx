"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  enabled: boolean;
  interval?: number;
};

export default function LiveMatchRefresh({ enabled, interval = 3000 }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const refresh = () => {
      router.refresh();
    };

    const timer = window.setInterval(refresh, interval);

    return () => {
      window.clearInterval(timer);
    };
  }, [enabled, interval, router]);

  return null;
}
