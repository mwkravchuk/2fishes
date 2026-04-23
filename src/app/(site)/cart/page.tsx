import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  CART_COOKIE_NAME,
  formatBagSize,
  formatPrice,
  formatGrindOption,
  getCartBySession,
} from "@/lib/cart";
import { getProductImageUrl } from "@/lib/product-images";
import RoastScheduleNotice from "@/components/RoastScheduleNotice";
import QuantityControls from "@/features/cart/components/QuantityControls";
import RemoveItemButton from "@/features/cart/components/RemoveItemButton";
import CheckoutButton from "@/features/checkout/components/CheckoutButton";

export default async function CartPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(CART_COOKIE_NAME)?.value;

  const cart = sessionId ? await getCartBySession(sessionId) : null;
  const items = cart?.items ?? [];

  return (
    <section className="mt-16 pb-24">
      <div className="ui-page-narrow">
        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div>
            <RoastScheduleNotice
              variant="cart"
              className="mb-10 md:mb-16 md:max-w-[1080px]"
            />

            <CartHeader />

            <div className="border-t border-black">
              {items.map((item) => {
                const lineTotalCents = item.unitPriceCents * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="grid gap-4 py-4 md:grid-cols-[1.8fr_.8fr_.8fr_.8fr_.3fr] md:items-start md:gap-6 md:py-5"
                  >
                    <div className="flex items-start gap-5">
                      <div className="ui-thumb-sm relative shrink-0">
                        {item.product.imageKey ? (
                          <Image
                            src={getProductImageUrl(item.product.imageKey)}
                            alt={item.productNameSnap}
                            fill
                            className="object-cover"
                            sizes="66px"
                          />
                        ) : null}
                      </div>

                      <div className="space-y-1">
                        <Link
                          href={`/shop/${item.product.slug}`}
                          className="font-display ui-body hover:underline leading-tight"
                        >
                          {item.productNameSnap}
                        </Link>

                        <div className="space-y-1 pt-2">
                          <p className="ui-body-sm">
                            {formatBagSize(item.selectedSize)}
                          </p>
                          <p className="ui-body-sm">
                            {formatGrindOption(item.selectedGrind)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-black/10 pt-3 md:block md:border-t-0 md:pt-0">
                      <span className="ui-body-sm ui-muted md:hidden">Price</span>
                      <div className="ui-body">{formatPrice(item.unitPriceCents)}</div>
                    </div>

                    <div className="flex items-center justify-between md:block">
                      <span className="ui-body-sm ui-muted md:hidden">Quantity</span>
                      <QuantityControls
                        cartItemId={item.id}
                        quantity={item.quantity}
                      />
                    </div>

                    <div className="flex items-center justify-between md:block">
                      <span className="ui-body-sm ui-muted md:hidden">Subtotal</span>
                      <div className="ui-body">{formatPrice(lineTotalCents)}</div>
                    </div>

                    <div className="flex justify-start md:justify-end">
                      <RemoveItemButton cartItemId={item.id} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-16 flex justify-end">
              <div className="w-full max-w-[420px]">
                <div className="flex items-center justify-between border-b border-black pb-3">
                  <span className="ui-body">Total</span>
                  <span className="ui-body">
                    {formatPrice(cart?.totalCents ?? 0)}
                  </span>
                </div>

                <div className="mt-8">
                  <CheckoutButton />
                </div>

                <p className="ui-body-sm-copy mt-4">
                  Taxes and shipping calculated at checkout.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function CartHeader() {
  return (
    <div className="ui-body hidden grid-cols-[1.8fr_.8fr_.8fr_.8fr_.3fr] gap-6 pb-3 md:grid">
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
        <p className="ui-body-snug">Your cart is empty.</p>

        <div className="mt-10">
          <Link
            href="/shop"
            className="ui-button ui-button-wide inline-block"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
