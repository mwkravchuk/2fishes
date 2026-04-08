"use client";

import { useEffect, useState } from "react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function getNextRoastDate(now: Date) {
  const roastStart = new Date(now);
  roastStart.setSeconds(0, 0);
  roastStart.setHours(9, 0, 0, 0); // 9:00 AM

  const roastEnd = new Date(now);
  roastEnd.setSeconds(0, 0);
  roastEnd.setHours(17, 0, 0, 0); // 5:00 PM

  const day = now.getDay(); // Sunday=0, Saturday=6

  if (day === 6) {
    if (now >= roastStart && now < roastEnd) {
      return { mode: "roasting" as const, target: roastStart };
    }

    if (now < roastStart) {
      return { mode: "countdown" as const, target: roastStart };
    }
  }

  const daysUntilSaturday = (6 - day + 7) % 7 || 7;
  const nextSaturday = new Date(now);
  nextSaturday.setDate(now.getDate() + daysUntilSaturday);
  nextSaturday.setHours(9, 0, 0, 0);

  return { mode: "countdown" as const, target: nextSaturday };
}

function formatTimeLeft(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

export default function RoastCountdown() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());

    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!now) return null;

  const { mode, target } = getNextRoastDate(now);

  if (mode === "roasting") {
    return (
      <div className="text-sm leading-snug">
        <p>Roasting...</p>
        <p className="text-black/60">Fresh coffee in progress.</p>
      </div>
    );
  }

  const diff = target.getTime() - now.getTime();
  const { days, hours, minutes, seconds } = formatTimeLeft(diff);

  return (
    <div className="text-[26px] leading-snug">
      <p>
        next roast in {pad(days)}:{pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </p>
    </div>
  );
}