import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProductImageUrl } from "@/lib/product-images";
import AddToCartForm from "@/features/cart/components/AddToCartForm";
import { formatPrice } from "@/lib/cart";

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
    <section className="mt-8 pb-14 md:mt-8 md:pb-10">
      <div className="ui-page-tight">
        <div className="grid gap-8 md:grid-cols-[minmax(0,420px)_minmax(0,1fr)] md:items-start md:gap-8 lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)] lg:gap-10">
          <div>
            <div>
              <p className="ui-caption tracking-[0.08em] uppercase">
                {product.origin}
              </p>

              <h1 className="mt-2 max-w-[10ch] font-display text-[42px] leading-[0.92] tracking-[-0.04em] md:text-[54px] lg:text-[62px]">
                {product.name}
              </h1>

              <div className="mt-5">
                <div className="ui-surface-muted relative aspect-[4/4.35] overflow-hidden">
                  {product.imageKey ? (
                    <Image
                      src={getProductImageUrl(product.imageKey)}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 430px, (min-width: 768px) 420px, 100vw"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="md:pt-8">
            <div className="border-t border-black pt-4">
              <div className="flex items-start justify-between gap-6">
                <div className="max-w-[31ch] space-y-2">
                  <p className="ui-body-loose max-w-[24ch]">
                    {product.description}
                  </p>
                  <p className="ui-body-sm-copy ui-muted whitespace-nowrap">
                    ({product.flavorNotes.join(", ")})
                  </p>
                </div>

                <p className="ui-body shrink-0">{formatPrice(product.priceCents)}</p>
              </div>
            </div>

            <div className="mt-10 md:mt-12">
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
