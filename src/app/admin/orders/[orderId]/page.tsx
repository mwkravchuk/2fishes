import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SiteShell from "@/components/SiteShell";
import { getStripePaymentDashboardUrl } from "@/lib/stripe-dashboard";
import OrderFulfillmentForm from "@/components/admin/OrderFulfillmentForm";
import StatusBadge from "@/components/admin/StatusBadge";
import { getProductImageUrl } from "@/lib/product-images";

type AdminOrderDetailPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            select: {
              slug: true,
              imageKey: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <SiteShell>
      <section className="mt-16 pb-24">
        <div className="mx-auto max-w-[1080px]">
          <div className="flex items-start justify-between gap-8">
            <div>
              <p className="text-[15px] leading-none">
                <Link href="/admin/orders" className="hover:underline">
                  ← Back to orders
                </Link>
              </p>

              <h1 className="font-bold mt-6 text-[18px] leading-[0.92]">
                Order #{order.id}
              </h1>

              <p className="mt-4 text-[18px] leading-[1.2]">
                Placed {formatDate(order.createdAt)}
              </p>
            </div>

            <div className="min-w-[240px] border border-black p-4">
              <div className="flex gap-4">
                <div>
                  <p className="text-[15px] leading-none">Payment</p>
                  <div className="mt-3">
                    <StatusBadge status={order.paymentStatus} />
                  </div>
                </div>

                <div>
                  <p className="text-[15px] leading-none">Fulfillment</p>
                  <div className="mt-3">
                    <StatusBadge status={order.fulfillmentStatus} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-14 grid gap-14 md:grid-cols-[1.2fr_.8fr]">
            <div>
              <section>
                <h2 className="text-[18px] leading-none">Items</h2>

                <div className="mt-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[66px_1fr_auto] gap-5 border-t border-black py-5"
                    >
                      <div className="h-[66px] w-[66px] overflow-hidden bg-[#d8d0c4]">
                        {item.product?.imageKey ? (
                          <img
                            src={getProductImageUrl(item.product.imageKey)}
                            alt={item.productNameSnap}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>

                      <div>
                        {item.product?.slug ? (
                          <Link
                            href={`/shop/${item.product.slug}`}
                            className="text-[18px] font-display leading-none hover:underline"
                          >
                            {item.productNameSnap}
                          </Link>
                        ) : (
                          <p className="text-[18px] leading-none">
                            {item.productNameSnap}
                          </p>
                        )}

                        <div className="mt-3 space-y-1 text-[15px] leading-[1.2]">
                          <p>{formatBagSize(item.selectedSize)}</p>
                          <p>{formatGrind(item.selectedGrind)}</p>
                          <p>Quantity: {item.quantity}</p>
                          <p>Unit price: {formatPrice(item.unitPriceCents)}</p>
                        </div>
                      </div>

                      <div className="text-[18px] leading-none">
                        {formatPrice(item.unitPriceCents * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 ml-auto max-w-[360px]">
                  <div className="flex items-center justify-between py-2 text-[18px] leading-none">
                    <span>Subtotal</span>
                    <span>{formatPrice(order.subtotalCents)}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 text-[18px] leading-none">
                    <span>Shipping</span>
                    <span>{formatPrice(order.shippingCents)}</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-black pt-3 mt-2 text-[18px] leading-none">
                    <span>Total</span>
                    <span>{formatPrice(order.totalCents)}</span>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-12">
              <section>
                <h2 className="text-[18px] leading-none">Customer</h2>

                <div className="mt-3 border-t border-black pt-5 space-y-4">
                  <div>
                    <p className="text-[15px] leading-none">Email</p>
                    <p className="mt-1 text-[18px] leading-none break-all">
                      {order.customerEmail}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-[18px] leading-none">Shipping</h2>

                <div className="mt-3 border-t border-black pt-5 space-y-2 text-[15px] leading-[1.25]">
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
              </section>

              <section>
                <h2 className="text-[18px] leading-none">Payment</h2>

                <div className="mt-3 border-t border-black pt-5 space-y-5">
                  {order.stripePaymentIntentId ? (
                    <div>
                      <a
                        href={getStripePaymentDashboardUrl(order.stripePaymentIntentId)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[18px] font-bold leading-none hover:underline"
                      >
                        View payment in Stripe
                      </a>

                      <p className="mt-1 text-[15px] leading-[1.2] break-all">
                        {order.stripePaymentIntentId}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[15px] leading-[1.2]">
                      No Stripe payment reference found.
                    </p>
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-[18px] leading-none">Actions</h2>

                <div className="mt-3 border-t border-black pt-5">
                  <OrderFulfillmentForm
                    orderId={order.id}
                    fulfillmentStatus={order.fulfillmentStatus}
                    trackingCarrier={order.trackingCarrier}
                    trackingNumber={order.trackingNumber}
                  />
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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