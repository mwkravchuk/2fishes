"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CART_CHANGED_EVENT } from "@/lib/cart-events";

type CartDrawerItem = {
  id: string;
  productName: string;
  productSlug: string | null;
  imageUrl: string | null;
  quantity: number;
  lineTotal: string;
  sizeLabel: string;
  grindLabel: string;
};

type CartPreview = {
  itemCount: number;
  subtotal: string;
  items: CartDrawerItem[];
};

type CartChangedDetail = {
  itemCount: number;
  openDrawer?: boolean;
};

type SiteHeaderClientProps = {
  isAdmin: boolean;
  isLoggedIn: boolean;
  logoutAction?: () => Promise<void>;
};

const emptyPreview: CartPreview = {
  itemCount: 0,
  subtotal: "$0.00",
  items: [],
};

export default function SiteHeaderClient({
  isAdmin,
  isLoggedIn,
  logoutAction,
}: SiteHeaderClientProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [itemCount, setItemCount] = useState(0);
  const [cartPreview, setCartPreview] = useState<CartPreview>(emptyPreview);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPreview() {
      try {
        const res = await fetch("/api/cart/preview", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          console.error("Failed to load cart preview:", res.status);
          return;
        }

        const data = await res.json();

        if (!data.ok || !isMounted) return;

        setItemCount(data.itemCount);
        setCartPreview({
          itemCount: data.itemCount,
          subtotal: data.subtotal,
          items: data.items,
        });
      } catch (error) {
        console.error(error);
      }
    }

    function handleCartChanged(event: Event) {
      const customEvent = event as CustomEvent<CartChangedDetail>;
      setItemCount(customEvent.detail.itemCount);
      void loadPreview();

      if (customEvent.detail.openDrawer) {
        setIsDrawerOpen(true);
        setIsMenuOpen(false);
      }
    }

    void loadPreview();
    window.addEventListener(CART_CHANGED_EVENT, handleCartChanged);

    return () => {
      isMounted = false;
      window.removeEventListener(CART_CHANGED_EVENT, handleCartChanged);
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    document.body.style.overflow =
      isDrawerOpen || isMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen, isMenuOpen]);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-(--background)">
        <div className="ui-page-full flex items-center justify-between gap-4 py-5 md:flex-wrap md:items-start md:gap-x-6 md:gap-y-3 md:py-4">
          <Link
            href="/"
            className="relative hidden h-7 w-7 md:inline-block"
            aria-label="Go to homepage"
          >
            <Image
              src="/logo.png"
              alt="2fishes"
              fill
              className="object-contain"
              sizes="64px"
              priority
            />
          </Link>

          <div className="hidden items-center gap-8 text-[16px] md:flex md:gap-10">
            <Link href="/shop" className="hover:underline">
              Shop
            </Link>
            <Link href="/about" className="hover:underline">
              About
            </Link>
            {isAdmin ? (
              <Link href="/admin" className="hover:underline">
                Admin
              </Link>
            ) : null}
          </div>

          <div className="hidden items-center gap-2 text-[16px] md:flex md:gap-4">
            {isLoggedIn && logoutAction ? (
              <form action={logoutAction}>
                <button className="cursor-pointer hover:underline">
                  Log out
                </button>
              </form>
            ) : null}

            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="cursor-pointer hover:underline"
              aria-label={`Open cart with ${itemCount} items`}
            >
              Cart ({itemCount})
            </button>
          </div>

          <div className="flex w-full items-center justify-between text-[16px] md:hidden">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen((open) => !open);
                setIsDrawerOpen(false);
              }}
              className="cursor-pointer"
              aria-expanded={isMenuOpen}
              aria-label="Toggle menu"
            >
              Menu
            </button>

            <button
              type="button"
              onClick={() => {
                setIsDrawerOpen(true);
                setIsMenuOpen(false);
              }}
              className="cursor-pointer"
              aria-label={`Open cart with ${itemCount} items`}
            >
              Cart ({itemCount})
            </button>
          </div>
        </div>
      </nav>

      {isMenuOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-x-0 top-0 z-50 h-auto max-h-[100dvh] overflow-y-auto bg-(--background) px-[1.125rem] py-5 transition-transform duration-200 ease-out md:hidden ${
          isMenuOpen ? "translate-y-0" : "-translate-y-full"
        }`}
        aria-hidden={!isMenuOpen}
      >
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className="cursor-pointer text-[16px]"
            aria-label="Close menu"
          >
            Close
          </button>
        </div>

        <div className="mt-5 space-y-4 border-t border-black pt-5 text-[18px] leading-none">
          <Link
            href="/"
            className="block"
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/shop"
            className="block"
            onClick={() => setIsMenuOpen(false)}
          >
            Shop
          </Link>
          <Link
            href="/about"
            className="block"
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </Link>
          {isAdmin ? (
            <Link
              href="/admin"
              className="block"
              onClick={() => setIsMenuOpen(false)}
            >
              Admin
            </Link>
          ) : null}
          {isLoggedIn && logoutAction ? (
            <form action={logoutAction}>
              <button className="block cursor-pointer text-left">
                Log out
              </button>
            </form>
          ) : null}
        </div>
      </aside>

      {isDrawerOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setIsDrawerOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed right-0 top-0 z-50 flex h-[100dvh] w-full max-w-[420px] flex-col bg-(--background) transition-transform duration-250 ease-out ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isDrawerOpen}
      >
        <div className="px-[1.125rem] py-4 md:px-[var(--page-gutter-wide)]">
          <div className="flex min-h-7 items-center justify-end">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="cursor-pointer text-[16px] hover:underline"
              aria-label="Close cart"
            >
              Close
            </button>
          </div>

          <div className="mt-4 border-t border-black" />
        </div>

        <div className="flex-1 overflow-y-auto px-[1.125rem] pb-5 md:px-[var(--page-gutter-wide)]">
          {cartPreview.items.length === 0 ? (
            <div className="pt-5">
              <p className="ui-body">Your cart is empty.</p>
            </div>
          ) : (
            <div>
              {cartPreview.items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[84px_minmax(0,1fr)] gap-4 py-4"
                >
                  <div className="ui-thumb-md relative">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="72px"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    {item.productSlug ? (
                      <Link
                        href={`/shop/${item.productSlug}`}
                        className="font-display text-[18px] leading-[0.98] hover:underline"
                        onClick={() => setIsDrawerOpen(false)}
                      >
                        {item.productName}
                      </Link>
                    ) : (
                      <p className="font-display text-[18px] leading-[0.98]">
                        {item.productName}
                      </p>
                    )}

                    <div className="mt-2 space-y-1 text-[15px] leading-[1.2] opacity-80">
                      <p>
                        {item.sizeLabel} / {item.grindLabel}
                      </p>
                      <div className="flex items-center justify-between gap-3">
                        <p>Qty. {item.quantity}</p>
                        <p className="shrink-0 text-[17px] leading-none text-black">
                          {item.lineTotal}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-[1.125rem] py-5 md:px-[var(--page-gutter-wide)]">
          <div className="border-t border-black pt-5">
            <div className="flex items-center justify-between text-[16px] leading-none md:text-[18px]">
              <span>Subtotal</span>
              <span>{cartPreview.subtotal}</span>
            </div>

            <div className="mt-6">
              <Link
                href="/cart"
                className="ui-button ui-button-block"
                onClick={() => setIsDrawerOpen(false)}
              >
                Go To Cart
              </Link>
            </div>

            <p className="mt-4 text-[15px] leading-[1.25] opacity-80">
              Taxes and shipping calculated at checkout.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
