import Link from "next/link";
import RecoverOrderForm from "@/features/admin/components/RecoverOrderForm";
import { prisma } from "@/lib/prisma";

export default async function AdminOpsPage() {
  const [failedEmailJobsCount, pendingEmailJobsCount, recentEmailFailures] =
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

        <div className="mt-10">
          <p className="text-[18px] leading-none opacity-70">Ops</p>
          <h1 className="mt-3 text-[32px] leading-none">Email health</h1>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 md:gap-6">
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
