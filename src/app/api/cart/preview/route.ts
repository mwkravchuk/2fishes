import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  CART_COOKIE_NAME,
  formatBagSize,
  formatGrindOption,
  formatPrice,
  getCartBySession,
} from "@/lib/cart";
import { getProductImageUrl } from "@/lib/product-images";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(CART_COOKIE_NAME)?.value;

    if (!sessionId) {
      return NextResponse.json({
        ok: true,
        itemCount: 0,
        subtotal: "$0.00",
        items: [],
      });
    }

    const cart = await getCartBySession(sessionId);
    const items = cart?.items ?? [];

    return NextResponse.json({
      ok: true,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: formatPrice(cart?.totalCents ?? 0),
      items: items.map((item) => ({
        id: item.id,
        productName: item.productNameSnap,
        productSlug: item.product?.slug ?? null,
        imageUrl: item.product?.imageKey
          ? getProductImageUrl(item.product.imageKey)
          : null,
        quantity: item.quantity,
        lineTotal: formatPrice(item.unitPriceCents * item.quantity),
        sizeLabel: formatBagSize(item.selectedSize),
        grindLabel: formatGrindOption(item.selectedGrind),
      })),
    });
  } catch (error) {
    console.error("GET /api/cart/preview failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to load cart preview",
      },
      { status: 500 }
    );
  }
}
