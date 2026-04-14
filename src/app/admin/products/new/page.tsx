// app/admin/products/new/page.tsx

import Link from "next/link";
import { createProduct } from "../actions";
import { ProductForm } from "@/components/admin/ProductForm";
import SiteShell from "@/components/SiteShell";

export default function NewProductPage() {
  return (
    <SiteShell>
      <main className="px-6 py-10">
        <div className="mb-8">
          <Link href="/admin/products" className="text-sm underline">
            Back to products
          </Link>
        </div>

        <h1 className="text-4xl mb-8">New Product</h1>

        <ProductForm action={createProduct} submitLabel="Create Product" />
      </main>
    </SiteShell>
  );
}