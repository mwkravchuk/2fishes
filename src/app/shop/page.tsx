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
          <div className="mt-12 flex justify-center flex-wrap gap-x-20 gap-y-16">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/shop/${product.slug}`}
                className="group block w-full max-w-[380px]"
              >
                <div className="aspect-[4/5] overflow-hidden bg-[#d8d0c4]">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>

                <div className="mt-3">
                  <p className="text-[24px] leading-[1.05] group-hover:underline">
                    {product.name}
                  </p>
                  <p className="text-[22px] leading-[1.05]">
                    ${Number(product.priceCents/100).toFixed(2)}
                  </p>

                  <div className="mt-2 min-h-[48px]">
                    <div className="invisible group-hover:visible text-[18px] leading-[1.1]">
                      {product.origin ? <p>{product.origin}</p> : null}
                      {product.notes ? <p>{product.notes}</p> : null}
                    </div>
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