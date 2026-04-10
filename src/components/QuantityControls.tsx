"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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

  async function updateQuantity(nextQuantity: number) {
    if (nextQuantity < 1) {
      return;
    }

    try {
      setIsSubmitting(true);

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
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex items-center gap-2 text-[18px] leading-none">
        <button
          type="button"
          onClick={() => updateQuantity(quantity - 1)}
          disabled={isSubmitting || quantity <= 1}
          className="cursor-pointer hover:underline disabled:cursor-default disabled:opacity-40"
          aria-label="Decrease quantity"
        >
          -
        </button>

        <span className="min-w-[18px] text-center">{quantity}</span>

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