import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SiteShell from "@/components/SiteShell";

type SuccessPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return (
      <SiteShell>
        <section className="mt-16 pb-24">
          <div className="mx-auto max-w-[800px]">
            <h1 className="text-[18px] leading-[0.92]">Order confirmation</h1>
            <p className="mt-8 text-[18px] leading-[1.15]">
              We could not find your checkout session.
            </p>
            <div className="mt-10">
              <Link
                href="/shop"
                className="inline-block border border-black px-5 py-3.5 text-[18px] leading-none hover:underline"
              >
                Return to shop
              </Link>
            </div>
          </div>
        </section>
      </SiteShell>
    );
  }

  const order = await prisma.order.findUnique({
    where: { stripeCheckoutSessionId: session_id },
    include: {
      items: true,
    },
  });

  if (!order) {
    return (
      <SiteShell>
        <section className="mt-16 pb-24">
          <div className="mx-auto max-w-[800px]">
            <h1 className="text-[18px] leading-[0.92]">
              Thank you for your order!
            </h1>

            <p className="mt-8 text-[18px] leading-[1.15]">
              Your payment was received and we’re processing your order now.
            </p>

            <p className="mt-4 text-[18px] leading-[1.2]">
              You’ll receive a confirmation email shortly.
            </p>

            <div className="mt-10">
              <Link
                href="/shop"
                className="inline-block border border-black px-5 py-3.5 text-[18px] leading-none hover:underline"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="mt-16 pb-24">
        <div className="mx-auto max-w-[900px]">
          <h1 className="text-[18px] leading-[0.92]">
            Thank you for your order!
          </h1>

          <p className="mt-2 text-[18px] leading-[1.15]">
            Your order has been received and is being prepared.
          </p>

          <div className="mt-5 pt-3">
            <p className="text-[18px] leading-none font-bold">
              Order #{order.id}
            </p>

            <p className="mt-2 text-[18px] leading-[1.2]">
              A confirmation email has been sent to {order.customerEmail}.
            </p>
          </div>

          <div className="mt-24 grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-[18px] leading-none">Order summary</h2>

              <div className="mt-2 border-t border-black">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-6 py-4"
                  >
                    <div>
                      <p className="font-display text-[18px] leading-none">
                        {item.productNameSnap}
                      </p>
                      <p className="mt-2 text-[18px] leading-[1.2]">
                        {formatBagSize(item.selectedSize)} / {formatGrind(item.selectedGrind)}
                      </p>
                    </div>

                    <div className="text-[18px] leading-none">
                      x{item.quantity}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 flex items-center justify-between border-b border-black pb-4">
                <span className="text-[18px] leading-none">Total</span>
                <span className="text-[18px] leading-none">
                  {formatPrice(order.totalCents)}
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-[18px] leading-none">Shipping to</h2>

              <div className="mt-6 space-y-1 text-[18px] leading-[1.2]">
                {order.shippingName ? <p>{order.shippingName}</p> : null}
                {order.shippingLine1 ? <p>{order.shippingLine1}</p> : null}
                {order.shippingLine2 ? <p>{order.shippingLine2}</p> : null}
                <p>
                  {[order.shippingCity, order.shippingState, order.shippingZip]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {order.shippingCountry ? <p>{order.shippingCountry}</p> : null}
              </div>

              <p className="mt-8 text-[18px] leading-[1.2]">
                Orders are batch roasted on Saturday and typically ship out the following Monday.
              </p>
            </div>
          </div>

          <div className="mt-14">
            <Link
              href="/shop"
              className="inline-block border border-black px-5 py-3.5 text-[18px] leading-none hover:underline"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatBagSize(size: string) {
  switch (size) {
    case "oz12":
      return "12 oz";
    default:
      return size;
  }
}

function formatGrind(grind: string) {
  switch (grind) {
    case "whole_bean":
      return "Whole bean";
    default:
      return grind;
  }
}