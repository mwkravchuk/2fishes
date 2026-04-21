import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProductImageUrl } from "@/lib/product-images";
import { getStripePaymentDashboardUrl } from "@/lib/stripe-dashboard";
import OrderEmailJobs from "@/features/admin/components/OrderEmailJobs";
import OrderFulfillmentForm from "@/features/admin/components/OrderFulfillmentForm";
import StatusBadge from "@/features/admin/components/StatusBadge";

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
      emailJobs: {
        orderBy: {
          createdAt: "asc",
        },
      },
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
    <section className="mt-16 pb-24">
      <div className="mx-auto max-w-[1080px]">
        <div className="mt-14 grid gap-16 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <p className="text-[15px] leading-none">
              <Link href="/admin/orders" className="hover:underline">
                ← Back to orders
              </Link>
            </p>

            <h1 className="mt-6 text-[24px] leading-none">Order #{order.id}</h1>

            <p className="mt-3 text-[18px] leading-[1.2] opacity-80">
              Placed {formatDate(order.createdAt)}
            </p>

            <div className="space-y-14">
              <section>
                <div className="mt-4 border-t border-black">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[72px_1fr_auto] gap-5 border-b border-black/10 py-5"
                    >
                      <div className="ui-thumb-md">
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
                            className="font-display text-[18px] leading-none hover:underline"
                          >
                            {item.productNameSnap}
                          </Link>
                        ) : (
                          <p className="text-[18px] leading-none">
                            {item.productNameSnap}
                          </p>
                        )}

                        <div className="mt-3 space-y-1 text-[15px] leading-[1.25] opacity-80">
                          <p>
                            {formatBagSize(item.selectedSize)} /{" "}
                            {formatGrind(item.selectedGrind)}
                          </p>
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

                <div className="ml-auto mt-10 max-w-[360px]">
                  <div className="flex items-center justify-between py-2 text-[18px] leading-none">
                    <span>Subtotal</span>
                    <span>{formatPrice(order.subtotalCents)}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 text-[18px] leading-none">
                    <span>Shipping</span>
                    <span>{formatPrice(order.shippingCents)}</span>
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-black pt-3 text-[18px] font-medium leading-none">
                    <span>Total</span>
                    <span>{formatPrice(order.totalCents)}</span>
                  </div>
                </div>
              </section>

              <div className="grid gap-12 md:grid-cols-2">
                <section>
                  <h2 className="text-[18px] leading-none">Customer</h2>

                  <div className="mt-4 border-t border-black pt-5">
                    <p className="text-[15px] leading-none opacity-70">Email</p>
                    <p className="mt-2 break-all text-[18px] leading-[1.25]">
                      {order.customerEmail}
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-[18px] leading-none">Shipping</h2>

                  <div className="mt-4 space-y-2 border-t border-black pt-5 text-[15px] leading-[1.35]">
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
              </div>
            </div>
          </div>

          <aside className="space-y-17.5 border-l pl-10">
            <section>
              <div className="mt-5 flex gap-5">
                <div>
                  <p className="text-[15px] leading-none opacity-70">Payment</p>
                  <div className="mt-2">
                    <StatusBadge status={order.paymentStatus} />
                  </div>
                </div>

                <div>
                  <p className="text-[15px] leading-none opacity-70">
                    Fulfillment
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={order.fulfillmentStatus} />
                  </div>
                </div>
              </div>
            </section>

            <section>
              <OrderFulfillmentForm
                orderId={order.id}
                fulfillmentStatus={order.fulfillmentStatus}
                paymentStatus={order.paymentStatus}
                trackingCarrier={order.trackingCarrier}
                trackingNumber={order.trackingNumber}
              />
            </section>

            <section>
              <OrderEmailJobs
                orderId={order.id}
                jobs={order.emailJobs.map((job) => ({
                  id: job.id,
                  type: job.type,
                  recipient: job.recipient,
                  status: job.status,
                  attempts: job.attempts,
                  sentAt: job.sentAt ? job.sentAt.toISOString() : null,
                  lastError: job.lastError,
                }))}
                shipmentEmail={{
                  recipient: order.customerEmail,
                  sentAt: order.shippingEmailSentAt
                    ? order.shippingEmailSentAt.toISOString()
                    : null,
                  trackingCarrier: order.trackingCarrier,
                  trackingNumber: order.trackingNumber,
                }}
              />
            </section>

            <section>
              {order.stripePaymentIntentId ? (
                <div>
                  <Link
                    href={getStripePaymentDashboardUrl(order.stripePaymentIntentId)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[18px] font-bold leading-none hover:underline"
                  >
                    View payment in Stripe
                  </Link>

                  <p className="mt-2 break-all text-[15px] leading-[1.25] opacity-70">
                    {order.stripePaymentIntentId}
                  </p>
                </div>
              ) : (
                <p className="text-[15px] leading-[1.25]">
                  No Stripe payment reference found.
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </section>
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
