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

function buildEmailHtml(body: string) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta name="color-scheme" content="light only">
        <meta name="supported-color-schemes" content="light only">
        <style>
          :root {
            color-scheme: light only;
            supported-color-schemes: light only;
          }
          body, div, p, pre, strong {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
        </style>
      </head>
      <body bgcolor="#ffffff" style="background-color: #ffffff !important; color: #000000 !important; margin: 0; padding: 0;">
        <div bgcolor="#ffffff" style="background-color: #ffffff !important; color: #000000 !important; margin: 0; padding: 0;">
          <div style="background-color: #ffffff !important; color: #000000 !important; font-family: 'Times New Roman', Times, serif; font-size: 16px; line-height: 1.5; max-width: 560px; margin: 0 auto; padding: 24px;">
            ${body}
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildSectionTitle(label: string) {
  return `<p style="color: #000000 !important; font-size: 16px; font-weight: 700; margin: 24px 0 8px;">${label}</p>`;
}

function buildShippingLinesHtml(lines: string[]) {
  return lines
    .map(
      (line) =>
        `<p style="color: #000000 !important; font-size: 16px; margin: 0 0 2px;">${line}</p>`
    )
    .join("");
}

export function buildCustomerOrderConfirmationEmail(order: OrderEmailData) {
  const itemsText = order.items
    .map(
      (item) =>
        `- ${item.productNameSnap} — ${formatBagSize(item.selectedSize)} / ${formatGrind(item.selectedGrind)} x${item.quantity}`
    )
    .join("\n");

  const shippingLines = buildShippingLines(order);

  return {
    subject: `We have received your order.`,
    html: buildEmailHtml(`
      <p style="color: #000000 !important; font-size: 16px; margin: 0 0 16px;">Thank you for your order!</p>

      <p style="color: #000000 !important; font-size: 16px; margin: 0 0 16px;">Your order <strong>#${order.orderId}</strong> has been received.</p>

      <p style="color: #000000 !important; font-size: 16px; margin: 0 0 16px;">Orders are batch roasted on Saturday and typically shipped the following Monday. You will receive tracking information once the order has shipped.</p>

      ${buildSectionTitle("Order summary")}
      <pre style="color: #000000 !important; font-family: 'Times New Roman', Times, serif; font-size: 16px; line-height: 1.5; margin: 0; white-space: pre-wrap;">${itemsText}</pre>

      <div style="margin-top: 16px;">
        <p style="color: #000000 !important; font-size: 16px; margin: 0 0 2px;">Subtotal: ${formatPrice(order.subtotalCents)}</p>
        <p style="color: #000000 !important; font-size: 16px; margin: 0 0 2px;">Shipping: ${formatPrice(order.shippingCents)}</p>
        <p style="color: #000000 !important; font-size: 16px; margin: 0;"><strong>Total: ${formatPrice(order.totalCents)}</strong></p>
      </div>

      ${buildSectionTitle("Shipping to")}
      ${buildShippingLinesHtml(shippingLines)}

      <p style="color: #000000 !important; font-size: 16px; margin: 24px 0 0;">If anything looks off, just reply to this email.</p>
    `),
    text: `
Thank you for your order!

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
    html: buildEmailHtml(`
      <p style="color: #000000 !important; font-size: 16px; font-weight: 700; margin: 0 0 16px;">New order received</p>
      <p style="color: #000000 !important; font-size: 16px; margin: 0 0 2px;"><strong>Order:</strong> #${order.orderId}</p>
      <p style="color: #000000 !important; font-size: 16px; margin: 0 0 2px;"><strong>Email:</strong> ${order.customerEmail}</p>
      <p style="color: #000000 !important; font-size: 16px; margin: 0 0 16px;"><strong>Total:</strong> ${formatPrice(order.totalCents)}</p>
      <pre style="color: #000000 !important; font-family: 'Times New Roman', Times, serif; font-size: 16px; line-height: 1.5; margin: 0; white-space: pre-wrap;">${itemsText}</pre>
    `),
    text: `
New order received

Order: #${order.orderId}
Email: ${order.customerEmail}
Total: ${formatPrice(order.totalCents)}

${itemsText}
    `.trim(),
  };
}

export function buildOrderShippedEmail(order: OrderEmailData & {
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
    html: buildEmailHtml(`
      <p style="color: #000000 !important; font-size: 16px; font-weight: 700; margin: 0 0 16px;">Your order is on the way!</p>

      <p style="color: #000000 !important; font-size: 16px; margin: 0 0 16px;">Your order <strong>#${order.orderId}</strong> has been fulfilled.</p>

      ${
        order.trackingNumber
          ? `<p style="color: #000000 !important; font-size: 16px; margin: 0 0 16px;"><strong>Tracking:</strong> ${order.trackingCarrier ? `${order.trackingCarrier} ` : ""}${order.trackingNumber}</p>`
          : ""
      }

      ${buildSectionTitle("Order summary")}
      <pre style="color: #000000 !important; font-family: 'Times New Roman', Times, serif; font-size: 16px; line-height: 1.5; margin: 0; white-space: pre-wrap;">${itemsText}</pre>

      ${buildSectionTitle("Shipping to")}
      ${buildShippingLinesHtml(shippingLines)}

      <p style="color: #000000 !important; font-size: 16px; margin: 24px 0 0;">If anything looks off, just reply to this email.</p>
    `),
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
