import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <section className="mt-16 pb-24">
      <div className="ui-page-narrow">
        <h1 className="ui-body-tight">Checkout canceled.</h1>
        <p className="ui-body-loose mt-8">
          Your cart is still here if you want to come back.
        </p>

        <div className="mt-10">
          <Link href="/cart" className="ui-button inline-block">
            Return to cart
          </Link>
        </div>
      </div>
    </section>
  );
}
