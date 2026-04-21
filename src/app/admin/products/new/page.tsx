// app/admin/products/new/page.tsx

import Link from "next/link";
import { createProduct } from "../actions";
import { ProductForm } from "@/features/admin/components/ProductForm";

export default function NewProductPage() {
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
            action={createProduct}
            submitLabel="Create Product"
          />
        </div>
      </div>
    </main>
  );
}
