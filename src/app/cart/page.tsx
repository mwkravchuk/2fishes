import Link from "next/link";
import { cookies } from "next/headers";
import SiteShell from "@/components/SiteShell";
import QuantityControls from "@/components/QuantityControls";
import RemoveItemButton from "@/components/RemoveItemButton";
import CheckoutButton from "@/components/CheckoutButton";
import {
  CART_COOKIE_NAME,
  formatBagSize,
  formatPrice,
  formatGrindOption,
  getCartBySession,
} from "@/lib/cart";
import { getProductImageUrl } from "@/lib/product-images";
import RoastScheduleNotice from "@/components/RoastScheduleNotice";

export default async function CartPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(CART_COOKIE_NAME)?.value;

  const cart = sessionId ? await getCartBySession(sessionId) : null;
  const items = cart?.items ?? [];

  return (
    <SiteShell>
      <section className="mt-16 pb-24">
        <div className="mx-auto max-w-[800px]">
          {items.length === 0 ? (
            <EmptyCart />
          ) : (
            <div>
              <RoastScheduleNotice
                variant="cart"
                className="mb-16 max-w-[1080px]"
              />

              <CartHeader />

              <div className="border-t border-black">
                {items.map((item) => {
                  const lineTotalCents = item.unitPriceCents * item.quantity;

                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1.8fr_.8fr_.8fr_.8fr_.3fr] items-start gap-6 border-b border-black py-3"
                    >
                      <div className="flex items-start gap-5">
                        <div className="h-[66px] w-[66px] shrink-0 overflow-hidden bg-[#d8d0c4]">
                          {item.product.imageKey ? (
                            <img
                              src={getProductImageUrl(item.product.imageKey)}
                              alt={item.productNameSnap}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>

                        <div className="space-y-1">
                          <Link
                            href={`/shop/${item.product.slug}`}
                            className="font-display text-[18px] leading-none hover:underline"
                          >
                            {item.productNameSnap}
                          </Link>

                          <div className="pt-2 space-y-1">
                            <p className="text-[16px] leading-none">
                              {formatBagSize(item.selectedSize)}
                            </p>
                            <p className="text-[16px] leading-none">
                              {formatGrindOption(item.selectedGrind)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="text-[18px] leading-none">
                        {formatPrice(item.unitPriceCents)}
                      </div>

                      <QuantityControls
                        cartItemId={item.id}
                        quantity={item.quantity}
                      />

                      <div className="text-[18px] leading-none">
                        {formatPrice(lineTotalCents)}
                      </div>

                      {/* Remove (far right) */}
                      <div className="flex justify-end">
                        <RemoveItemButton cartItemId={item.id} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-16 flex justify-end">
                <div className="w-full max-w-[420px]">
                  <div className="flex items-center justify-between border-b border-black pb-3">
                    <span className="text-[18px] leading-none">Total</span>
                    <span className="text-[18px] leading-none">
                      {formatPrice(cart?.totalCents ?? 0)}
                    </span>
                  </div>

                  <div className="mt-8">
                    <CheckoutButton />
                  </div>

                  <p className="mt-4 text-[16px] leading-[1.2]">
                    Taxes and shipping calculated at checkout.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

function CartHeader() {
  return (
    <div className="grid grid-cols-[1.8fr_.8fr_.8fr_.8fr_.3fr] gap-6 pb-3 text-[18px] leading-none">
      <div>Product</div>
      <div>Price</div>
      <div>Quantity</div>
      <div>Subtotal</div>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="max-w-[700px]">
      <div className="mt-10 border-t border-black pt-6">
        <p className="text-[18px] leading-[1.1]">Your cart is empty.</p>

        <div className="mt-10">
          <Link
            href="/shop"
            className="inline-block border border-black px-8 py-4 text-[18px] leading-none hover:underline"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}