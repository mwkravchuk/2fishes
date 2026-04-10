import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  CART_COOKIE_NAME,
  removeCartItem,
  updateCartItemQuantity,
} from "@/lib/cart";

type RouteContext = {
  params: Promise<{
    itemId: string;
  }>;
};

type PatchCartItemRequestBody = {
  quantity: number;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { itemId } = await context.params;
    const body = (await request.json()) as PatchCartItemRequestBody;

    const cookieStore = await cookies();
    const sessionId = cookieStore.get(CART_COOKIE_NAME)?.value;

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: "Cart session not found" },
        { status: 400 }
      );
    }

    const cart = await updateCartItemQuantity({
      sessionId,
      cartItemId: itemId,
      quantity: body.quantity,
    });

    return NextResponse.json({
      ok: true,
      totalCents: cart.totalCents,
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error) {
    console.error("Failed to update cart item", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to update cart item",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { itemId } = await context.params;

    const cookieStore = await cookies();
    const sessionId = cookieStore.get(CART_COOKIE_NAME)?.value;

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: "Cart session not found" },
        { status: 400 }
      );
    }

    const cart = await removeCartItem({
      sessionId,
      cartItemId: itemId,
    });

    return NextResponse.json({
      ok: true,
      totalCents: cart.totalCents,
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error) {
    console.error("Failed to remove cart item", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to remove cart item",
      },
      { status: 400 }
    );
  }
}