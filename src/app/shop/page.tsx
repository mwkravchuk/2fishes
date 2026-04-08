import { prisma } from '@/lib/prisma'

export default async function ShopPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main className="px-6 py-12">
      {/* Title */}
      <h1 className="text-[64px] leading-none tracking-tight mb-16">
        Shop
      </h1>

      {/* Product grid */}
      <div className="grid grid-cols-2 gap-16">
        {products.map((product) => (
          <a
            key={product.id}
            href={`/shop/${product.slug}`}
            className="group block"
          >
            {/* Image placeholder */}
            <div className="bg-gray-200 h-[320px] mb-4" />

            {/* Name */}
            <h2 className="text-xl tracking-tight group-hover:underline">
              {product.name}
            </h2>

            {/* Price */}
            <p className="text-sm text-gray-500">
              ${(product.priceCents / 100).toFixed(2)}
            </p>
          </a>
        ))}
      </div>
    </main>
  )
}