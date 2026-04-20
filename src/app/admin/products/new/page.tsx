// app/admin/products/new/page.tsx

import Link from "next/link";
import { createProduct } from "../actions";
import { ProductForm } from "@/features/admin/components/ProductForm";

export default function NewProductPage() {
  return (
    <main className="mt-10">
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-8">
          <Link href="/admin/products" className="hover:underline">
            ← Back to products
          </Link>
        </div>

        <div>
          <ProductForm
            action={createProduct}
            submitLabel="Create Product"
          />
        </div>
      </div>
    </main>
  );
}
