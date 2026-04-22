"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { emitCartChanged } from "@/lib/cart-events";

type QuantityControlsProps = {
  cartItemId: string;
  quantity: number;
};

export default function QuantityControls({
  cartItemId,
  quantity,
}: QuantityControlsProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingQuantity, setPendingQuantity] = useState<number | null>(null);

  useEffect(() => {
    if (pendingQuantity !== null && quantity === pendingQuantity) {
      setIsSubmitting(false);
      setPendingQuantity(null);
    }
  }, [pendingQuantity, quantity]);

  async function updateQuantity(nextQuantity: number) {
    if (nextQuantity < 1) {
      return;
    }

    try {
      setIsSubmitting(true);
      setPendingQuantity(nextQuantity);

      const response = await fetch(`/api/cart/items/${cartItemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: nextQuantity,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to update quantity");
      }

      emitCartChanged(data.itemCount);
      router.refresh();
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      setPendingQuantity(null);
    }
  }

  return (
    <div className="flex items-center justify-between gap-6">
      <div className="ui-body flex items-center gap-2">
        <button
          type="button"
          onClick={() => updateQuantity(quantity - 1)}
          disabled={isSubmitting || quantity <= 1}
          className="cursor-pointer hover:underline disabled:cursor-default disabled:opacity-40"
          aria-label="Decrease quantity"
        >
          -
        </button>

        <span
          className={[
            "min-w-[18px] text-center transition-opacity",
            isSubmitting ? "opacity-40" : "opacity-100",
          ].join(" ")}
        >
          {quantity}
        </span>

        <button
          type="button"
          onClick={() => updateQuantity(quantity + 1)}
          disabled={isSubmitting}
          className="cursor-pointer hover:underline disabled:cursor-default disabled:opacity-40"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
    </div>
  );
}
