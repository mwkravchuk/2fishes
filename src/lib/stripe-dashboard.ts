export function getStripePaymentDashboardUrl(paymentIntentId: string) {
  const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_");

  return isTestMode
    ? `https://dashboard.stripe.com/test/payments/${paymentIntentId}`
    : `https://dashboard.stripe.com/payments/${paymentIntentId}`;
}