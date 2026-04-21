import type { CSSProperties } from "react";

type StatusBadgeProps = {
  status: string;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  const className = "ui-status-badge";
  let style: CSSProperties | undefined;

  if (normalized === "pending" || normalized === "in_progress") {
    style = {
      "--status-border": "var(--status-warn-border)",
      "--status-bg": "var(--status-warn-bg)",
    } as CSSProperties;
  } else if (normalized === "shipped" || normalized === "fulfilled") {
    style = {
      "--status-border": "var(--status-success-border)",
      "--status-bg": "var(--status-success-bg)",
    } as CSSProperties;
  } else if (normalized === "paid") {
    style = {
      "--status-border": "var(--status-neutral-border)",
      "--status-bg": "var(--status-neutral-bg)",
    } as CSSProperties;
  } else if (normalized === "email_sent") {
    style = {
      "--status-border": "var(--status-success-border)",
      "--status-bg": "var(--status-success-bg)",
    } as CSSProperties;
  } else if (
    normalized === "email_pending" ||
    normalized === "email_processing" ||
    normalized === "not_queued"
  ) {
    style = {
      "--status-border": "var(--status-warn-border)",
      "--status-bg": "var(--status-warn-bg)",
    } as CSSProperties;
  } else if (normalized === "email_failed") {
    style = {
      "--status-border": "var(--status-danger-border)",
      "--status-bg": "var(--status-danger-bg)",
    } as CSSProperties;
  } else if (normalized === "ready_to_send") {
    style = {
      "--status-border": "var(--status-success-border)",
      "--status-bg": "var(--status-success-bg)",
    } as CSSProperties;
  } else if (normalized === "tracking_needed") {
    style = {
      "--status-border": "var(--status-warn-border)",
      "--status-bg": "var(--status-warn-bg)",
    } as CSSProperties;
  }

  return (
    <span className={className} style={style}>
      {formatStatus(status)}
    </span>
  );
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
