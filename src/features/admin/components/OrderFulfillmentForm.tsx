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
          <label htmlFor="fulfillmentStatus" className="ui-field-label">
            Fulfillment status
          </label>
          <select
            id="fulfillmentStatus"
            name="fulfillmentStatus"
            defaultValue={fulfillmentStatus}
            className="ui-field-control mt-1.5"
          >
            <option value="pending">Pending</option>
            <option value="shipped">Shipped</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>

        <div>
          <label htmlFor="paymentStatus" className="ui-field-label">
            Payment status
          </label>
          <select
            id="paymentStatus"
            name="paymentStatus"
            defaultValue={paymentStatus}
            className="ui-field-control mt-1.5"
          >
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <div>
          <label htmlFor="trackingCarrier" className="ui-field-label">
            Tracking carrier
          </label>
          <input
            id="trackingCarrier"
            name="trackingCarrier"
            defaultValue={trackingCarrier ?? ""}
            placeholder="USPS, UPS, etc."
            className="ui-field-control mt-1.5"
          />
        </div>

        <div>
          <label htmlFor="trackingNumber" className="ui-field-label">
            Tracking number
          </label>
          <input
            id="trackingNumber"
            name="trackingNumber"
            defaultValue={trackingNumber ?? ""}
            placeholder="Tracking number"
            className="ui-field-control mt-1.5"
          />
        </div>

        {state?.error ? (
          <p className="ui-body-sm-copy">{state.error}</p>
        ) : null}

        {state?.success ? (
          <p className="ui-body-sm-copy">Order details saved.</p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="ui-button"
        >
          {isPending ? "Saving..." : "Save changes"}
        </button>
      </form>

      <div className="ui-panel-top">
        <p className="ui-body-sm">Shipment email</p>

        <p className="ui-body-sm-copy ui-muted mt-3">
          {shippingEmailSentAt
            ? `Sent ${formatSentAt(shippingEmailSentAt)}.`
            : "Not sent yet."}
        </p>

        <p className="ui-body-sm-copy ui-subtle mt-2">
          Sending this email will notify the customer with the current tracking
          information.
        </p>

        <form action={emailAction} className="mt-5">
          <input type="hidden" name="orderId" value={orderId} />

          <button
            type="submit"
            disabled={isEmailPending || !hasTracking}
            className="ui-button"
          >
            {isEmailPending
              ? "Sending..."
              : shippingEmailSentAt
              ? "Resend shipment email"
              : "Send shipment email"}
          </button>
        </form>

        {!hasTracking ? (
          <p className="ui-body-sm-copy ui-subtle mt-3">
            Add both a tracking carrier and tracking number before sending.
          </p>
        ) : null}

        {emailState?.error ? (
          <p className="ui-body-sm-copy mt-3">{emailState.error}</p>
        ) : null}

        {emailState?.success ? (
          <p className="ui-body-sm-copy mt-3">
            Shipment email sent.
          </p>
        ) : null}
      </div>
    </div>
  );
}
