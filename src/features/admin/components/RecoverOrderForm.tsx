"use client";

import Link from "next/link";
import { useActionState } from "react";
import { recoverOrderFromStripeSession } from "@/app/admin/ops/actions";

type FormState = {
  error?: string;
  success?: boolean;
  orderId?: string;
  existing?: boolean;
};

const initialState: FormState = {};

export default function RecoverOrderForm() {
  const [state, formAction, isPending] = useActionState(
    recoverOrderFromStripeSession,
    initialState
  );

  return (
    <div className="ui-panel-top">
      <p className="ui-body">Recover order from Stripe</p>

      <p className="ui-body-sm-relaxed ui-muted mt-3">
        Use a paid Stripe Checkout Session ID or Payment Intent ID to recreate
        a missing internal order from Stripe&apos;s snapshot.
      </p>

      <form action={formAction} className="mt-5 space-y-4">
        <div>
          <label htmlFor="checkoutSessionId" className="ui-field-label">
            Stripe Checkout Session ID or Payment Intent ID
          </label>
          <input
            id="checkoutSessionId"
            name="checkoutSessionId"
            placeholder="cs_test_... or pi_..."
            className="ui-field-control mt-1.5"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="ui-button"
        >
          {isPending ? "Recovering..." : "Recover order"}
        </button>
      </form>

      {state?.error ? (
        <p className="ui-body-sm-relaxed mt-4">{state.error}</p>
      ) : null}

      {state?.success && state.orderId ? (
        <p className="ui-body-sm-relaxed mt-4">
          {state.existing
            ? "Order already existed."
            : "Order recovered successfully."}{" "}
          <Link href={`/admin/orders/${state.orderId}`} className="underline">
            View order
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
