import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SuccessOrderStatus from "@/features/checkout/components/SuccessOrderStatus";

type SuccessPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return (
      <section className="mt-16 pb-24">
        <div className="mx-auto max-w-[1080px]">
          <p className="mt-8 text-[18px] leading-[1.15]">
            We could not find your checkout session.
          </p>
          <div className="mt-10">
            <Link
              href="/shop"
              className="inline-block border border-black px-5 py-3.5 text-[18px] leading-none hover:underline"
            >
              Return to shop
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const initialOrder = await prisma.order.findUnique({
    where: { stripeCheckoutSessionId: session_id },
    include: {
      items: true,
    },
  });

  return (
    <section className="mt-16 pb-24">
      <SuccessOrderStatus
        sessionId={session_id}
        initialOrder={initialOrder}
      />
    </section>
  );
}
