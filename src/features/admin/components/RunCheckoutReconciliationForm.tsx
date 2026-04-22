"use client";

import { useActionState } from "react";
import { runCheckoutReconciliation } from "@/app/admin/ops/actions";

const initialState = {};

export default function RunCheckoutReconciliationForm() {
  const [state, formAction, isPending] = useActionState(
    runCheckoutReconciliation,
    initialState
  );

  return (
    <div className="border border-black p-5 md:p-6">
      <p className="text-[18px] leading-none">Stripe reconciliation</p>

      <p className="mt-3 text-[16px] leading-[1.25] opacity-70">
        Sweep recent paid Stripe Checkout Sessions and flag any that are missing
        internal orders.
      </p>

      <form action={formAction} className="mt-5">
        <button
          type="submit"
          disabled={isPending}
          className="ui-button"
        >
          {isPending ? "Running..." : "Run reconciliation now"}
        </button>
      </form>

      {state?.error ? (
        <p className="mt-4 text-[16px] leading-[1.25]">{state.error}</p>
      ) : null}

      {state?.success && state.message ? (
        <p className="mt-4 text-[16px] leading-[1.25]">{state.message}</p>
      ) : null}
    </div>
  );
}
