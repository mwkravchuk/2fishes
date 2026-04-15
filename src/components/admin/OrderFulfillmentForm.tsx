"use client";

import { useActionState } from "react";
import { updateOrderFulfillment } from "@/app/admin/orders/[orderId]/actions";

type Props = {
  orderId: string;
  fulfillmentStatus: string;
  trackingCarrier: string | null;
  trackingNumber: string | null;
};

const initialState = {};

export default function OrderFulfillmentForm({
  orderId,
  fulfillmentStatus,
  trackingCarrier,
  trackingNumber,
}: Props) {
  const [state, formAction, isPending] = useActionState(
    updateOrderFulfillment,
    initialState
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="orderId" value={orderId} />

      <div>
        <label
          htmlFor="fulfillmentStatus"
          className="block text-[16px] leading-none"
        >
          Fulfillment status
        </label>
        <select
          id="fulfillmentStatus"
          name="fulfillmentStatus"
          defaultValue={fulfillmentStatus}
          className="mt-1.5 w-full border-b bg-transparent py-1.5 text-[18px] leading-none"
        >
          <option value="pending">Pending</option>
          <option value="fulfilled">Fulfilled</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="trackingCarrier"
          className="block text-[16px] leading-none"
        >
          Tracking carrier
        </label>
        <input
          id="trackingCarrier"
          name="trackingCarrier"
          defaultValue={trackingCarrier ?? ""}
          placeholder="USPS, UPS, etc."
          className="mt-1.5 w-full border-b bg-transparent py-1.5 text-[18px] leading-none"
        />
      </div>

      <div>
        <label
          htmlFor="trackingNumber"
          className="block text-[16px] leading-none"
        >
          Tracking number
        </label>
        <input
          id="trackingNumber"
          name="trackingNumber"
          defaultValue={trackingNumber ?? ""}
          placeholder="Tracking number"
          className="mt-1.5 w-full border-b bg-transparent py-1.5 text-[18px] leading-none"
        />
      </div>

      {state?.error ? (
        <p className="text-[16px] leading-[1.2]">{state.error}</p>
      ) : null}

      {state?.success ? (
        <p className="text-[16px] leading-[1.2]">Order updated.</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="border border-black px-5 py-3.5 text-[18px] leading-none cursor-pointer hover:underline disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save fulfillment update"}
      </button>
    </form>
  );
}