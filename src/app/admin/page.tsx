import Link from "next/link";
import {
  formatBatchRange,
  getAdminDashboardData,
} from "@/features/admin/dashboard/get-dashboard-data";

export default async function AdminPage() {
  const {
    start,
    end,
    productCount,
    pendingOrdersCount,
    opsAlertsCount,
    batchOrdersCount,
    roastSummary,
    totalBatchBags,
    totalBatchLb,
  } = await getAdminDashboardData();

  return (
    <section className="ui-admin-page">
      <div className="ui-page-wide">
        <div className="grid gap-6 md:gap-8 md:grid-cols-3">
          <Link
            href="/admin/products"
            className="block border border-black p-6 transition hover:bg-black/5 md:p-8"
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
            className="block border border-black p-6 transition hover:bg-black/5 md:p-8"
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

          <Link
            href="/admin/ops"
            className="block border border-black p-6 transition hover:bg-black/5 md:p-8"
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex gap-2">
                  <h2 className="text-[24px] leading-none">Ops</h2>
                  <p>({opsAlertsCount} alerts)</p>
                </div>
                <p className="mt-4 text-[18px] leading-[1.2] opacity-80">
                  Review checkout recovery issues, email failures, and future operational alerts.
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="ui-admin-block">
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
                <p>{batchOrdersCount} orders in batch</p>
                <p>{totalBatchBags} bags total</p>
                <p>{totalBatchLb} lb to roast</p>
              </div>
            </div>

            <div className="mt-8 border-t border-black pt-6 md:mt-10">
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
  );
}
