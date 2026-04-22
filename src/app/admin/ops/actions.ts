"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { logError, logInfo } from "@/lib/logging";
import {
  createOrderFromCheckoutSession,
  resolveCheckoutSessionId,
} from "@/features/checkout/server/orders-from-stripe";
import {
  reconcileRecentPaidCheckoutSessions,
  resolveCheckoutRecoveryIssue,
} from "@/features/checkout/server/checkout-recovery-issues";

type ActionState = {
  error?: string;
  success?: boolean;
  orderId?: string;
  existing?: boolean;
  message?: string;
};

export async function recoverOrderFromStripeSession(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return { error: "Unauthorized" };
  }

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

    await resolveCheckoutRecoveryIssue({
      checkoutSessionId: normalizedCheckoutSessionId,
      orderId: result.orderId,
      resolutionSource: "admin_recovery",
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

export async function runCheckoutReconciliation(
  _prevState: ActionState
): Promise<ActionState> {
  void _prevState;

  const session = await auth();

  if (!session?.user?.isAdmin) {
    return { error: "Unauthorized" };
  }

  const result = await reconcileRecentPaidCheckoutSessions();

  revalidatePath("/admin/ops");

  if (!result.ok) {
    return {
      error: result.error,
    };
  }

  return {
    success: true,
    message: `Checked ${result.checkedSessions} paid sessions from the last ${result.lookbackHours} hours. Flagged ${result.missingOrders} missing orders and resolved ${result.resolvedIssues} existing issues.`,
  };
}
