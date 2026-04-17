"use client";

import { useActionState } from "react";
import { retryOrderEmailJob } from "@/app/admin/orders/[orderId]/actions";

type EmailJob = {
  id: string;
  type: string;
  recipient: string;
  status: string;
  attempts: number;
  sentAt: string | null;
  lastError: string | null;
};

type Props = {
  orderId: string;
  jobs: EmailJob[];
};

const initialState = {};

function formatLabel(type: string) {
  switch (type) {
    case "order_confirmation":
      return "Customer confirmation";
    case "internal_new_order":
      return "Internal notification";
    default:
      return type;
  }
}

function formatSentAt(value: string | null) {
  if (!value) return null;

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function OrderEmailJobs({ orderId, jobs }: Props) {
  const [state, formAction, isPending] = useActionState(
    retryOrderEmailJob,
    initialState
  );

  return (
    <section className="border-t border-black pt-6">
      <p className="text-[16px] leading-none">Order emails</p>

      <div className="mt-5 space-y-5">
        {jobs.map((job) => (
          <div key={job.id} className="border border-black/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[16px] leading-none">{formatLabel(job.type)}</p>
                <p className="mt-2 text-[15px] leading-[1.2] text-black/70 break-all">
                  {job.recipient}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[15px] leading-none uppercase tracking-[0.08em]">
                  {job.status}
                </p>
                <p className="mt-2 text-[15px] leading-[1.2] text-black/70">
                  Attempts: {job.attempts}
                </p>
              </div>
            </div>

            {job.sentAt ? (
              <p className="mt-3 text-[15px] leading-[1.2] text-black/70">
                Sent {formatSentAt(job.sentAt)}.
              </p>
            ) : null}

            {job.lastError ? (
              <p className="mt-3 text-[15px] leading-[1.2]">
                Last error: {job.lastError}
              </p>
            ) : null}

            {job.status !== "sent" ? (
              <form action={formAction} className="mt-4">
                <input type="hidden" name="orderId" value={orderId} />
                <input type="hidden" name="emailJobId" value={job.id} />

                <button
                  type="submit"
                  disabled={isPending}
                  className="border border-black px-4 py-2.5 text-[16px] leading-none cursor-pointer hover:underline disabled:opacity-60"
                >
                  {isPending ? "Retrying..." : "Retry email"}
                </button>
              </form>
            ) : null}
          </div>
        ))}
      </div>

      {state?.error ? (
        <p className="mt-4 text-[16px] leading-[1.2]">{state.error}</p>
      ) : null}

      {state?.success ? (
        <p className="mt-4 text-[16px] leading-[1.2]">Email job retried.</p>
      ) : null}
    </section>
  );
}
