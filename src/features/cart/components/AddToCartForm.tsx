"use client";

import { useState } from "react";
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
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error" | null>(
    null
  );

  function decrement() {
    setQuantity((q) => Math.max(1, q - 1));
  }

  function increment() {
    setQuantity((q) => q + 1);
  }

  async function handleAddToCart() {
    try {
      setIsSubmitting(true);
      setFeedbackMessage(null);
      setFeedbackTone(null);

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

      setFeedbackMessage("Added to cart.");
      setFeedbackTone("success");
      emitCartChanged(data.itemCount, true);
    } catch (error) {
      console.error(error);
      setFeedbackMessage(
        error instanceof Error ? error.message : "Failed to add item to cart"
      );
      setFeedbackTone("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="border border-black px-5 py-5 md:px-7 md:py-6">
      <div className="space-y-7">
        <div>
          <p className="ui-caption tracking-[0.08em] uppercase">Purchase</p>

          <div className="mt-4 space-y-4 border-t border-black pt-4">
            <div className="flex items-center justify-between gap-6 border-b border-black/15 pb-2">
              <span className="ui-body">Size</span>
              <span className="ui-body">12 oz</span>
            </div>

            <div className="flex items-center justify-between gap-6 border-b border-black/15 pb-2">
              <span className="ui-body">Grind</span>
              <span className="ui-body">Whole bean</span>
            </div>

            <div className="flex items-center justify-between gap-6 border-b border-black/15 pb-2">
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
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isSubmitting}
            className="ui-button ui-button-block"
          >
            {isSubmitting ? "Adding..." : "Add to cart"}
          </button>

          <p className="ui-body-sm-copy ui-subtle">
            Roasted weekly in small batches. Shipping is calculated at checkout.
          </p>
        </div>

        {feedbackMessage ? (
          <p
            className={`ui-body-sm-copy ${
              feedbackTone === "error" ? "text-red-700" : "ui-muted"
            }`}
            role={feedbackTone === "error" ? "alert" : "status"}
          >
            {feedbackMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
