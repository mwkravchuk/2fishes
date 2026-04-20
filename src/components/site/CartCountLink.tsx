"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CART_CHANGED_EVENT } from "@/lib/cart-events";

type CartChangedDetail = {
  itemCount: number;
};

export default function CartCountLink() {
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadCartCount() {
      try {
        const res = await fetch("/api/cart/summary", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          console.error("Failed to load cart summary:", res.status);
          return;
        }

        const data = await res.json();

        if (!data.ok) return;
        if (!isMounted) return;

        setItemCount(data.itemCount);
      } catch (error) {
        console.error(error);
      }
    }

    function handleCartChanged(event: Event) {
      const customEvent = event as CustomEvent<CartChangedDetail>;
      setItemCount(customEvent.detail.itemCount);
    }

    loadCartCount();
    window.addEventListener(CART_CHANGED_EVENT, handleCartChanged);

    return () => {
      isMounted = false;
      window.removeEventListener(CART_CHANGED_EVENT, handleCartChanged);
    };
  }, []);

  return <Link href="/cart" className="hover:underline">Cart ({itemCount})</Link>;
}