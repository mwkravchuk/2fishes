"use client";

import { useState } from "react";

export default function CheckoutButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleCheckout() {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

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
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to start checkout"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isSubmitting}
        className="ui-button ui-button-block"
      >
        {isSubmitting ? "Redirecting..." : "Continue to checkout"}
      </button>

      {errorMessage ? (
        <p className="ui-body-sm-copy mt-4 text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </>
  );
}
