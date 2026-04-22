"use client";

import Link from "next/link";
import { useActionState } from "react";
import { retryFailedEmailJob } from "@/app/admin/ops/actions";

const initialState = {};

export default function RetryFailedEmailJobForm({
  emailJobId,
  orderId,
}: {
  emailJobId: string;
  orderId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    retryFailedEmailJob,
    initialState
  );

  return (
    <div className="mt-4">
      <form action={formAction}>
        <input type="hidden" name="emailJobId" value={emailJobId} />
        <button
          type="submit"
          disabled={isPending}
          className="ui-button-sm"
        >
          {isPending ? "Retrying..." : "Retry email"}
        </button>
      </form>

      {state?.error ? (
        <p className="mt-3 text-[16px] leading-[1.25]">{state.error}</p>
      ) : null}

      {state?.success ? (
        <p className="mt-3 text-[16px] leading-[1.25]">
          {state.message}{" "}
          <Link href={`/admin/orders/${orderId}`} className="underline">
            View order
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
