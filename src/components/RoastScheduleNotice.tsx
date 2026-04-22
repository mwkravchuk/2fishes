"use client";

import { useEffect, useState } from "react";

type RoastScheduleNoticeProps = {
  variant?: "home" | "cart" | "success";
  className?: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function getUpcomingSaturday(now: Date) {
  const result = new Date(now);
  const day = now.getDay(); // Sunday=0, Saturday=6
  const daysUntilSaturday = (6 - day + 7) % 7;
  result.setDate(now.getDate() + daysUntilSaturday);
  result.setHours(9, 0, 0, 0);
  return result;
}

function getFridayMidnightCutoffForRoast(roastDate: Date) {
  const cutoff = new Date(roastDate);
  cutoff.setDate(roastDate.getDate() - 1); // Friday
  cutoff.setHours(23, 59, 59, 999);
  return cutoff;
}

function getRoastSchedule(now: Date) {
  const upcomingSaturday = getUpcomingSaturday(now);
  const upcomingCutoff = getFridayMidnightCutoffForRoast(upcomingSaturday);

  let roastDate: Date;

  if (now <= upcomingCutoff) {
    roastDate = upcomingSaturday;
  } else {
    roastDate = new Date(upcomingSaturday);
    roastDate.setDate(roastDate.getDate() + 7);
  }

  const cutoffDate = getFridayMidnightCutoffForRoast(roastDate);

  const shipDate = new Date(roastDate);
  shipDate.setDate(shipDate.getDate() + 2); // Monday
  shipDate.setHours(9, 0, 0, 0);

  return { roastDate, shipDate, cutoffDate };
}

function formatTimeLeft(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function RoastScheduleNotice({
  variant = "cart",
  className = "",
}: RoastScheduleNoticeProps) {
  const [nowTimestamp, setNowTimestamp] = useState(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setNowTimestamp(Date.now());
    });

    const interval = window.setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(interval);
    };
  }, []);

  const scheduleNow = nowTimestamp === 0 ? new Date() : new Date(nowTimestamp);
  const { roastDate, shipDate, cutoffDate } = getRoastSchedule(scheduleNow);
  const diff = cutoffDate.getTime() - scheduleNow.getTime();
  const { days, hours, minutes, seconds } = formatTimeLeft(diff);
  const countdown =
    nowTimestamp === 0
      ? "--:--:--:--"
      : `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  if (variant === "home") {
    return (
      <div className={className}>
        <p className="text-[26px] leading-snug">
          this week&apos;s roast closes in {countdown}
        </p>
      </div>
    );
  }

  if (variant === "success") {
    return (
      <div className={className}>
        <p className="ui-body-loose">
          Your coffee is scheduled to be roasted on{" "}
          <span className="font-bold">{formatDate(roastDate)}</span> and shipped{" "}
          <span className="font-bold">{formatDate(shipDate)}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="ui-body-loose">
        Order within {countdown} to be roasted on{" "}
        <span className="font-bold">{formatDate(roastDate)}</span> and shipped{" "}
        <span className="font-bold">{formatDate(shipDate)}</span>.
      </p>

      <p className="ui-body-sm-copy ui-subtle mt-2">
        Orders placed after Friday at 11:59 PM PT roll into the following week’s
        roast.
      </p>
    </div>
  );
}
