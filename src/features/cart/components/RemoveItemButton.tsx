"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { emitCartChanged } from "@/lib/cart-events";

type Props = {
  cartItemId: string;
};

export default function RemoveItemButton({ cartItemId }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRemove() {
    try {
      setIsSubmitting(true);

      const res = await fetch(`/api/cart/items/${cartItemId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error);

      emitCartChanged(data.itemCount);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      onClick={handleRemove}
      disabled={isSubmitting}
      className="text-[18px] leading-none hover:underline cursor-pointer disabled:opacity-40"
    >
      ( x )
    </button>
  );
}