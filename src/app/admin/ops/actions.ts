"use server";

import { revalidatePath } from "next/cache";
import { logError, logInfo } from "@/lib/logging";
import {
  createOrderFromCheckoutSession,
  resolveCheckoutSessionId,
} from "@/features/checkout/server/orders-from-stripe";
import { prisma } from "@/lib/prisma";

type ActionState = {
  error?: string;
  success?: boolean;
  orderId?: string;
  existing?: boolean;
};

export async function recoverOrderFromStripeSession(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const checkoutSessionId = formData.get("checkoutSessionId");

  if (typeof checkoutSessionId !== "string" || !checkoutSessionId.trim()) {
    return { error: "Missing Stripe Checkout Session ID or Payment Intent ID" };
  }

  try {
    const normalizedCheckoutSessionId = await resolveCheckoutSessionId(
      checkoutSessionId.trim()
    );
    const result = await createOrderFromCheckoutSession(
      normalizedCheckoutSessionId,
      "admin_recovery"
    );

    await prisma.checkoutRecoveryIssue.updateMany({
      where: {
        checkoutSessionId: normalizedCheckoutSessionId,
        status: "open",
      },
      data: {
        status: "resolved",
        recoveredOrderId: result.orderId,
        resolutionSource: "admin_recovery",
        resolvedAt: new Date(),
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/ops");
    revalidatePath("/admin/orders");

    if (result.kind === "existing") {
      logInfo("admin_order_recovery_existing_order", {
        checkoutSessionId: normalizedCheckoutSessionId,
        orderId: result.orderId,
      });

      return {
        success: true,
        existing: true,
        orderId: result.orderId,
      };
    }

    revalidatePath(`/admin/orders/${result.orderId}`);

    logInfo("admin_order_recovery_created_order", {
      checkoutSessionId: normalizedCheckoutSessionId,
      orderId: result.orderId,
    });

    return {
      success: true,
      orderId: result.orderId,
    };
  } catch (error) {
    logError("admin_order_recovery_failed", {
      checkoutSessionId:
        typeof checkoutSessionId === "string" ? checkoutSessionId.trim() : null,
      error: error instanceof Error ? error.message : "Order recovery failed",
    });

    return {
      error:
        error instanceof Error ? error.message : "Order recovery failed",
    };
  }
}
