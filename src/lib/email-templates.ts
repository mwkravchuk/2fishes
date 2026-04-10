type OrderEmailItem = {
  productNameSnap: string;
  quantity: number;
  selectedSize: string;
  selectedGrind: string;
  unitPriceCents: number;
};

type OrderEmailData = {
  orderId: string;
  customerEmail: string;
  shippingName?: string | null;
  shippingLine1?: string | null;
  shippingLine2?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingZip?: string | null;
  shippingCountry?: string | null;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  items: OrderEmailItem[];
};

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatBagSize(size: string) {
  switch (size) {
    case "oz12":
      return "12 oz";
    default:
      return size;
  }
}

function formatGrind(grind: string) {
  switch (grind) {
    case "whole_bean":
      return "Whole bean";
    default:
      return grind;
  }
}

function buildShippingLines(order: OrderEmailData) {
  return [
    order.shippingName,
    order.shippingLine1,
    order.shippingLine2,
    [order.shippingCity, order.shippingState, order.shippingZip]
      .filter(Boolean)
      .join(", "),
    order.shippingCountry,
  ].filter(Boolean) as string[];
}

export function buildCustomerOrderConfirmationEmail(order: OrderEmailData) {
  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px 0;">${item.productNameSnap}</td>
          <td style="padding: 8px 0;">${formatBagSize(item.selectedSize)} / ${formatGrind(item.selectedGrind)}</td>
          <td style="padding: 8px 0; text-align: right;">x${item.quantity}</td>
        </tr>
      `
    )
    .join("");

  const itemsText = order.items
    .map(
      (item) =>
        `- ${item.productNameSnap} — ${formatBagSize(item.selectedSize)} / ${formatGrind(item.selectedGrind)} x${item.quantity}`
    )
    .join("\n");

  const shippingLines = buildShippingLines(order);

  return {
    subject: `We have received your order.`,
    html: `
      <div style="font-family: 'Times New Roman', serif; color: #111; max-width: 640px; margin: 0 auto; line-height: 1.5;">
        <h1 style="font-size: 28px; margin-bottom: 16px;">Thank you for your order!</h1>

        <p>Your order <strong>#${order.orderId}</strong> has been received.</p>

        <p>Orders are batch roasted on Saturday and typically shipped the following Monday. You will receive tracking information once the order has shipped.</p>

        <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px;">Order summary</h2>
        <table style="width: 100%; border-collapse: collapse;">
          ${itemsHtml}
        </table>

        <div style="margin-top: 20px;">
          <p style="margin: 4px 0;">Subtotal: ${formatPrice(order.subtotalCents)}</p>
          <p style="margin: 4px 0;">Shipping: ${formatPrice(order.shippingCents)}</p>
          <p style="margin: 4px 0;"><strong>Total: ${formatPrice(order.totalCents)}</strong></p>
        </div>

        <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px;">Shipping to</h2>
        <div>
          ${shippingLines.map((line) => `<p style="margin: 2px 0;">${line}</p>`).join("")}
        </div>

        <p style="margin-top: 32px;">If anything looks off, just reply to this email.</p>
      </div>
    `,
    text: `
Thank you for your order

Your order #${order.orderId} has been received.

Orders are batch roasted on Saturday and typically shipped the following Monday. You will receive tracking information once the order has shipped.

Order summary:
${itemsText}

Subtotal: ${formatPrice(order.subtotalCents)}
Shipping: ${formatPrice(order.shippingCents)}
Total: ${formatPrice(order.totalCents)}

Shipping to:
${shippingLines.join("\n")}

If anything looks off, just reply to this email.
    `.trim(),
  };
}

export function buildInternalNewOrderEmail(order: OrderEmailData) {
  const itemsText = order.items
    .map(
      (item) =>
        `- ${item.productNameSnap} — ${formatBagSize(item.selectedSize)} / ${formatGrind(item.selectedGrind)} x${item.quantity}`
    )
    .join("\n");

  return {
    subject: `New order received.`,
    html: `
      <div style="font-family: 'Times New Roman', serif; color: #111; max-width: 640px; margin: 0 auto; line-height: 1.5;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">New order received</h1>
        <p><strong>Order:</strong> #${order.orderId}</p>
        <p><strong>Email:</strong> ${order.customerEmail}</p>
        <p><strong>Total:</strong> ${formatPrice(order.totalCents)}</p>
        <pre style="white-space: pre-wrap; font-family: 'Times New Roman', serif;">${itemsText}</pre>
      </div>
    `,
    text: `
New order received

Order: #${order.orderId}
Email: ${order.customerEmail}
Total: ${formatPrice(order.totalCents)}

${itemsText}
    `.trim(),
  };
}

export function buildOrderFulfilledEmail(order: OrderEmailData & {
  trackingCarrier?: string | null;
  trackingNumber?: string | null;
}) {
  const shippingLines = buildShippingLines(order);

  const itemsText = order.items
    .map(
      (item) =>
        `- ${item.productNameSnap} — ${formatBagSize(item.selectedSize)} / ${formatGrind(item.selectedGrind)} x${item.quantity}`
    )
    .join("\n");

  const trackingText =
    order.trackingNumber
      ? `Tracking: ${order.trackingCarrier ? `${order.trackingCarrier} ` : ""}${order.trackingNumber}`
      : "Tracking information: not provided";

  return {
    subject: `Your order is on the way!`,
    html: `
      <div style="font-family: 'Times New Roman', serif; color: #111; max-width: 640px; margin: 0 auto; line-height: 1.5;">
        <h1 style="font-size: 28px; margin-bottom: 16px;">Your order is on the way!</h1>

        <p>Your order <strong>#${order.orderId}</strong> has been fulfilled.</p>

        ${
          order.trackingNumber
            ? `<p><strong>Tracking:</strong> ${order.trackingCarrier ? `${order.trackingCarrier} ` : ""}${order.trackingNumber}</p>`
            : ""
        }

        <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px;">Order summary</h2>
        <pre style="white-space: pre-wrap; font-family: 'Times New Roman', serif;">${itemsText}</pre>

        <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px;">Shipping to</h2>
        <div>
          ${shippingLines.map((line) => `<p style="margin: 2px 0;">${line}</p>`).join("")}
        </div>

        <p style="margin-top: 32px;">If anything looks off, just reply to this email.</p>
      </div>
    `,
    text: `
Your order is on the way

Your order #${order.orderId} has been fulfilled.

${trackingText}

Order summary:
${itemsText}

Shipping to:
${shippingLines.join("\n")}

If anything looks off, just reply to this email.
    `.trim(),
  };
}