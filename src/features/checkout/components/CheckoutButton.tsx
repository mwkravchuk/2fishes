"use client";

import { useState } from "react";

export default function CheckoutButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCheckout() {
    try {
      setIsSubmitting(true);

      const res = await fetch("/api/checkout", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Failed to start checkout"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={isSubmitting}
      className="w-full border border-black px-5 py-3.5 text-[18px] leading-none cursor-pointer hover:underline disabled:opacity-60"
    >
      {isSubmitting ? "Redirecting..." : "Continue to checkout"}
    </button>
  );
}