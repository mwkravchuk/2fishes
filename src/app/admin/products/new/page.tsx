// app/admin/products/new/page.tsx

import Link from "next/link";
import { createProduct } from "../actions";
import { ProductForm } from "@/features/admin/components/ProductForm";

export default function NewProductPage() {
  return (
    <main className="ui-admin-page">
      <div className="ui-page-wide">
        <div className="ui-admin-backlink">
          <Link href="/admin/products" className="hover:underline">
            ← Back to products
          </Link>
        </div>

        <div className="ui-admin-block">
          <ProductForm
            action={createProduct}
            submitLabel="Create Product"
          />
        </div>
      </div>
    </main>
  );
}
