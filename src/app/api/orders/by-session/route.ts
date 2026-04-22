import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logging";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: "Missing session_id" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      ok: true,
      order: order ?? null,
    });
  } catch (error) {
    logError("order_lookup_by_session_failed", {
      error: error instanceof Error ? error.message : "Failed to fetch order",
    });

    return NextResponse.json(
      { ok: false, error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
