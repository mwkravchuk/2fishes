"use client";

import { useActionState } from "react";
import {
  updateOrderFulfillment,
  sendShipmentEmail,
} from "@/app/admin/orders/[orderId]/actions";

type Props = {
  orderId: string;
  fulfillmentStatus: string;
  paymentStatus: string;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  shippingEmailSentAt: string | null;
};

const initialState = {};

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

export default function OrderFulfillmentForm({
  orderId,
  fulfillmentStatus,
  paymentStatus,
  trackingCarrier,
  trackingNumber,
  shippingEmailSentAt,
}: Props) {
  const [state, formAction, isPending] = useActionState(
    updateOrderFulfillment,
    initialState
  );

  const [emailState, emailAction, isEmailPending] = useActionState(
    sendShipmentEmail,
    initialState
  );

  const hasTracking = Boolean(
    (trackingCarrier ?? "").trim() && (trackingNumber ?? "").trim()
  );

  return (
    <div className="space-y-10">
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
            <option value="shipped">Shipped</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="paymentStatus"
            className="block text-[16px] leading-none"
          >
            Payment status
          </label>
          <select
            id="paymentStatus"
            name="paymentStatus"
            defaultValue={paymentStatus}
            className="mt-1.5 w-full border-b bg-transparent py-1.5 text-[18px] leading-none"
          >
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
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
          <p className="text-[16px] leading-[1.2]">Order details saved.</p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="border border-black px-5 py-3.5 text-[18px] leading-none cursor-pointer hover:underline disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save changes"}
        </button>
      </form>

      <div className="border-t border-black pt-6">
        <p className="text-[16px] leading-none">Shipment email</p>

        <p className="mt-3 text-[16px] leading-[1.2] text-black/70">
          {shippingEmailSentAt
            ? `Sent ${formatSentAt(shippingEmailSentAt)}.`
            : "Not sent yet."}
        </p>

        <p className="mt-2 text-[16px] leading-[1.2] text-black/55">
          Sending this email will notify the customer with the current tracking
          information.
        </p>

        <form action={emailAction} className="mt-5">
          <input type="hidden" name="orderId" value={orderId} />

          <button
            type="submit"
            disabled={isEmailPending || !hasTracking}
            className="border border-black px-5 py-3.5 text-[18px] leading-none cursor-pointer hover:underline disabled:opacity-60"
          >
            {isEmailPending
              ? "Sending..."
              : shippingEmailSentAt
              ? "Resend shipment email"
              : "Send shipment email"}
          </button>
        </form>

        {!hasTracking ? (
          <p className="mt-3 text-[16px] leading-[1.2] text-black/55">
            Add both a tracking carrier and tracking number before sending.
          </p>
        ) : null}

        {emailState?.error ? (
          <p className="mt-3 text-[16px] leading-[1.2]">{emailState.error}</p>
        ) : null}

        {emailState?.success ? (
          <p className="mt-3 text-[16px] leading-[1.2]">
            Shipment email sent.
          </p>
        ) : null}
      </div>
    </div>
  );
}