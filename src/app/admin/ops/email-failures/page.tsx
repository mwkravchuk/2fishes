import Link from "next/link";
import RetryFailedEmailJobForm from "@/features/admin/components/RetryFailedEmailJobForm";
import { prisma } from "@/lib/prisma";

export default async function AdminEmailFailuresPage() {
  const [failedEmailJobsCount, failedEmailJobs] = await Promise.all([
    prisma.emailJob.count({
      where: {
        status: "failed",
      },
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

        <div className="ui-admin-block border border-black p-5 md:max-w-[320px] md:p-6">
          <p className="text-[18px] leading-none">Failed email jobs</p>
          <p className="mt-3 text-[28px] leading-none">{failedEmailJobsCount}</p>
          <p className="mt-3 text-[16px] leading-[1.25] opacity-70">
            Failed sends that likely need a retry or manual follow-up.
          </p>
        </div>

        <div className="ui-admin-block border-t border-black pt-6">
          <p className="text-[18px] leading-none">Current failures</p>

          {failedEmailJobs.length === 0 ? (
            <p className="mt-4 text-[18px] leading-[1.2] opacity-70">
              No failed email jobs right now.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {failedEmailJobs.map((job) => (
                <div key={job.id} className="border border-black/10 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
                    <div>
                      <p className="text-[18px] leading-none">
                        Order #{job.order.id}
                      </p>
                      <p className="mt-2 text-[16px] leading-[1.2] opacity-70">
                        {formatEmailJobType(job.type)}
                      </p>
                      <p className="mt-2 text-[16px] leading-[1.2] opacity-70">
                        Attempts: {job.attempts}
                      </p>
                      {job.lastError ? (
                        <p className="mt-3 text-[16px] leading-[1.25]">
                          {job.lastError}
                        </p>
                      ) : null}

                      <RetryFailedEmailJobForm
                        emailJobId={job.id}
                        orderId={job.order.id}
                      />
                    </div>

                    <div className="text-left text-[16px] leading-[1.2] opacity-70 md:text-right">
                      <p>{formatDateTime(job.updatedAt)}</p>
                      <p className="mt-2">
                        <Link
                          href={`/admin/orders/${job.order.id}`}
                          className="underline"
                        >
                          View order
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
