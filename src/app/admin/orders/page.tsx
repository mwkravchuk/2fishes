import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SiteShell from "@/components/SiteShell";
import StatusBadge from "@/components/admin/StatusBadge";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      items: true,
    },
  });

  return (
    <SiteShell>
      <section className="mt-16 pb-24">
        <div className="mx-auto max-w-[1080px]">
          <div className="mt-12">
            <div className="grid grid-cols-[1.2fr_1.2fr_.8fr_.8fr_.8fr] gap-6 border-b border-black pb-4 text-[18px] leading-none">
              <div>Order</div>
              <div>Customer</div>
              <div>Payment</div>
              <div>Fulfillment</div>
              <div>Total</div>
            </div>

            <div>
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="grid grid-cols-[1.2fr_1.2fr_.8fr_.8fr_.8fr] gap-6 border-b border-black py-4"
                >
                  <div>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-[18px] leading-none hover:underline font-bold"
                    >
                      #{order.id}
                    </Link>

                    <p className="mt-2 text-[15px] leading-[1.2]">
                      {formatDate(order.createdAt)}
                    </p>

                    <div className="mt-4 space-y-1 text-[15px] leading-[1.2]">
                      {order.items.map((item) => (
                        <p key={item.id}>
                          {item.productNameSnap} × {item.quantity}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[18px] leading-none">
                      {order.customerEmail}
                    </p>

                    <div className="mt-3 space-y-1 text-[15px] leading-[1.2]">
                      {order.shippingName ? <p>{order.shippingName}</p> : null}
                      {order.shippingLine1 ? <p>{order.shippingLine1}</p> : null}
                      {order.shippingLine2 ? <p>{order.shippingLine2}</p> : null}
                      <p>
                        {[
                          order.shippingCity,
                          order.shippingState,
                          order.shippingZip,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>

                  <div>
                    <StatusBadge status={order.paymentStatus} />
                  </div>

                  <div>
                    <StatusBadge status={order.fulfillmentStatus} />
                  </div>

                  <div className="text-[18px] leading-none">
                    {formatPrice(order.totalCents)}
                  </div>
                </div>
              ))}
            </div>

            {orders.length === 0 ? (
              <div className="border-b border-black py-8">
                <p className="text-[18px] leading-[1.1]">No orders yet.</p>
              </div>
            ) : null}
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
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}