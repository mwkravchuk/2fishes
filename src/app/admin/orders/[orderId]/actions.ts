"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { processEmailJob, sendShipmentEmailNow } from "@/lib/email-jobs";

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

  try {
    await sendShipmentEmailNow(order.id);
  } catch (error) {
    console.error("Failed to send shipment email", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to send shipment email",
    };
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

export async function retryOrderEmailJob(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const orderId = formData.get("orderId");
  const emailJobId = formData.get("emailJobId");

  if (typeof orderId !== "string" || !orderId) {
    return { error: "Missing order ID" };
  }

  if (typeof emailJobId !== "string" || !emailJobId) {
    return { error: "Missing email job ID" };
  }

  try {
    await processEmailJob(emailJobId);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to retry email job",
    };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");

  return { success: true };
}
