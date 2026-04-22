import Link from "next/link";
import RecoverOrderForm from "@/features/admin/components/RecoverOrderForm";
import RetryCheckoutRecoveryIssueForm from "@/features/admin/components/RetryCheckoutRecoveryIssueForm";
import RunCheckoutReconciliationForm from "@/features/admin/components/RunCheckoutReconciliationForm";
import { prisma } from "@/lib/prisma";
import { getStripePaymentDashboardUrl } from "@/lib/stripe-dashboard";

export default async function AdminCheckoutRecoveryPage() {
  const [
    openCheckoutRecoveryIssuesCount,
    openCheckoutRecoveryIssues,
    lastScan,
  ] = await Promise.all([
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
    }),
    prisma.checkoutRecoveryScan.findFirst({
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return (
    <section className="ui-admin-page">
      <div className="ui-page-wide">
        <p className="ui-admin-backlink">
          <Link href="/admin/ops" className="hover:underline">
            ← Back to ops
          </Link>
        </p>

        <div className="ui-admin-block border border-black p-5 md:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
            <div className="grid gap-6 md:grid-cols-2 md:gap-10">
              <div>
                <p className="text-[18px] leading-none">Open issues</p>
                <p className="mt-3 text-[28px] leading-none">
                  {openCheckoutRecoveryIssuesCount}
                </p>
              </div>

              <div>
                <p className="text-[18px] leading-none">Last scan</p>
                <p className="mt-3 text-[18px] leading-[1.2]">
                  {lastScan ? formatDateTime(lastScan.createdAt) : "Not run yet"}
                </p>
                <p className="mt-3 text-[16px] leading-[1.25] opacity-70">
                  {lastScan
                    ? lastScan.ok
                      ? `${formatScanSource(lastScan.source)} scan. Checked ${lastScan.checkedSessions} recent checkouts.`
                      : `${formatScanSource(lastScan.source)} scan failed: ${lastScan.error ?? "Unknown error"}.`
                    : "No scan has run yet."}
                </p>
              </div>
            </div>

            <div className="lg:shrink-0">
              <RunCheckoutReconciliationForm />
            </div>
          </div>
        </div>

        <div className="ui-admin-block grid gap-12 lg:grid-cols-[minmax(0,1.45fr)_360px] lg:gap-12">
          <div>
            <p className="text-[18px] leading-none">Missing orders</p>

            {openCheckoutRecoveryIssues.length === 0 ? (
              <p className="mt-4 text-[18px] leading-[1.2] opacity-70">
                No open checkout recovery issues right now.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {openCheckoutRecoveryIssues.map((issue) => (
                  <div key={issue.id} className="border border-black/10 p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
                      <div className="min-w-0">
                        <p className="break-all text-[18px] leading-[1.15]">
                          {issue.checkoutSessionId}
                        </p>
                        <p className="mt-2 text-[16px] leading-[1.2] opacity-70">
                          {formatIssueSource(issue.eventType)}
                        </p>
                        <p className="mt-3 break-words text-[16px] leading-[1.35]">
                          {issue.lastError}
                        </p>

                        <RetryCheckoutRecoveryIssueForm
                          checkoutSessionId={issue.checkoutSessionId}
                        />
                      </div>

                      <div className="shrink-0 text-left text-[16px] leading-[1.2] opacity-70 md:text-right">
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

          <div>
            <RecoverOrderForm />
          </div>
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

function formatScanSource(source: string) {
  switch (source) {
    case "cron":
      return "Automatic";
    case "admin_manual":
      return "Manual";
    default:
      return "Unknown";
  }
}

function formatIssueSource(source: string) {
  switch (source) {
    case "checkout.session.completed":
      return "Webhook failure";
    case "reconciliation_sweep":
      return "Found during scan";
    default:
      return source;
  }
}
