"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  interval?: number;
};

export default function LiveStandingsRefresh({ interval = 5000 }: Props) {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setInterval(() => {
      router.refresh();
    }, interval);

    return () => {
      window.clearInterval(timer);
    };
  }, [interval, router]);

  return null;
}
