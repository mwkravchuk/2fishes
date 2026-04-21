"use client";

import { useState, useEffect, useRef } from "react";
import { BagSize, GrindOption } from "@prisma/client";
import { emitCartChanged } from "@/lib/cart-events";

type AddToCartFormProps = {
  productId: string;
  selectedSize: BagSize;
  selectedGrind: GrindOption;
};

export default function AddToCartForm({
  productId,
  selectedSize,
  selectedGrind,
}: AddToCartFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function decrement() {
    setQuantity((q) => Math.max(1, q - 1));
  }

  function increment() {
    setQuantity((q) => q + 1);
  }

  function showTemporaryMessage(nextMessage: string) {
    setMessage(nextMessage);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setMessage(null);
    }, 2500);
  }

  async function handleAddToCart() {
    try {
      setIsSubmitting(true);
      setMessage(null);

      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          selectedSize,
          selectedGrind,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to add item to cart");
      }

      emitCartChanged(data.itemCount, true);
      showTemporaryMessage("Added to cart");
    } catch (error) {
      console.error(error);
      showTemporaryMessage(
        error instanceof Error ? error.message : "Failed to add item to cart"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-6 border-b border-black pb-1">
          <span className="ui-body">Size</span>
          <span className="ui-body">12 oz</span>
        </div>

        <div className="flex items-center justify-between gap-6 border-b border-black pb-1">
          <span className="ui-body">Grind</span>
          <span className="ui-body">Whole bean</span>
        </div>

        <div className="flex items-center justify-between gap-6 border-b border-black pb-1">
          <span className="ui-body">Quantity</span>

          <div className="ui-body flex items-center gap-5">
            <button
              type="button"
              onClick={decrement}
              className="cursor-pointer hover:underline"
              aria-label="Decrease quantity"
              disabled={isSubmitting}
            >
              -
            </button>

            <span className="min-w-[18px] text-center">{quantity}</span>

            <button
              type="button"
              onClick={increment}
              className="cursor-pointer hover:underline"
              aria-label="Increase quantity"
              disabled={isSubmitting}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="mt-20">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isSubmitting}
          className="ui-button ui-button-block"
        >
          {isSubmitting ? "Adding..." : "Add to cart"}
        </button>

        {message ? (
          <p className="ui-body-sm mt-4">{message}</p>
        ) : null}
      </div>
    </div>
  );
}
