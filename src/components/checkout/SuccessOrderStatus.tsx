"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  }, [order, sessionId]);

  if (!order) {
    return (
      <div className="mx-auto max-w-[800px]">
        <h1 className="text-[18px] leading-[0.92]">
          Thank you for your order!
        </h1>

        <p className="mt-8 text-[18px] leading-[1.15]">
          Your payment was received and we’re processing your order now.
        </p>

        <p className="mt-4 text-[18px] leading-[1.2]">
          {isPolling
            ? "Finalizing your receipt..."
            : "You’ll receive a confirmation email shortly."}
        </p>

        {timedOut ? (
          <p className="mt-4 text-[18px] leading-[1.2]">
            We’re still finalizing your order record. Your payment went through.
          </p>
        ) : null}

        <div className="mt-10">
          <Link
            href="/shop"
            className="inline-block border border-black px-5 py-3.5 text-[18px] leading-none hover:underline"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px]">
      <h1 className="text-[18px] leading-[0.1.15]">Thank you for your order!</h1>

      <p className="mt-2 text-[18px] leading-[1.15]">
        Your order has been received and is being prepared.
      </p>

      <p className="mt-2 text-[18px] leading-[1.15]">
        A confirmation email has been sent to <span className="font-bold">{order.customerEmail}</span>.
      </p>

      <div className="mt-24 grid gap-12 md:grid-cols-2">
        <div>
          <h2 className="text-[18px] leading-none">Order summary</h2>

          <div className="mt-2 border-t border-black">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-6 py-4"
              >
                <div>
                  <p className="font-display text-[18px] leading-none">
                    {item.productNameSnap}
                  </p>
                  <p className="mt-2 text-[18px] leading-[1.2]">
                    {formatBagSize(item.selectedSize)} /{" "}
                    {formatGrind(item.selectedGrind)}
                  </p>
                </div>

                <div className="text-[18px] leading-none">x{item.quantity}</div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex items-center justify-between border-b border-black pb-4">
            <span className="text-[18px] leading-none">Total</span>
            <span className="text-[18px] leading-none">
              {formatPrice(order.totalCents)}
            </span>
          </div>
        </div>

        <div>
          <h2 className="text-[18px] leading-none">Shipping to</h2>

          <div className="mt-6 space-y-1 text-[18px] leading-[1.2]">
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

          <p className="mt-8 text-[18px] leading-[1.2]">
            Orders are batch roasted on Saturday and typically ship out the
            following Monday.
          </p>
        </div>
      </div>

      <div className="mt-14">
        <Link
          href="/shop"
          className="inline-block border border-black px-5 py-3.5 text-[18px] leading-none hover:underline"
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