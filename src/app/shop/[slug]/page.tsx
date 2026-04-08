import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params

  const product = await prisma.product.findUnique({
    where: { slug },
  })

  if (!product || !product.isActive) {
    notFound()
  }

  return (
    <main className="px-6 py-12">
      {/* Large title */}
      <h1 className="text-[72px] leading-none tracking-tight mb-12">
        {product.name}
      </h1>

      {/* Layout */}
      <div className="grid grid-cols-2 gap-16 items-start">
        {/* Left: text */}
        <div className="space-y-6 text-lg leading-relaxed">
          <p>{product.description}</p>

          <p className="text-xl">
            ${(product.priceCents / 100).toFixed(2)}
          </p>

          <button className="underline text-lg">
            Add to cart
          </button>
        </div>

        {/* Right: image */}
        <div className="bg-gray-200 h-[420px]" />
      </div>
    </main>
  )
}