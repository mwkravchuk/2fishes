import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SiteShell from "@/components/SiteShell";

type RoastSummaryRow = {
  productName: string;
  bags: number;
  totalOz: number;
  totalLb: number;
};

function getCurrentBatchWindow(now = new Date()) {
  const current = new Date(now);

  // Saturday 12:00 AM of the current roast week
  const start = new Date(current);
  const day = current.getDay(); // Sunday=0, Saturday=6
  const daysSinceSaturday = (day + 1) % 7;
  start.setDate(current.getDate() - daysSinceSaturday);
  start.setHours(0, 0, 0, 0);

  // Friday 11:59:59.999 PM of the current roast week
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function formatBatchRange(start: Date, end: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  });

  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

function getBagSizeOz(size: string | null | undefined) {
  switch (size) {
    case "oz12":
      return 12;
    case "oz8":
      return 8;
    case "oz16":
      return 16;
    case "lb2":
      return 32;
    case "lb5":
      return 80;
    default:
      return 12; // fallback for your current setup
  }
}

export default async function AdminPage() {
  const { start, end } = getCurrentBatchWindow();

  const [productCount, pendingOrdersCount, batchOrders] = await Promise.all([
    prisma.product.count(),
    prisma.order.count({
      where: {
        fulfillmentStatus: "pending",
      },
    }),
    prisma.order.findMany({
      where: {
        fulfillmentStatus: "pending",
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
  ]);

  const roastMap = new Map<string, { bags: number; totalOz: number }>();

  for (const order of batchOrders) {
    for (const item of order.items) {
      const productName = item.productNameSnap;
      const qty = item.quantity ?? 0;
      const bagOz = getBagSizeOz(item.selectedSize);
      const totalOz = qty * bagOz;

      const current = roastMap.get(productName) ?? { bags: 0, totalOz: 0 };

      roastMap.set(productName, {
        bags: current.bags + qty,
        totalOz: current.totalOz + totalOz,
      });
    }
  }

  const roastSummary: RoastSummaryRow[] = Array.from(roastMap.entries())
    .map(([productName, value]) => ({
      productName,
      bags: value.bags,
      totalOz: value.totalOz,
      totalLb: Number((value.totalOz / 16).toFixed(2)),
    }))
    .sort((a, b) => b.totalOz - a.totalOz);

  const totalBatchBags = roastSummary.reduce((sum, row) => sum + row.bags, 0);
  const totalBatchOz = roastSummary.reduce((sum, row) => sum + row.totalOz, 0);
  const totalBatchLb = Number((totalBatchOz / 16).toFixed(2));

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
          <div className="mt-24">
            <div>
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[18px] leading-none opacity-70">
                    This week&apos;s roast
                  </p>
                  <h1 className="mt-3 text-[32px] leading-none">
                    {formatBatchRange(start, end)}
                  </h1>
                </div>

                <div className="grid gap-3 text-[18px] leading-none md:text-right">
                  <p>{batchOrders.length} orders in batch</p>
                  <p>{totalBatchBags} bags total</p>
                  <p>{totalBatchLb} lb to roast</p>
                </div>
              </div>

              <div className="mt-10 border-t border-black pt-6">
                {roastSummary.length === 0 ? (
                  <p className="text-[18px] leading-[1.2] opacity-70">
                    No pending orders in this week&apos;s roast window yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {roastSummary.map((row) => (
                      <div
                        key={row.productName}
                        className="flex items-start justify-between gap-6 border-b border-black/10 pb-4"
                      >
                        <div>
                          <p className="text-[18px] leading-none">
                            {row.productName}
                          </p>
                          <p className="mt-2 text-[18px] leading-[1.2] opacity-70">
                            {row.bags} bags
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[18px] leading-none">
                            {row.totalOz} oz
                          </p>
                          <p className="mt-2 text-[18px] leading-[1.2] opacity-70">
                            {row.totalLb} lb
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8">
                <Link
                  href="/admin/orders"
                  className="inline-block border border-black px-6 py-4 text-[18px] leading-none transition hover:bg-black/5"
                >
                  View orders
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}