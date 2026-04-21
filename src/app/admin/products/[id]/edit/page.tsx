// app/admin/products/[id]/edit/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProductImageUrl } from "@/lib/product-images";
import { ProductForm } from "@/features/admin/components/ProductForm";
import { updateProduct } from "../../actions";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    notFound();
  }

  const updateAction = updateProduct.bind(null, product.id);

  return (
    <main className="py-6 md:py-10">
      <div className="ui-page-wide">
        <div className="mb-6 md:mb-8">
          <Link href="/admin/products" className="hover:underline">
            ← Back to products
          </Link>
        </div>

        <div>
          <ProductForm
            action={updateAction}
            product={product}
            submitLabel="Save Changes"
            currentImageUrl={getProductImageUrl(product.imageKey)}
          />
        </div>
      </div>
    </main>
  );
}
