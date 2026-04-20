"use server";

import { revalidatePath } from "next/cache";
import { logError, logInfo } from "@/lib/logging";
import { createOrderFromCheckoutSession } from "@/features/checkout/server/orders-from-stripe";

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
    const result = await createOrderFromCheckoutSession(
      checkoutSessionId.trim(),
      "admin_recovery"
    );

    revalidatePath("/admin");
    revalidatePath("/admin/ops");
    revalidatePath("/admin/orders");

    if (result.kind === "existing") {
      logInfo("admin_order_recovery_existing_order", {
        checkoutSessionId: checkoutSessionId.trim(),
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
      checkoutSessionId: checkoutSessionId.trim(),
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
