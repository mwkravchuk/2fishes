import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SiteShell from "@/components/SiteShell";

export default async function AdminPage() {
  const [productCount, pendingOrdersCount] = await Promise.all([
    prisma.product.count(),
    prisma.order.count({
      where: {
        fulfillmentStatus: "pending",
      },
    }),
  ]);

  return (
    <SiteShell>
      <section className="pb-24">
        <div className="mx-auto max-w-[1080px]">
          <div className="mt-30 grid gap-8 md:grid-cols-2">
            <Link
              href="/admin/products"
              className="block border border-black p-8 transition hover:bg-black/5"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="flex gap-2">
                    <h2 className="text-[24px] leading-none">Products</h2>
                    <p>({productCount})</p>
                  </div>
                  <p className="mt-4 text-[18px] leading-[1.2] opacity-80">
                    Create, edit, and manage what appears in the shop.
                  </p>
                </div>

              </div>
            </Link>

            <Link
              href="/admin/orders"
              className="block border border-black p-8 transition hover:bg-black/5"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="flex gap-2">
                    <h2 className="text-[24px] leading-none">Orders</h2>
                    <p>({pendingOrdersCount} pending)</p>
                  </div>
                  <p className="mt-4 text-[18px] leading-[1.2] opacity-80">
                    Review purchases, update fulfillment, and track status.
                  </p>
                </div>

              </div>
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}