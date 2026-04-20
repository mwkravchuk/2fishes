type StatusBadgeProps = {
  status: string;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  let className =
    "inline-flex items-center border px-3 py-1 text-[15px] leading-none";

  if (normalized === "pending" || normalized === "in_progress") {
    className += " border-[#d8c97a] bg-[#efe6b8] text-black";
  } else if (normalized === "shipped" || normalized === "fulfilled") {
    className += " border-[#a9c29a] bg-[#dce8d6] text-black";
  } else if (normalized === "paid") {
    className += " border-[#cfcfcf] bg-[#f3f3f3] text-black";
  } else if (normalized === "email_sent") {
    className += " border-[#a9c29a] bg-[#dce8d6] text-black";
  } else if (
    normalized === "email_pending" ||
    normalized === "email_processing" ||
    normalized === "not_queued"
  ) {
    className += " border-[#d8c97a] bg-[#efe6b8] text-black";
  } else if (normalized === "email_failed") {
    className += " border-[#d3a1a1] bg-[#f2dada] text-black";
  } else {
    className += " border-black bg-white text-black";
  }

  return <span className={className}>{formatStatus(status)}</span>;
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
