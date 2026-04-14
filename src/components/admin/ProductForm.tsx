"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { BagSize, GrindOption, Product } from "@prisma/client";

type ProductFormProps = {
  action: (formData: FormData) => void;
  product?: Product;
  submitLabel: string;
  currentImageUrl?: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="border px-4 py-2 disabled:opacity-50 cursor-pointer"
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

function formatEnumLabel(value: string) {
  switch (value) {
    case "whole_bean":
      return "Whole bean";
    case "oz12":
      return "12 oz";
    default:
      return value.replace(/_/g, " ");
  }
}

export function ProductForm({
  action,
  product,
  submitLabel,
  currentImageUrl,
}: ProductFormProps) {
  const defaultPrice = product ? (product.priceCents / 100).toFixed(2) : "";
  const defaultFlavorNotes = product?.flavorNotes.join(", ") ?? "";

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const previewUrl = useMemo(() => {
    if (!selectedFile) return currentImageUrl ?? null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile, currentImageUrl]);

  useEffect(() => {
    return () => {
      if (selectedFile) {
        URL.revokeObjectURL(previewUrl ?? "");
      }
    };
  }, [selectedFile, previewUrl]);

  return (
    <form action={action} className="grid gap-12 lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="space-y-6">
        <div>
          <div className="aspect-square overflow-hidden bg-[#d8d0c4]">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={product?.name ?? "Product preview"}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
        </div>

        <div>
          <input
            name="image"
            type="file"
            accept="image/*"
            required={!product}
            className="block w-full cursor-pointer px-3 py-2 border"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setSelectedFile(file);
            }}
          />
          {product && (
            <p className="mt-2 text-sm opacity-70">
              Select a new file to preview it here before saving.
            </p>
          )}
        </div>

        <div className="border-t pt-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={product?.isActive ?? true}
            />
            <span>Visible to storefront</span>
          </label>
          <p className="mt-2 text-sm opacity-70">
            Turn this off to hide the product from the storefront.
          </p>
        </div>
      </div>

      <div className="space-y-16">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block mb-4">Name</label>
              <input
                name="name"
                defaultValue={product?.name ?? ""}
                required
                className="w-full border-b pb-1.5"
              />
            </div>

            <div>
              <label className="block mb-4">Slug</label>
              <input
                name="slug"
                defaultValue={product?.slug ?? ""}
                className="w-full border-b pb-1.5"
              />
              <p className="mt-1 text-sm opacity-70">
                Leave blank to auto-generate.
              </p>
            </div>

            <div>
              <label className="block mb-4">Price (USD)</label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={defaultPrice}
                required
                className="w-full border-b pb-1.5"
              />
            </div>
          </div>

          <div>
            <label className="block mb-4">Description</label>
            <textarea
              name="description"
              defaultValue={product?.description ?? ""}
              required
              rows={1}
              className="w-full border-b pb-1.5"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-4">Origin</label>
              <input
                name="origin"
                defaultValue={product?.origin ?? ""}
                required
                className="w-full border-b pb-1.5"
              />
            </div>

            <div>
              <label className="block mb-4">Flavor notes</label>
              <input
                name="flavorNotes"
                defaultValue={defaultFlavorNotes}
                placeholder="Chocolate, Citrus, Honey"
                className="w-full border-b pb-1.5"
              />
              <p className="mt-1 text-sm opacity-70">
                Comma-separated.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <label className="block mb-2">Available grinds</label>
              <div className="space-y-2">
                {Object.values(GrindOption).map((grind) => (
                  <label key={grind} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="availableGrinds"
                      value={grind}
                      defaultChecked={
                        product
                          ? product.availableGrinds.includes(grind)
                          : grind === GrindOption.whole_bean
                      }
                    />
                    <span>{formatEnumLabel(grind)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block mb-2">Available sizes</label>
              <div className="space-y-2">
                {Object.values(BagSize).map((size) => (
                  <label key={size} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="availableSizes"
                      value={size}
                      defaultChecked={
                        product
                          ? product.availableSizes.includes(size)
                          : size === BagSize.oz12
                      }
                    />
                    <span>{formatEnumLabel(size)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <SubmitButton label={submitLabel} />
        </div>
      </div>
    </form>
  );
}