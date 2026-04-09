import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SiteShell from "@/components/SiteShell";

export default async function ShopPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <SiteShell>
      <section className="mt-16 pb-16">
        {products.length === 0 ? (
          <p className="mt-12 text-[22px]">No coffees available right now.</p>
        ) : (
          <div className="mt-24 flex flex-wrap justify-center gap-x-20 gap-y-16">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/shop/${product.slug}`}
                className="group block w-full max-w-[340px]"
              >
                <div className="aspect-[5/5] overflow-hidden bg-[#d8d0c4]">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>

                <div className="mt-3 min-h-[56px]">
                  <div className="invisible group-hover:visible">
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
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}