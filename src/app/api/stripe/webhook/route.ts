import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
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

      const existingOrder = await prisma.order.findUnique({
        where: { stripeCheckoutSessionId: session.id },
      });

      if (existingOrder) {
        return NextResponse.json({ received: true });
      }

      const cart = await prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          items: true,
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error("Cart not found or empty");
      }

      const customerDetails = session.customer_details;
      const address = session.collected_information?.shipping_details?.address;

      if (!customerDetails?.email) {
        throw new Error("Missing customer email on checkout session");
      }

      if (!address) {
        throw new Error("Missing shipping address on checkout session");
      }

      if (typeof session.amount_total !== "number") {
        throw new Error("Missing session amount_total");
      }

      const totalCents = session.amount_total;

      const subtotalCents =
        typeof session.amount_subtotal === "number"
          ? session.amount_subtotal
          : cart.totalCents;

      const shippingCents = totalCents - subtotalCents;

      if (shippingCents < 0) {
        throw new Error("Computed shipping amount was negative");
      }

      await prisma.$transaction(async (tx) => {
        await tx.order.create({
          data: {
            customerEmail: customerDetails.email ?? "",
            shippingName: customerDetails.name ?? "",
            shippingLine1: address.line1 ?? "",
            shippingLine2: address.line2 ?? "",
            shippingCity: address.city ?? "",
            shippingState: address.state ?? "",
            shippingZip: address.postal_code ?? "",
            shippingCountry: address.country ?? "",

            paymentStatus: "paid",
            fulfillmentStatus: "pending",

            subtotalCents,
            shippingCents,
            totalCents,
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,

            items: {
              create: cart.items.map((item) => ({
                productId: item.productId,
                productNameSnap: item.productNameSnap,
                unitPriceCents: item.unitPriceCents,
                quantity: item.quantity,
                selectedGrind: item.selectedGrind,
                selectedSize: item.selectedSize,
              })),
            },
          },
        });

        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });

        await tx.cart.delete({
          where: { id: cart.id },
        });
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handling failed", error);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}