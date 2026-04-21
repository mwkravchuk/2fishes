import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { logError, logInfo } from "@/lib/logging";
import { createOrderFromCheckoutSession } from "@/features/checkout/server/orders-from-stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.text();
  const headerStore = await headers();
  const signature = headerStore.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing stripe-signature header", { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Webhook signature verification failed", error);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const cartId = session.client_reference_id ?? session.metadata?.cartId;
      if (typeof cartId !== "string" || !cartId) {
        throw new Error("Missing cart reference on checkout session");
      }

      logInfo("checkout_webhook_received", {
        checkoutSessionId: session.id,
        cartId,
        paymentStatus: session.payment_status,
      });

      const existingOrder = await prisma.order.findUnique({
        where: { stripeCheckoutSessionId: session.id },
      });

      if (existingOrder) {
        await resolveCheckoutRecoveryIssue({
          checkoutSessionId: session.id,
          orderId: existingOrder.id,
          resolutionSource: "webhook_duplicate",
        });

        logInfo("checkout_webhook_duplicate_ignored", {
          checkoutSessionId: session.id,
          orderId: existingOrder.id,
        });

        return NextResponse.json({ received: true });
      }
      const result = await createOrderFromCheckoutSession(session.id, "webhook");

      await resolveCheckoutRecoveryIssue({
        checkoutSessionId: session.id,
        orderId: result.orderId,
        resolutionSource: "webhook",
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const cartId = session.client_reference_id ?? session.metadata?.cartId;

      await prisma.checkoutRecoveryIssue.upsert({
        where: { checkoutSessionId: session.id },
        update: {
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
          cartId: typeof cartId === "string" ? cartId : null,
          eventType: event.type,
          lastError:
            error instanceof Error ? error.message : "Webhook handler failed",
          status: "open",
          recoveredOrderId: null,
          resolutionSource: null,
          resolvedAt: null,
        },
        create: {
          checkoutSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
          cartId: typeof cartId === "string" ? cartId : null,
          eventType: event.type,
          lastError:
            error instanceof Error ? error.message : "Webhook handler failed",
        },
      });
    }

    logError("checkout_webhook_failed", {
      eventType: event.type,
      error: error instanceof Error ? error.message : "Webhook handler failed",
    });
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}

async function resolveCheckoutRecoveryIssue(input: {
  checkoutSessionId: string;
  orderId: string;
  resolutionSource: string;
}) {
  await prisma.checkoutRecoveryIssue.updateMany({
    where: {
      checkoutSessionId: input.checkoutSessionId,
      status: "open",
    },
    data: {
      status: "resolved",
      recoveredOrderId: input.orderId,
      resolutionSource: input.resolutionSource,
      resolvedAt: new Date(),
    },
  });
}
