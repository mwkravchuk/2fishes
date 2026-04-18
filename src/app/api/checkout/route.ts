import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { stripe } from "@/lib/stripe";
import {
  buildCartSnapshotKey,
  CART_COOKIE_NAME,
  getCartBySession,
} from "@/lib/cart";
import { logError, logInfo } from "@/lib/logging";
import { getProductImageUrl } from "@/lib/product-images";
import { prisma } from "@/lib/prisma";


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

    const snapshotKey = buildCartSnapshotKey({
      items: cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        selectedSize: item.selectedSize,
        selectedGrind: item.selectedGrind,
      })),
      totalCents: cart.totalCents,
    });

    if (cart.stripeCheckoutSessionId) {
      const existingSession = await stripe.checkout.sessions.retrieve(
        cart.stripeCheckoutSessionId
      );

      const matchesCurrentSnapshot =
        existingSession.metadata?.snapshotKey === snapshotKey;

      if (
        matchesCurrentSnapshot &&
        existingSession.status === "open" &&
        existingSession.url
      ) {
        logInfo("checkout_session_reused", {
          cartId: cart.id,
          checkoutSessionId: existingSession.id,
        });

        return NextResponse.json({
          ok: true,
          url: existingSession.url,
        });
      }

      if (
        matchesCurrentSnapshot &&
        (
          existingSession.status === "complete" ||
          existingSession.payment_status === "paid"
        )
      ) {
        const existingOrder = await prisma.order.findUnique({
          where: { stripeCheckoutSessionId: existingSession.id },
          select: {
            stripeCheckoutSessionId: true,
          },
        });

        const completedSessionId =
          existingOrder?.stripeCheckoutSessionId ?? existingSession.id;

        logInfo("checkout_session_already_completed", {
          cartId: cart.id,
          checkoutSessionId: existingSession.id,
          orderFound: Boolean(existingOrder),
        });

        return NextResponse.json({
          ok: true,
          url: `${baseUrl}/checkout/success?session_id=${encodeURIComponent(completedSessionId)}`,
        });
      }
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
        cartSessionId: cart.sessionId,
        snapshotKey,
      },
      line_items: cart.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: item.unitPriceCents,
          product_data: {
            name: item.productNameSnap,
            images: item.product.imageKey ? [getProductImageUrl(item.product.imageKey)] : [],
            metadata: {
              productId: item.productId,
              selectedSize: item.selectedSize,
              selectedGrind: item.selectedGrind,
            },
          },
        },
      })),
    }, {
      idempotencyKey: `checkout_cart_${cart.id}_${cart.updatedAt.getTime()}`,
    });

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        stripeCheckoutSessionId: checkoutSession.id,
        stripeCheckoutSessionUrl: checkoutSession.url,
        stripeCheckoutSessionExpire:
          typeof checkoutSession.expires_at === "number"
            ? new Date(checkoutSession.expires_at * 1000)
            : null,
      },
    });

    logInfo("checkout_session_created", {
      cartId: cart.id,
      checkoutSessionId: checkoutSession.id,
      itemCount: cart.items.length,
      totalCents: cart.totalCents,
    });

    return NextResponse.json({
      ok: true,
      url: checkoutSession.url,
    });
  } catch (error) {
    logError("checkout_session_create_failed", {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create checkout session",
    });

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
