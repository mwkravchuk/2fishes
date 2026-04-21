import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/features/admin/components/StatusBadge";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      emailJobs: true,
      items: true,
    },
  });

  return (
    <section className="mt-10 pb-24 md:mt-16">
      <div className="ui-page-wide">
        <div className="mt-6 md:mt-12">
          <div className="hidden grid-cols-[1.35fr_1.1fr_.75fr_.85fr_.85fr_.7fr] gap-6 border-b border-black pb-4 text-[18px] leading-none md:grid">
            <div>Order</div>
            <div>Customer</div>
            <div>Payment</div>
            <div>Email</div>
            <div>Fulfillment</div>
            <div className="text-right">Total</div>
          </div>

          {orders.length === 0 ? (
            <div className="border-b border-black py-8">
              <p className="text-[18px] leading-[1.1]">No orders yet.</p>
            </div>
          ) : (
            <div>
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="block odd:bg-transparent even:bg-black/5 transition hover:bg-black/10"
                >
                  <div className="grid gap-5 px-3 py-5 md:grid-cols-[1.35fr_1.1fr_.75fr_.85fr_.85fr_.7fr] md:items-start md:gap-6 md:px-2">
                    <div>
                      <p className="text-[18px] leading-none">#{order.id}</p>

                      <p className="mt-2 text-[15px] leading-[1.2] opacity-80">
                        {formatDate(order.createdAt)}
                      </p>

                      <div className="mt-4 space-y-1 text-[15px] leading-[1.25]">
                        {order.items.slice(0, 2).map((item) => (
                          <p key={item.id}>
                            {item.productNameSnap} × {item.quantity}
                          </p>
                        ))}

                        {order.items.length > 2 ? (
                          <p className="opacity-80">
                            +{order.items.length - 2} more
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <p className="text-[18px] leading-none">
                        {order.customerEmail}
                      </p>

                      <div className="mt-3 space-y-1 text-[15px] leading-[1.25] opacity-80">
                        {order.shippingName ? <p>{order.shippingName}</p> : null}
                        <p>
                          {[order.shippingCity, order.shippingState]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-black/10 pt-3 md:block md:border-t-0 md:pt-[2px]">
                      <p className="ui-body-sm ui-muted md:hidden">Payment</p>
                      <StatusBadge status={order.paymentStatus} />
                    </div>

                    <div className="flex items-center justify-between md:block md:pt-[2px]">
                      <p className="ui-body-sm ui-muted md:hidden">Email</p>
                      <StatusBadge status={getOrderEmailStatus(order.emailJobs)} />
                    </div>

                    <div className="flex items-center justify-between md:block md:pt-[2px]">
                      <p className="ui-body-sm ui-muted md:hidden">Fulfillment</p>
                      <StatusBadge status={order.fulfillmentStatus} />
                    </div>

                    <div className="flex items-center justify-between text-[18px] font-medium leading-none md:block md:text-right">
                      <p className="ui-body-sm ui-muted font-normal md:hidden">Total</p>
                      {formatPrice(order.totalCents)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
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
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getOrderEmailStatus(
  jobs: {
    status: string;
  }[]
) {
  if (jobs.length === 0) {
    return "not_queued";
  }

  if (jobs.some((job) => job.status === "failed")) {
    return "email_failed";
  }

  if (jobs.every((job) => job.status === "sent")) {
    return "email_sent";
  }

  if (jobs.some((job) => job.status === "processing")) {
    return "email_processing";
  }

  return "email_pending";
}
