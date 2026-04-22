import { prisma } from "@/lib/prisma";

type RoastSummaryRow = {
  productName: string;
  bags: number;
  totalOz: number;
  totalLb: number;
};

function getCurrentBatchWindow(now = new Date()) {
  const current = new Date(now);
  const start = new Date(current);
  const day = current.getDay();
  const daysSinceSaturday = (day + 1) % 7;
  start.setDate(current.getDate() - daysSinceSaturday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
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
      return 12;
  }
}

export function formatBatchRange(start: Date, end: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  });

  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

export async function getAdminDashboardData() {
  const { start, end } = getCurrentBatchWindow();

  const [
    productCount,
    pendingOrdersCount,
    failedEmailJobsCount,
    openCheckoutRecoveryIssuesCount,
    batchOrders,
  ] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count({
        where: {
          fulfillmentStatus: "pending",
        },
      }),
      prisma.emailJob.count({
        where: {
          status: "failed",
        },
      }),
      prisma.checkoutRecoveryIssue.count({
        where: {
          status: "open",
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
      const current = roastMap.get(item.productNameSnap) ?? {
        bags: 0,
        totalOz: 0,
      };

      roastMap.set(item.productNameSnap, {
        bags: current.bags + (item.quantity ?? 0),
        totalOz:
          current.totalOz +
          (item.quantity ?? 0) * getBagSizeOz(item.selectedSize),
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

  return {
    start,
    end,
    productCount,
    pendingOrdersCount,
    failedEmailJobsCount,
    opsAlertsCount: failedEmailJobsCount + openCheckoutRecoveryIssuesCount,
    batchOrdersCount: batchOrders.length,
    roastSummary,
    totalBatchBags,
    totalBatchLb: Number((totalBatchOz / 16).toFixed(2)),
  };
}
