import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <section className="mt-16 pb-24">
      <div className="mx-auto max-w-[800px]">
        <h1 className="text-[18px] leading-[0.92]">Checkout canceled.</h1>
        <p className="mt-8 text-[18px] leading-[1.15]">
          Your cart is still here if you want to come back.
        </p>

        <div className="mt-10">
          <Link
            href="/cart"
            className="inline-block border border-black px-5 py-3.5 text-[18px] leading-none hover:underline"
          >
            Return to cart
          </Link>
        </div>
      </div>
    </section>
  );
}
