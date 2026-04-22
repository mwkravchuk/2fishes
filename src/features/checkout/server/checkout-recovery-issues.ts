import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { logError, logInfo } from "@/lib/logging";

const RECONCILIATION_LOOKBACK_HOURS = 48;

type ReconciliationSource = "cron" | "admin_manual";

export async function upsertOpenCheckoutRecoveryIssue(input: {
  checkoutSessionId: string;
  stripePaymentIntentId?: string | null;
  cartId?: string | null;
  eventType: string;
  lastError: string;
}) {
  await prisma.checkoutRecoveryIssue.upsert({
    where: { checkoutSessionId: input.checkoutSessionId },
    update: {
      stripePaymentIntentId: input.stripePaymentIntentId ?? null,
      cartId: input.cartId ?? null,
      eventType: input.eventType,
      lastError: input.lastError,
      status: "open",
      recoveredOrderId: null,
      resolutionSource: null,
      resolvedAt: null,
    },
    create: {
      checkoutSessionId: input.checkoutSessionId,
      stripePaymentIntentId: input.stripePaymentIntentId ?? null,
      cartId: input.cartId ?? null,
      eventType: input.eventType,
      lastError: input.lastError,
    },
  });
}

export async function resolveCheckoutRecoveryIssue(input: {
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

export async function reconcileRecentPaidCheckoutSessions(
  source: ReconciliationSource
) {
  const since = Math.floor(
    (Date.now() - RECONCILIATION_LOOKBACK_HOURS * 60 * 60 * 1000) / 1000
  );

  try {
    let checkedSessions = 0;
    let missingOrders = 0;
    let resolvedIssues = 0;
    let startingAfter: string | undefined;

    while (true) {
      const page = await stripe.checkout.sessions.list({
        created: { gte: since },
        limit: 100,
        starting_after: startingAfter,
      });

      const paidCompletedSessions = page.data.filter((session) => {
        return session.status === "complete" && session.payment_status === "paid";
      });

      checkedSessions += paidCompletedSessions.length;

      if (paidCompletedSessions.length > 0) {
        const sessionIds = paidCompletedSessions.map((session) => session.id);
        const existingOrders = await prisma.order.findMany({
          where: {
            stripeCheckoutSessionId: {
              in: sessionIds,
            },
          },
          select: {
            id: true,
            stripeCheckoutSessionId: true,
          },
        });

        const existingOrderMap = new Map(
          existingOrders.map((order) => [order.stripeCheckoutSessionId, order.id])
        );

        for (const session of paidCompletedSessions) {
          const orderId = existingOrderMap.get(session.id);

          if (orderId) {
            await resolveCheckoutRecoveryIssue({
              checkoutSessionId: session.id,
              orderId,
              resolutionSource: "reconciliation_sweep",
            });
            resolvedIssues += 1;
            continue;
          }

          const cartId = session.client_reference_id ?? session.metadata?.cartId;

          await upsertOpenCheckoutRecoveryIssue({
            checkoutSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
            cartId: typeof cartId === "string" ? cartId : null,
            eventType: "reconciliation_sweep",
            lastError:
              "Stripe shows this checkout as paid, but no internal order exists yet.",
          });
          missingOrders += 1;
        }
      }

      if (!page.has_more || page.data.length === 0) {
        break;
      }

      startingAfter = page.data[page.data.length - 1]?.id;

      if (!startingAfter) {
        break;
      }
    }

    logInfo("checkout_reconciliation_sweep_completed", {
      source,
      lookbackHours: RECONCILIATION_LOOKBACK_HOURS,
      checkedSessions,
      missingOrders,
      resolvedIssues,
    });

    await prisma.checkoutRecoveryScan.create({
      data: {
        source,
        ok: true,
        checkedSessions,
        missingOrders,
        resolvedIssues,
      },
    });

    return {
      ok: true as const,
      source,
      lookbackHours: RECONCILIATION_LOOKBACK_HOURS,
      checkedSessions,
      missingOrders,
      resolvedIssues,
    };
  } catch (error) {
    logError("checkout_reconciliation_sweep_failed", {
      source,
      lookbackHours: RECONCILIATION_LOOKBACK_HOURS,
      error:
        error instanceof Error ? error.message : "Reconciliation sweep failed",
    });

    await prisma.checkoutRecoveryScan.create({
      data: {
        source,
        ok: false,
        checkedSessions: 0,
        missingOrders: 0,
        resolvedIssues: 0,
        error:
          error instanceof Error ? error.message : "Reconciliation sweep failed",
      },
    });

    return {
      ok: false as const,
      source,
      lookbackHours: RECONCILIATION_LOOKBACK_HOURS,
      checkedSessions: 0,
      missingOrders: 0,
      resolvedIssues: 0,
      error:
        error instanceof Error ? error.message : "Reconciliation sweep failed",
    };
  }
}
