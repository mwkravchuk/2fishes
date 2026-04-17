import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { BagSize, GrindOption } from "@prisma/client";
import { buildCartSnapshotKey } from "@/lib/cart";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import {
  resend,
  EMAIL_FROM,
  EMAIL_REPLY_TO,
  INTERNAL_ORDER_EMAIL,
} from "@/lib/email";
import {
  buildCustomerOrderConfirmationEmail,
  buildInternalNewOrderEmail,
} from "@/lib/email-templates";

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

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 100,
        expand: ["data.price.product"],
      });

      if (lineItems.data.length === 0) {
        throw new Error("Checkout session had no line items");
      }

      const normalizedItems = lineItems.data.map((item) => {
        const quantity = item.quantity;
        const unitPriceCents = item.price?.unit_amount;
        const stripeProduct = item.price?.product;

        if (!quantity || quantity < 1) {
          throw new Error(`Invalid quantity for line item ${item.id}`);
        }

        if (typeof unitPriceCents !== "number") {
          throw new Error(`Missing unit amount for line item ${item.id}`);
        }

        if (!stripeProduct || typeof stripeProduct === "string") {
          throw new Error(`Missing expanded product for line item ${item.id}`);
        }

        const productId = stripeProduct.metadata.productId;
        const selectedSize = stripeProduct.metadata.selectedSize;
        const selectedGrind = stripeProduct.metadata.selectedGrind;

        if (!productId) {
          throw new Error(`Missing productId metadata for line item ${item.id}`);
        }

        if (!isBagSize(selectedSize)) {
          throw new Error(`Invalid selectedSize metadata for line item ${item.id}`);
        }

        if (!isGrindOption(selectedGrind)) {
          throw new Error(`Invalid selectedGrind metadata for line item ${item.id}`);
        }

        return {
          productId,
          productNameSnap: item.description ?? stripeProduct.name,
          unitPriceCents,
          quantity,
          selectedSize,
          selectedGrind,
        };
      });

      const totalCents = session.amount_total;

      const subtotalCents =
        typeof session.amount_subtotal === "number"
          ? session.amount_subtotal
          : normalizedItems.reduce(
              (sum, item) => sum + item.unitPriceCents * item.quantity,
              0
            );

      const shippingCents = totalCents - subtotalCents;

      if (shippingCents < 0) {
        throw new Error("Computed shipping amount was negative");
      }

      const paidSnapshotKey =
        session.metadata?.snapshotKey ??
        buildCartSnapshotKey({
          items: normalizedItems,
          totalCents: subtotalCents,
        });

      const createdOrder = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            customerEmail: customerDetails.email ?? "",
            shippingName: customerDetails.name ?? "",
            shippingLine1: address.line1 ?? "",
            shippingLine2: address.line2 ?? "",
            shippingCity: address.city ?? "",
            shippingState: address.state ?? "",
            shippingZip: address.postal_code ?? "",
            shippingCountry: address.country ?? "",

            sourceCartId: cartId,
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
              create: normalizedItems.map((item) => ({
                productId: item.productId,
                productNameSnap: item.productNameSnap,
                unitPriceCents: item.unitPriceCents,
                quantity: item.quantity,
                selectedGrind: item.selectedGrind,
                selectedSize: item.selectedSize,
              })),
            },
          },
          include: {
            items: true,
          }
        });

        const currentCart = await tx.cart.findUnique({
          where: { id: cartId },
          include: {
            items: true,
          },
        });

        if (currentCart) {
          const currentCartSnapshotKey = buildCartSnapshotKey({
            items: currentCart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
              selectedSize: item.selectedSize,
              selectedGrind: item.selectedGrind,
            })),
            totalCents: currentCart.totalCents,
          });

          if (currentCartSnapshotKey === paidSnapshotKey) {
            await tx.cartItem.deleteMany({
              where: { cartId },
            });

            await tx.cart.delete({
              where: { id: cartId },
            });
          }
        }

        return order;
      });

      const emailData = {
        orderId: createdOrder.id,
        customerEmail: createdOrder.customerEmail,
        shippingName: createdOrder.shippingName,
        shippingLine1: createdOrder.shippingLine1,
        shippingLine2: createdOrder.shippingLine2,
        shippingCity: createdOrder.shippingCity,
        shippingState: createdOrder.shippingState,
        shippingZip: createdOrder.shippingZip,
        shippingCountry: createdOrder.shippingCountry,
        subtotalCents: createdOrder.subtotalCents,
        shippingCents: createdOrder.shippingCents,
        totalCents: createdOrder.totalCents,
        items: createdOrder.items,
      };

      const customerEmailPayload =
        buildCustomerOrderConfirmationEmail(emailData);
      const internalEmailPayload = buildInternalNewOrderEmail(emailData);

      const customerEmailResult = await resend.emails.send({
        from: EMAIL_FROM,
        to: [createdOrder.customerEmail],
        replyTo: EMAIL_REPLY_TO,
        subject: customerEmailPayload.subject,
        html: customerEmailPayload.html,
        text: customerEmailPayload.text,
      });

      if (customerEmailResult.error) {
        console.error(
          "Failed to send customer confirmation email",
          customerEmailResult.error
        );
      }

      const internalEmailResult = await resend.emails.send({
        from: EMAIL_FROM,
        to: [INTERNAL_ORDER_EMAIL],
        replyTo: EMAIL_REPLY_TO,
        subject: internalEmailPayload.subject,
        html: internalEmailPayload.html,
        text: internalEmailPayload.text,
      });

      if (internalEmailResult.error) {
        console.error(
          "Failed to send internal new-order email",
          internalEmailResult.error
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handling failed", error);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}

function isBagSize(value: string | undefined): value is BagSize {
  return value === "oz12";
}

function isGrindOption(value: string | undefined): value is GrindOption {
  return value === "whole_bean";
}
