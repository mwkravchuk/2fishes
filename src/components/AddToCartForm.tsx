"use client";

import { useState } from "react";

type AddToCartFormProps = {
  productId: string;
  productName: string;
  unitPriceCents: number;
  selectedSize: string;
  selectedGrind: string;
};

type CartItem = {
  productId: string;
  productName: string;
  unitPriceCents: number;
  selectedSize: string;
  selectedGrind: string;
  quantity: number;
};

export default function AddToCartForm({
  productId,
  productName,
  unitPriceCents,
  selectedSize,
  selectedGrind,
}: AddToCartFormProps) {
  const [quantity, setQuantity] = useState(1);

  function decrement() {
    setQuantity((q) => Math.max(1, q - 1));
  }

  function increment() {
    setQuantity((q) => q + 1);
  }

  function handleAddToCart() {
    const existingCart = localStorage.getItem("cart");
    const cart: CartItem[] = existingCart ? JSON.parse(existingCart) : [];

    const existingItemIndex = cart.findIndex(
      (item) =>
        item.productId === productId &&
        item.selectedSize === selectedSize &&
        item.selectedGrind === selectedGrind
    );

    if (existingItemIndex >= 0) {
      cart[existingItemIndex].quantity += quantity;
    } else {
      cart.push({
        productId,
        productName,
        unitPriceCents,
        selectedSize,
        selectedGrind,
        quantity,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
  }

  return (
    <div>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-6 border-b border-black pb-3">
          <span className="text-[18px] leading-none">Size</span>
          <span className="text-[18px] leading-none">12 oz</span>
        </div>

        <div className="flex items-center justify-between gap-6 border-b border-black pb-3">
          <span className="text-[18px] leading-none">Grind</span>
          <span className="text-[18px] leading-none">Whole bean</span>
        </div>

        <div className="flex items-center justify-between gap-6 border-b border-black pb-3">
          <span className="text-[18px] leading-none">Quantity</span>

          <div className="flex items-center gap-5 text-[18px] leading-none">
            <button
              type="button"
              onClick={decrement}
              className="hover:underline cursor-pointer"
              aria-label="Decrease quantity"
            >
              -
            </button>

            <span className="min-w-[18px] text-center">{quantity}</span>

            <button
              type="button"
              onClick={increment}
              className="hover:underline cursor-pointer"
              aria-label="Increase quantity"
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
          className="w-full border border-black px-6 py-4 text-[18px] leading-none hover:underline cursor-pointer"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}