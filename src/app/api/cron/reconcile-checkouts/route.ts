import { NextRequest, NextResponse } from "next/server";
import { reconcileRecentPaidCheckoutSessions } from "@/features/checkout/server/checkout-recovery-issues";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing CRON_SECRET",
      },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }

  const result = await reconcileRecentPaidCheckoutSessions();

  return NextResponse.json(result, {
    status: result.ok ? 200 : 500,
  });
}
