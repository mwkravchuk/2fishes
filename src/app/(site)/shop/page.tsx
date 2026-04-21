import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getProductImageUrl } from "@/lib/product-images";

export default async function ShopPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="mt-16 pb-16">
      {products.length === 0 ? (
        <div className="ui-page">
          <p className="mt-12 text-[22px]">No coffees available right now.</p>
        </div>
      ) : (
        <div className="ui-page mt-12 md:mt-24">
          <div className="grid grid-cols-1 gap-x-16 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const imageUrl = getProductImageUrl(product.imageKey);

              return (
                <Link
                  key={product.id}
                  href={`/shop/${product.slug}`}
                  className="group block w-full max-w-none"
                >
                  <div className="ui-surface-muted aspect-square overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="mt-3 min-h-[56px]">
                    <div className="visible md:invisible md:group-hover:visible">
                      <div className="flex items-baseline justify-between gap-4">
                        <p className="text-[18px] leading-[1.05]">
                          {product.name}
                        </p>
                        <p className="text-[18px] leading-[1.05]">
                          ${(product.priceCents / 100).toFixed(2)}
                        </p>
                      </div>

                      <p className="mt-1 text-[18px] leading-[1.1]">
                        ({product.flavorNotes.join(", ")})
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
