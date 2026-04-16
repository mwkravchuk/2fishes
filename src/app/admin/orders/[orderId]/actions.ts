"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  resend,
  EMAIL_FROM,
  EMAIL_REPLY_TO,
} from "@/lib/email";
import { buildOrderShippedEmail } from "@/lib/email-templates";

type ActionState = {
  error?: string;
  success?: boolean;
};

const ALLOWED_FULFILLMENT_STATUSES = ["pending", "shipped", "canceled"];
const ALLOWED_PAYMENT_STATUSES = ["paid", "refunded"];

export async function updateOrderFulfillment(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const orderId = formData.get("orderId");
  const fulfillmentStatus = formData.get("fulfillmentStatus");
  const paymentStatus = formData.get("paymentStatus");
  const trackingCarrier = formData.get("trackingCarrier");
  const trackingNumber = formData.get("trackingNumber");

  if (typeof orderId !== "string" || !orderId) {
    return { error: "Missing order ID" };
  }

  if (
    typeof fulfillmentStatus !== "string" ||
    !ALLOWED_FULFILLMENT_STATUSES.includes(fulfillmentStatus)
  ) {
    return { error: "Invalid fulfillment status" };
  }

  if (
    typeof paymentStatus !== "string" ||
    !ALLOWED_PAYMENT_STATUSES.includes(paymentStatus)
  ) {
    return { error: "Invalid payment status" };
  }

  const normalizedTrackingCarrier =
    typeof trackingCarrier === "string" && trackingCarrier.trim()
      ? trackingCarrier.trim()
      : null;

  const normalizedTrackingNumber =
    typeof trackingNumber === "string" && trackingNumber.trim()
      ? trackingNumber.trim()
      : null;

  if (fulfillmentStatus === "shipped" && !normalizedTrackingNumber) {
    return { error: "Tracking number is required before marking shipped" };
  }

  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!existingOrder) {
    return { error: "Order not found" };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      fulfillmentStatus,
      paymentStatus,
      trackingCarrier: normalizedTrackingCarrier,
      trackingNumber: normalizedTrackingNumber,
    },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");

  return { success: true };
}

export async function sendShipmentEmail(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const orderId = formData.get("orderId");

  if (typeof orderId !== "string" || !orderId) {
    return { error: "Missing order ID" };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    return { error: "Order not found" };
  }

  if (order.fulfillmentStatus !== "shipped") {
    return { error: "Order must be marked shipped before sending email" };
  }

  if (!order.trackingNumber) {
    return { error: "Tracking number is required before sending email" };
  }

  const emailPayload = buildOrderShippedEmail({
    orderId: order.id,
    customerEmail: order.customerEmail,
    shippingName: order.shippingName,
    shippingLine1: order.shippingLine1,
    shippingLine2: order.shippingLine2,
    shippingCity: order.shippingCity,
    shippingState: order.shippingState,
    shippingZip: order.shippingZip,
    shippingCountry: order.shippingCountry,
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    trackingCarrier: order.trackingCarrier,
    trackingNumber: order.trackingNumber,
    items: order.items,
  });

  const emailResult = await resend.emails.send({
    from: EMAIL_FROM,
    to: [order.customerEmail],
    replyTo: EMAIL_REPLY_TO,
    subject: emailPayload.subject,
    html: emailPayload.html,
    text: emailPayload.text,
  });

  if (emailResult.error) {
    console.error("Failed to send shipment email", emailResult.error);
    return { error: "Failed to send shipment email" };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      shippingEmailSentAt: new Date(),
    },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");

  return { success: true };
}