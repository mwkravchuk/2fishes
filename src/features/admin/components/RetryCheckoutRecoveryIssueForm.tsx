"use client";

import Link from "next/link";
import { useActionState } from "react";
import { retryCheckoutRecoveryIssue } from "@/app/admin/ops/actions";

const initialState = {};

export default function RetryCheckoutRecoveryIssueForm({
  checkoutSessionId,
}: {
  checkoutSessionId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    retryCheckoutRecoveryIssue,
    initialState
  );

  return (
    <div className="mt-4">
      <form action={formAction}>
        <input type="hidden" name="checkoutSessionId" value={checkoutSessionId} />
        <button
          type="submit"
          disabled={isPending}
          className="ui-button-sm"
        >
          {isPending ? "Recovering..." : "Recover order"}
        </button>
      </form>

      {state?.error ? (
        <p className="mt-3 text-[16px] leading-[1.25]">{state.error}</p>
      ) : null}

      {state?.success && state.orderId ? (
        <p className="mt-3 text-[16px] leading-[1.25]">
          {state.message}{" "}
          <Link href={`/admin/orders/${state.orderId}`} className="underline">
            View order
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
