import { BagSize, GrindOption } from "@prisma/client";
import { buildCartSnapshotKey } from "@/lib/cart";
import {
  enqueueOrderEmailJobsTx,
  processOrderEmailJobs,
} from "@/features/checkout/server/email-jobs";
import { logError, logInfo } from "@/lib/logging";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

type Source = "webhook" | "admin_recovery";

type StripeOrderItem = {
  productId: string;
  productNameSnap: string;
  unitPriceCents: number;
  quantity: number;
  selectedSize: BagSize;
  selectedGrind: GrindOption;
};

export async function createOrderFromCheckoutSession(
  checkoutReference: string,
  source: Source
) {
  const checkoutSessionId = await resolveCheckoutSessionId(checkoutReference);

  const existingOrder = await prisma.order.findUnique({
    where: { stripeCheckoutSessionId: checkoutSessionId },
  });

  if (existingOrder) {
    return { kind: "existing" as const, orderId: existingOrder.id };
  }

  const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);

  if (session.status !== "complete" && session.payment_status !== "paid") {
    throw new Error("Checkout session is not completed and paid");
  }

  const cartId = session.client_reference_id ?? session.metadata?.cartId;
  if (typeof cartId !== "string" || !cartId) {
    throw new Error("Missing cart reference on checkout session");
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

  const normalizedItems = normalizeStripeLineItems(lineItems.data);
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

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
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
      },
    });

    await enqueueOrderEmailJobsTx(tx, {
      orderId: createdOrder.id,
      customerEmail: createdOrder.customerEmail,
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

        logInfo("checkout_cart_cleared_after_payment", {
          source,
          checkoutSessionId: session.id,
          cartId,
          orderId: createdOrder.id,
        });
      } else {
        logInfo("checkout_cart_preserved_after_payment", {
          source,
          checkoutSessionId: session.id,
          cartId,
          orderId: createdOrder.id,
        });
      }
    }

    return createdOrder;
  });

  logInfo("order_created_from_checkout", {
    source,
    checkoutSessionId: session.id,
    cartId,
    orderId: order.id,
    totalCents: order.totalCents,
  });

  try {
    await processOrderEmailJobs(order.id);
  } catch (error) {
    logError("order_email_job_processing_failed", {
      source,
      checkoutSessionId: session.id,
      orderId: order.id,
      error:
        error instanceof Error ? error.message : "Failed to process email jobs",
    });
  }

  return { kind: "created" as const, orderId: order.id };
}

async function resolveCheckoutSessionId(reference: string) {
  if (reference.startsWith("cs_")) {
    return reference;
  }

  if (reference.startsWith("pi_")) {
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: reference,
      limit: 1,
    });

    const session = sessions.data[0];

    if (!session) {
      throw new Error("No Checkout Session found for that Payment Intent ID");
    }

    return session.id;
  }

  throw new Error("Use a Stripe Checkout Session ID or Payment Intent ID");
}

function normalizeStripeLineItems(
  items: Awaited<
    ReturnType<typeof stripe.checkout.sessions.listLineItems>
  >["data"]
): StripeOrderItem[] {
  return items.map((item) => {
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
}

function isBagSize(value: string | undefined): value is BagSize {
  return value === "oz12";
}

function isGrindOption(value: string | undefined): value is GrindOption {
  return value === "whole_bean";
}
