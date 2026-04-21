import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProductImageUrl } from "@/lib/product-images";
import AddToCartForm from "@/features/cart/components/AddToCartForm";

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
  });

  if (!product || !product.isActive) {
    notFound();
  }

  return (
    <section className="mt-10 pb-20 md:mt-12">
      <div className="ui-page-narrow">
        <h1 className="mb-4 font-display text-[44px] leading-[0.92] md:-ml-16 md:text-[54px]">
          {product.name}
        </h1>

        <div className="mt-6 flex flex-col gap-8 md:mt-8 md:flex-row md:items-start md:gap-12">
          <div className="mx-auto w-full max-w-[440px] md:mx-0 md:w-[50%] md:max-w-none">
            <div className="ui-surface-muted aspect-[5/5] overflow-hidden">
              {product.imageKey ? (
                <img
                  src={getProductImageUrl(product.imageKey)}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
          </div>

          <div className="w-full md:w-[48%]">
            <div className="space-y-6">
              <p className="text-[18px] leading-[1.05]">
                {product.description}
              </p>

              <p className="text-[18px] leading-[1.1]">
                ({product.flavorNotes.join(", ")})
              </p>

              <p className="text-[18px] leading-[1.05]">
                ${(product.priceCents / 100).toFixed(2)}
              </p>
            </div>

            <div className="mt-10 md:mt-14">
              <AddToCartForm
                productId={product.id}
                selectedSize="oz12"
                selectedGrind="whole_bean"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
