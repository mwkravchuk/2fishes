import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { stripe } from "@/lib/stripe";
import { CART_COOKIE_NAME, getCartBySession } from "@/lib/cart";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(CART_COOKIE_NAME)?.value;

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: "Cart session not found" },
        { status: 400 }
      );
    }

    const cart = await getCartBySession(sessionId);

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Cart is empty" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      throw new Error("Missing NEXT_PUBLIC_APP_URL");
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      client_reference_id: cart.id,
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 500, currency: "usd" }, // $5
            display_name: "Flat rate shipping",},
        },
      ],
      metadata: {
        cartId: cart.id,
      },
      line_items: cart.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: item.unitPriceCents,
          product_data: {
            name: item.productNameSnap,
            images: item.product.imageUrl ? [item.product.imageUrl] : [],
            metadata: {
              productId: item.productId,
              selectedSize: item.selectedSize,
              selectedGrind: item.selectedGrind,
            },
          },
        },
      })),
    });

    return NextResponse.json({
      ok: true,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Failed to create checkout session", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create checkout session",
      },
      { status: 500 }
    );
  }
}