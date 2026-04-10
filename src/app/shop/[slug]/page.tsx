import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SiteShell from "@/components/SiteShell";
import AddToCartForm from "@/components/AddToCartForm";

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
    <SiteShell>
      <section className="mt-12 pb-20">
        <div className="mx-auto max-w-[800px]">
          {/* Title */}
          <h1 className="font-display text-[54px] leading-[0.92] mb-4 -ml-8 md:-ml-16">{product.name}</h1>

          {/* Two-column body */}
          <div className="mt-8 flex flex-col gap-10 md:flex-row md:items-start md:gap-12">
            {/* Left: image */}
            <div className="w-full md:w-[50%]">
              <div className="aspect-[5/5] overflow-hidden bg-[#d8d0c4]">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
            </div>

            {/* Right: product info + controls */}
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

              <div className="mt-14">
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
    </SiteShell>
  );
}