"use client";

import { useActionState } from "react";
import { runCheckoutReconciliation } from "@/app/admin/ops/actions";

type FormState = {
  error?: string;
  success?: boolean;
  message?: string;
};

const initialState: FormState = {};

export default function RunCheckoutReconciliationForm() {
  const [state, formAction, isPending] = useActionState(
    runCheckoutReconciliation,
    initialState
  );

  return (
    <div>
      <form action={formAction}>
        <button
          type="submit"
          disabled={isPending}
          className="ui-button"
        >
          {isPending ? "Scanning..." : "Scan for missing orders"}
        </button>
      </form>

      {state?.error ? (
        <p className="mt-3 text-[16px] leading-[1.25]">{state.error}</p>
      ) : null}

      {state?.success && state.message ? (
        <p className="mt-3 text-[16px] leading-[1.25]">{state.message}</p>
      ) : null}
    </div>
  );
}
