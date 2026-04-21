import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getProductImageUrl } from "@/lib/product-images";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="ui-page-wide mt-16 md:mt-24">
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-20 md:gap-y-4">
        {products.map((product) => {
          const imageUrl = getProductImageUrl(product.imageKey);

          return (
            <Link
              key={product.id}
              href={`/admin/products/${product.id}/edit`}
              className="group block w-full max-w-none md:max-w-[280px]"
            >
              <div
                className={[
                  "ui-surface-muted aspect-[5/5] overflow-hidden transition-all",
                  product.isActive
                    ? "opacity-100"
                    : "opacity-60 grayscale hover:grayscale-0 hover:opacity-100",
                ].join(" ")}
              >
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="mt-3 min-h-[72px]">
                <div className="visible md:invisible md:group-hover:visible">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-[18px] leading-[1.05]">
                      {product.name}
                    </p>
                    <p className="text-[18px] leading-[1.05]">
                      ${(product.priceCents / 100).toFixed(2)}
                    </p>
                  </div>

                  <p className="mt-1 text-[16px] leading-[1.1] opacity-70">
                    /{product.slug}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}

        <Link
          href="/admin/products/new"
          className="group block w-full max-w-none md:max-w-[280px]"
        >
          <div className="flex aspect-[5/5] items-center justify-center border border-black">
            <span className="text-[64px] leading-none">+</span>
          </div>

          <div className="mt-3 min-h-[72px]">
            <div className="visible md:invisible md:group-hover:visible">
              <p className="text-[18px] leading-[1.05]">New Product</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
