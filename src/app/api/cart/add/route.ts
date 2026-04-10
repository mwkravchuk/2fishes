import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BagSize, GrindOption } from "@prisma/client";
import {
  addItemToCart,
  CART_COOKIE_NAME,
  createCartSessionId,
} from "@/lib/cart";

type AddToCartRequestBody = {
  productId: string;
  selectedSize: BagSize;
  selectedGrind: GrindOption;
  quantity: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AddToCartRequestBody;

    const cookieStore = await cookies();
    let sessionId = cookieStore.get(CART_COOKIE_NAME)?.value;
    let shouldSetCookie = false;

    if (!sessionId) {
      sessionId = createCartSessionId();
      shouldSetCookie = true;
    }

    const cart = await addItemToCart({
      sessionId,
      productId: body.productId,
      selectedSize: body.selectedSize,
      selectedGrind: body.selectedGrind,
      quantity: body.quantity,
    });

    const response = NextResponse.json({
      ok: true,
      cartId: cart.id,
      totalCents: cart.totalCents,
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    });

    if (shouldSetCookie) {
      response.cookies.set(CART_COOKIE_NAME, sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return response;
  } catch (error) {
    console.error("Failed to add item to cart", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}