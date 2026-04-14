import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CART_COOKIE_NAME, getCartBySession } from "@/lib/cart";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(CART_COOKIE_NAME)?.value;

    if (!sessionId) {
      return NextResponse.json({
        ok: true,
        itemCount: 0,
      });
    }

    const cart = await getCartBySession(sessionId);

    const itemCount =
      cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

    return NextResponse.json({
      ok: true,
      itemCount,
    });
  } catch (error) {
    console.error("GET /api/cart/summary failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to load cart summary",
      },
      { status: 500 }
    );
  }
}