import Link from "next/link";
import RecoverOrderForm from "@/features/admin/components/RecoverOrderForm";
import { reconcileRecentPaidCheckoutSessions } from "@/features/checkout/server/checkout-recovery-issues";
import { prisma } from "@/lib/prisma";
import { getStripePaymentDashboardUrl } from "@/lib/stripe-dashboard";

export default async function AdminOpsPage() {
  const reconciliation = await reconcileRecentPaidCheckoutSessions();

  const [
    failedEmailJobsCount,
    pendingEmailJobsCount,
    openCheckoutRecoveryIssuesCount,
    openCheckoutRecoveryIssues,
    recentEmailFailures,
  ] =
    await Promise.all([
      prisma.emailJob.count({
        where: {
          status: "failed",
        },
      }),
      prisma.emailJob.count({
        where: {
          status: {
            in: ["pending", "processing"],
          },
        },
      }),
      prisma.checkoutRecoveryIssue.count({
        where: {
          status: "open",
        },
      }),
      prisma.checkoutRecoveryIssue.findMany({
        where: {
          status: "open",
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 10,
      }),
      prisma.emailJob.findMany({
        where: {
          status: "failed",
        },
        include: {
          order: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 10,
      }),
    ]);

  return (
    <section className="mt-16 pb-24">
      <div className="ui-page-wide">
        <p className="text-[15px] leading-none">
          <Link href="/admin" className="hover:underline">
            ← Back to admin
          </Link>
        </p>

        <div className="mt-6 text-[16px] leading-[1.25] opacity-70">
          {reconciliation.ok ? (
            <p>
              Stripe reconciliation checked {reconciliation.checkedSessions} paid
              sessions from the last {reconciliation.lookbackHours} hours and
              flagged {reconciliation.missingOrders} missing orders.
            </p>
          ) : (
            <p>
              Stripe reconciliation could not run: {reconciliation.error}
            </p>
          )}
        </div>
        
        <div className="mt-10 grid gap-4 md:grid-cols-2 md:gap-6">
          <div className="border border-black p-5 md:p-6">
            <p className="text-[18px] leading-none">
              Open checkout recovery issues
            </p>
            <p className="mt-3 text-[28px] leading-none">
              {openCheckoutRecoveryIssuesCount}
            </p>
            <p className="mt-3 text-[16px] leading-[1.25] opacity-70">
              Paid Stripe checkouts that failed to become internal orders.
            </p>
          </div>

          <div className="border border-black p-5 md:p-6">
            <p className="text-[18px] leading-none">Failed email jobs</p>
            <p className="mt-3 text-[28px] leading-none">
              {failedEmailJobsCount}
            </p>
            <p className="mt-3 text-[16px] leading-[1.25] opacity-70">
              Failed sends that likely need a retry or manual follow-up.
            </p>
          </div>

          <div className="border border-black p-5 md:p-6">
            <p className="text-[18px] leading-none">Pending email jobs</p>
            <p className="mt-3 text-[28px] leading-none">
              {pendingEmailJobsCount}
            </p>
            <p className="mt-3 text-[16px] leading-[1.25] opacity-70">
              Queued or processing jobs that have not been marked sent yet.
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-black pt-6">
          <p className="text-[18px] leading-none">Checkout recovery queue</p>

          {openCheckoutRecoveryIssues.length === 0 ? (
            <p className="mt-4 text-[18px] leading-[1.2] opacity-70">
              No open checkout recovery issues right now.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {openCheckoutRecoveryIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="border border-black/10 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
                    <div>
                      <p className="text-[18px] leading-none">
                        {issue.checkoutSessionId}
                      </p>
                      <p className="mt-2 text-[16px] leading-[1.2] opacity-70">
                        {issue.eventType}
                      </p>
                      {issue.cartId ? (
                        <p className="mt-2 text-[16px] leading-[1.2] opacity-70">
                          Cart: {issue.cartId}
                        </p>
                      ) : null}
                      <p className="mt-3 text-[16px] leading-[1.25]">
                        {issue.lastError}
                      </p>
                    </div>

                    <div className="text-left text-[16px] leading-[1.2] opacity-70 md:text-right">
                      <p>{formatDateTime(issue.updatedAt)}</p>
                      {issue.stripePaymentIntentId ? (
                        <p className="mt-2">
                          <Link
                            href={getStripePaymentDashboardUrl(
                              issue.stripePaymentIntentId
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="underline"
                          >
                            View payment
                          </Link>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 border-t border-black pt-6">
          <p className="text-[18px] leading-none">Recent failures</p>

          {recentEmailFailures.length === 0 ? (
            <p className="mt-4 text-[18px] leading-[1.2] opacity-70">
              No failed email jobs right now.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {recentEmailFailures.map((job) => (
                <Link
                  key={job.id}
                  href={`/admin/orders/${job.order.id}`}
                  className="block border border-black/10 p-4 transition hover:bg-black/5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
                    <div>
                      <p className="text-[18px] leading-none">
                        Order #{job.order.id}
                      </p>
                      <p className="mt-2 text-[16px] leading-[1.2] opacity-70">
                        {formatEmailJobType(job.type)}
                      </p>
                      {job.lastError ? (
                        <p className="mt-3 text-[16px] leading-[1.25]">
                          {job.lastError}
                        </p>
                      ) : null}
                    </div>

                    <div className="text-right text-[16px] leading-[1.2] opacity-70">
                      <p>{formatDateTime(job.updatedAt)}</p>
                      <p className="mt-2">Attempts: {job.attempts}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12">
          <RecoverOrderForm />
        </div>
      </div>
    </section>
  );
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatEmailJobType(type: string) {
  switch (type) {
    case "order_confirmation":
      return "Customer confirmation";
    case "internal_new_order":
      return "Internal notification";
    default:
      return type;
  }
}
