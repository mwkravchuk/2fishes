"use client";

import { useActionState } from "react";
import { updateOrderFulfillment } from "@/app/admin/orders/[orderId]/actions";

type Props = {
  orderId: string;
  fulfillmentStatus: string;
  paymentStatus: string;
  trackingCarrier: string | null;
  trackingNumber: string | null;
};

const initialState = {};

export default function OrderFulfillmentForm({
  orderId,
  fulfillmentStatus,
  paymentStatus,
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

      {state?.error ? <p className="ui-body-sm-copy">{state.error}</p> : null}

      {state?.success ? (
        <p className="ui-body-sm-copy">Order details saved.</p>
      ) : null}

      <button type="submit" disabled={isPending} className="ui-button">
        {isPending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
