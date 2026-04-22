import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminOpsPage() {
  const [openCheckoutRecoveryIssuesCount, failedEmailJobsCount] =
    await Promise.all([
      prisma.checkoutRecoveryIssue.count({
        where: {
          status: "open",
        },
      }),
      prisma.emailJob.count({
        where: {
          status: "failed",
        },
      }),
    ]);

  return (
    <section className="ui-admin-page">
      <div className="ui-page-wide">
        <p className="ui-admin-backlink">
          <Link href="/admin" className="hover:underline">
            ← Back to admin
          </Link>
        </p>

        <div className="ui-admin-block grid gap-4 md:grid-cols-2 md:gap-6">
          <Link
            href="/admin/ops/checkout-recovery"
            className="block border border-black p-5 transition hover:bg-black/5 md:p-6"
          >
            <p className="text-[18px] leading-none">Checkout recovery</p>
            <p className="mt-3 text-[28px] leading-none">
              {openCheckoutRecoveryIssuesCount}
            </p>
            <p className="mt-3 text-[16px] leading-[1.25] opacity-70">
              Review Stripe sessions that do not yet have internal order records.
            </p>
          </Link>

          <Link
            href="/admin/ops/email-failures"
            className="block border border-black p-5 transition hover:bg-black/5 md:p-6"
          >
            <p className="text-[18px] leading-none">Email failures</p>
            <p className="mt-3 text-[28px] leading-none">
              {failedEmailJobsCount}
            </p>
            <p className="mt-3 text-[16px] leading-[1.25] opacity-70">
              Review failed email jobs and retry them when needed.
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}
