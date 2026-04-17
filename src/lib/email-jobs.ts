import { prisma } from "@/lib/prisma";
import {
  buildCustomerOrderConfirmationEmail,
  buildInternalNewOrderEmail,
  buildOrderShippedEmail,
} from "@/lib/email-templates";
import {
  EMAIL_FROM,
  EMAIL_REPLY_TO,
  INTERNAL_ORDER_EMAIL,
  getResendClient,
  hasEmailConfig,
} from "@/lib/email";

function buildOrderEmailData(order: {
  id: string;
  customerEmail: string;
  shippingName: string | null;
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingZip: string | null;
  shippingCountry: string | null;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  trackingCarrier?: string | null;
  trackingNumber?: string | null;
  items: {
    productNameSnap: string;
    quantity: number;
    selectedSize: string;
    selectedGrind: string;
    unitPriceCents: number;
  }[];
}) {
  return {
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
  };
}

export async function enqueueOrderEmailJobsTx(tx: typeof prisma, input: {
  orderId: string;
  customerEmail: string;
}) {
  await tx.emailJob.createMany({
    data: [
      {
        orderId: input.orderId,
        type: "order_confirmation",
        recipient: input.customerEmail,
      },
      {
        orderId: input.orderId,
        type: "internal_new_order",
        recipient: INTERNAL_ORDER_EMAIL,
      },
    ],
  });
}

export async function processOrderEmailJobs(orderId: string) {
  const jobs = await prisma.emailJob.findMany({
    where: {
      orderId,
      status: {
        in: ["pending", "failed"],
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  for (const job of jobs) {
    await processEmailJob(job.id);
  }
}

export async function processEmailJob(jobId: string) {
  const job = await prisma.emailJob.findUnique({
    where: { id: jobId },
    include: {
      order: {
        include: {
          items: true,
        },
      },
    },
  });

  if (!job) {
    throw new Error("Email job not found");
  }

  if (job.status === "sent") {
    return;
  }

  if (!hasEmailConfig()) {
    await markEmailJobFailed(job.id, job.attempts + 1, "Missing RESEND_API_KEY");
    return;
  }

  const resend = getResendClient();

  if (!resend) {
    await markEmailJobFailed(job.id, job.attempts + 1, "Resend client unavailable");
    return;
  }

  await prisma.emailJob.update({
    where: { id: job.id },
    data: {
      status: "processing",
      attempts: {
        increment: 1,
      },
      lastError: null,
    },
  });

  try {
    const emailData = buildOrderEmailData(job.order);

    const payload =
      job.type === "order_confirmation"
        ? buildCustomerOrderConfirmationEmail(emailData)
        : buildInternalNewOrderEmail(emailData);

    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: [job.recipient],
      replyTo: EMAIL_REPLY_TO,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    if (result.error) {
      throw new Error(result.error.message || "Email provider returned an error");
    }

    await prisma.emailJob.update({
      where: { id: job.id },
      data: {
        status: "sent",
        sentAt: new Date(),
        lastError: null,
      },
    });
  } catch (error) {
    await markEmailJobFailed(
      job.id,
      job.attempts + 1,
      error instanceof Error ? error.message : "Failed to send email"
    );
  }
}

async function markEmailJobFailed(
  jobId: string,
  attempts: number,
  lastError: string
) {
  await prisma.emailJob.update({
    where: { id: jobId },
    data: {
      status: "failed",
      attempts,
      lastError,
    },
  });
}

export async function sendShipmentEmailNow(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (!hasEmailConfig()) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const resend = getResendClient();

  if (!resend) {
    throw new Error("Resend client unavailable");
  }

  const payload = buildOrderShippedEmail(buildOrderEmailData(order));
  const result = await resend.emails.send({
    from: EMAIL_FROM,
    to: [order.customerEmail],
    replyTo: EMAIL_REPLY_TO,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });

  if (result.error) {
    throw new Error(result.error.message || "Failed to send shipment email");
  }
}
