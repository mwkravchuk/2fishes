import { NextRequest, NextResponse } from "next/server";
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
    console.error("Failed to fetch order by session", error);

    return NextResponse.json(
      { ok: false, error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}