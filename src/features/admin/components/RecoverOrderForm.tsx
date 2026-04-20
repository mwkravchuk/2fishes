"use client";

import Link from "next/link";
import { useActionState } from "react";
import { recoverOrderFromStripeSession } from "@/app/admin/ops/actions";

const initialState = {};

export default function RecoverOrderForm() {
  const [state, formAction, isPending] = useActionState(
    recoverOrderFromStripeSession,
    initialState
  );

  return (
    <div className="border-t border-black pt-6">
      <p className="text-[18px] leading-none">Recover order from Stripe</p>

      <p className="mt-3 text-[16px] leading-[1.25] opacity-70">
        Use a paid Stripe Checkout Session ID or Payment Intent ID to recreate
        a missing internal order from Stripe&apos;s snapshot.
      </p>

      <form action={formAction} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="checkoutSessionId"
            className="block text-[16px] leading-none"
          >
            Stripe Checkout Session ID or Payment Intent ID
          </label>
          <input
            id="checkoutSessionId"
            name="checkoutSessionId"
            placeholder="cs_test_... or pi_..."
            className="mt-1.5 w-full border-b bg-transparent py-1.5 text-[18px] leading-none"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="border border-black px-5 py-3.5 text-[18px] leading-none cursor-pointer hover:underline disabled:opacity-60"
        >
          {isPending ? "Recovering..." : "Recover order"}
        </button>
      </form>

      {state?.error ? (
        <p className="mt-4 text-[16px] leading-[1.25]">{state.error}</p>
      ) : null}

      {state?.success && state.orderId ? (
        <p className="mt-4 text-[16px] leading-[1.25]">
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
