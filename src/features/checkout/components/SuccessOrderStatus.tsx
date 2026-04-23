"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RoastScheduleNotice from "@/components/RoastScheduleNotice";
import { emitCartChanged } from "@/lib/cart-events";

type OrderItem = {
  id: string;
  productNameSnap: string;
  quantity: number;
  selectedSize: string;
  selectedGrind: string;
};

type Order = {
  id: string;
  customerEmail: string;
  shippingName: string | null;
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingZip: string | null;
  shippingCountry: string | null;
  totalCents: number;
  items: OrderItem[];
};

type Props = {
  sessionId: string;
  initialOrder: Order | null;
};

export default function SuccessOrderStatus({
  sessionId,
  initialOrder,
}: Props) {
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [isPolling, setIsPolling] = useState(!initialOrder);
  const [timedOut, setTimedOut] = useState(false);
  const [pollAttempt, setPollAttempt] = useState(0);

  useEffect(() => {
    if (order) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 8;

    async function poll() {
      try {
        const res = await fetch(
          `/api/orders/by-session?session_id=${encodeURIComponent(sessionId)}`,
          { cache: "no-store" }
        );

        if (!res.ok) return;

        const data = await res.json();

        if (cancelled) return;

        if (data.order) {
          setOrder(data.order);
          setIsPolling(false);
          setTimedOut(false);
          return;
        }

        attempts += 1;

        if (attempts >= maxAttempts) {
          setIsPolling(false);
          setTimedOut(true);
          return;
        }

        window.setTimeout(poll, 1000);
      } catch (error) {
        console.error("Polling order failed", error);
        attempts += 1;

        if (attempts >= maxAttempts) {
          setIsPolling(false);
          setTimedOut(true);
          return;
        }

        window.setTimeout(poll, 1000);
      }
    }

    poll();

    return () => {
      cancelled = true;
    };
  }, [order, pollAttempt, sessionId]);

  function retryPolling() {
    setTimedOut(false);
    setIsPolling(true);
    setPollAttempt((attempt) => attempt + 1);
  }

  useEffect(() => {
    if (!order) return;

    emitCartChanged(0);
  }, [order]);

  if (!order) {
    return (
      <div className="ui-page-wide">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.15fr)_320px] md:items-start md:gap-16">
          <div className="max-w-[640px]">
            <h1 className="ui-body-tight">Thank you for your order!</h1>

            <p className="ui-body-loose mt-10">
              Your payment was received and we’re processing your order now.
            </p>

            <p className="ui-body-copy mt-4">
              {isPolling
                ? "Finalizing your receipt..."
                : "You’ll receive a confirmation email shortly."}
            </p>

            {timedOut ? (
              <div className="mt-4 space-y-4">
                <p className="ui-body-copy">
                  We’re still finalizing your order record. Your payment went
                  through, but the confirmation details are taking longer than
                  expected to appear here.
                </p>
                <button
                  type="button"
                  onClick={retryPolling}
                  className="ui-button"
                >
                  Check order status again
                </button>
              </div>
            ) : null}

            <div className="mt-12">
              <Link
                href="/shop"
                className="ui-button ui-button-roomy inline-block"
              >
                Continue shopping
              </Link>
            </div>
          </div>

          <aside className="border border-black p-6">
            <p className="ui-body">What happens next</p>

            <div className="ui-body-copy mt-8 space-y-6">
              <div>
                <p>Confirmation email</p>
                <p className="mt-1">Sent shortly after checkout.</p>
              </div>

              <div>
                <p>Roasting</p>
                <p className="mt-1">Orders are batch roasted on Saturday.</p>
              </div>

              <div>
                <p>Shipping</p>
                <p className="mt-1">Orders typically ship the following Monday.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="ui-page-tight">
      <div className="flex flex-col gap-9">
        <h1 className="ui-body-tight">Thank you for your order!</h1>
        <div className="flex flex-col gap-3">
          <RoastScheduleNotice variant="success" />
          <p className="ui-body-loose">
            A confirmation email has been sent to{" "}
            <span className="font-bold">{order.customerEmail}</span>.
          </p>
        </div>
      </div>

      <div className="mt-16 grid gap-12 md:mt-24 md:grid-cols-2 md:gap-16">
        <section>
          <h2 className="ui-body">Order summary</h2>

          <div className="mt-4 border-t border-black">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-6 py-5"
              >
                <div className="min-w-0">
                  <p className="font-display ui-body">{item.productNameSnap}</p>
                  <p className="ui-body-copy mt-2">
                    {formatBagSize(item.selectedSize)} •{" "}
                    {formatGrind(item.selectedGrind)}
                  </p>
                </div>

                <div className="ui-body shrink-0">×{item.quantity}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-between border-b border-black pb-4">
            <span className="ui-body">Total</span>
            <span className="ui-body">{formatPrice(order.totalCents)}</span>
          </div>
        </section>

        <section>
          <h2 className="ui-body">Shipping to</h2>

          <div className="ui-body-copy mt-8 space-y-1">
            {order.shippingName ? <p>{order.shippingName}</p> : null}
            {order.shippingLine1 ? <p>{order.shippingLine1}</p> : null}
            {order.shippingLine2 ? <p>{order.shippingLine2}</p> : null}
            <p>
              {[order.shippingCity, order.shippingState, order.shippingZip]
                .filter(Boolean)
                .join(", ")}
            </p>
            {order.shippingCountry ? <p>{order.shippingCountry}</p> : null}
          </div>
        </section>
      </div>

      <div className="mt-16">
        <Link
          href="/shop"
          className="ui-button ui-button-roomy inline-block"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatBagSize(size: string) {
  switch (size) {
    case "oz12":
      return "12 oz";
    default:
      return size;
  }
}

function formatGrind(grind: string) {
  switch (grind) {
    case "whole_bean":
      return "Whole bean";
    default:
      return grind;
  }
}
