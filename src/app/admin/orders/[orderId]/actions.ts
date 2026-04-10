"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  resend,
  EMAIL_FROM,
  EMAIL_REPLY_TO,
} from "@/lib/email";
import {
  buildOrderFulfilledEmail,
} from "@/lib/email-templates";

type UpdateFulfillmentState = {
  error?: string;
  success?: boolean;
};

export async function updateOrderFulfillment(
  _prevState: UpdateFulfillmentState,
  formData: FormData
): Promise<UpdateFulfillmentState> {
  const orderId = formData.get("orderId");
  const fulfillmentStatus = formData.get("fulfillmentStatus");
  const trackingCarrier = formData.get("trackingCarrier");
  const trackingNumber = formData.get("trackingNumber");

  if (typeof orderId !== "string" || !orderId) {
    return { error: "Missing order ID" };
  }

  if (typeof fulfillmentStatus !== "string" || !fulfillmentStatus) {
    return { error: "Missing fulfillment status" };
  }

  const normalizedTrackingCarrier =
    typeof trackingCarrier === "string" && trackingCarrier.trim()
      ? trackingCarrier.trim()
      : null;

  const normalizedTrackingNumber =
    typeof trackingNumber === "string" && trackingNumber.trim()
      ? trackingNumber.trim()
      : null;

  if (fulfillmentStatus === "fulfilled" && !normalizedTrackingNumber) {
    return { error: "Tracking number is required before marking fulfilled" };
  }

  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!existingOrder) {
    return { error: "Order not found" };
  }

  const wasFulfilled = existingOrder.fulfillmentStatus === "fulfilled";

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      fulfillmentStatus,
      trackingCarrier: normalizedTrackingCarrier,
      trackingNumber: normalizedTrackingNumber,
    },
    include: {
      items: true,
    },
  });

  const becameFulfilled =
    !wasFulfilled && updatedOrder.fulfillmentStatus === "fulfilled";

  if (becameFulfilled) {
    const emailPayload = buildOrderFulfilledEmail({
      orderId: updatedOrder.id,
      customerEmail: updatedOrder.customerEmail,
      shippingName: updatedOrder.shippingName,
      shippingLine1: updatedOrder.shippingLine1,
      shippingLine2: updatedOrder.shippingLine2,
      shippingCity: updatedOrder.shippingCity,
      shippingState: updatedOrder.shippingState,
      shippingZip: updatedOrder.shippingZip,
      shippingCountry: updatedOrder.shippingCountry,
      subtotalCents: updatedOrder.subtotalCents,
      shippingCents: updatedOrder.shippingCents,
      totalCents: updatedOrder.totalCents,
      trackingCarrier: updatedOrder.trackingCarrier,
      trackingNumber: updatedOrder.trackingNumber,
      items: updatedOrder.items,
    });

    const emailResult = await resend.emails.send({
      from: EMAIL_FROM,
      to: [updatedOrder.customerEmail],
      replyTo: EMAIL_REPLY_TO,
      subject: emailPayload.subject,
      html: emailPayload.html,
      text: emailPayload.text,
    });

    if (emailResult.error) {
      console.error("Failed to send fulfilled email", emailResult.error);
    }
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");

  return { success: true };
}