// app/admin/products/[id]/edit/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProductImageUrl } from "@/lib/product-images";
import { ProductForm } from "@/components/admin/ProductForm";
import { updateProduct } from "../../actions";
import SiteShell from "@/components/SiteShell";

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
    <SiteShell>
      <main className="my-10">
        <div className="mx-auto max-w-[1080px]">
          <div className="mb-8">
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
    </SiteShell>
  );
}