"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { BagSize, GrindOption, Product } from "@prisma/client";

type ProductFormProps = {
  action: (formData: FormData) => void;
  product?: Product;
  submitLabel: string;
  currentImageUrl?: string;
  currentImageKey?: string;
};

function SubmitButton({
  label,
  isPreparingUpload,
}: {
  label: string;
  isPreparingUpload: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || isPreparingUpload}
      className="ui-button-sm disabled:opacity-50"
    >
      {isPreparingUpload ? "Preparing image..." : pending ? "Saving..." : label}
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
  currentImageKey,
}: ProductFormProps) {
  const defaultPrice = product ? (product.priceCents / 100).toFixed(2) : "";
  const defaultFlavorNotes = product?.flavorNotes.join(", ") ?? "";

  const formRef = useRef<HTMLFormElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImageKey, setUploadedImageKey] = useState(currentImageKey ?? "");
  const [isPreparingUpload, setIsPreparingUpload] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  useEffect(() => {
    if (selectedFile) {
      setUploadedImageKey("");
    } else {
      setUploadedImageKey(currentImageKey ?? "");
    }
  }, [selectedFile, currentImageKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!selectedFile || uploadedImageKey) {
      return;
    }

    event.preventDefault();
    setUploadError(null);
    setIsPreparingUpload(true);

    try {
      const formData = new FormData(event.currentTarget);
      const name = String(formData.get("name") || "").trim();
      const slugInput = String(formData.get("slug") || "").trim();
      const slug = slugify(slugInput || name);

      if (!slug) {
        throw new Error("Name is required before uploading an image");
      }

      const processedFile = await createSquareUploadFile(selectedFile, slug);

      const presignResponse = await fetch("/api/admin/products/upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          filename: processedFile.name,
          contentType: processedFile.type,
        }),
      });

      const presignData = await presignResponse.json();

      if (!presignResponse.ok || !presignData.ok) {
        throw new Error(presignData.error || "Failed to prepare image upload");
      }

      const uploadResponse = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": processedFile.type,
        },
        body: processedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      setUploadedImageKey(presignData.key);

      requestAnimationFrame(() => {
        formRef.current?.requestSubmit();
      });
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Failed to prepare image"
      );
    } finally {
      setIsPreparingUpload(false);
    }
  }

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={handleSubmit}
      className="grid gap-10 md:gap-12 lg:grid-cols-[300px_minmax(0,1fr)]"
    >
      <div className="space-y-6">
        <div>
          <div className="ui-surface-muted aspect-square overflow-hidden">
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
            type="file"
            accept="image/*"
            required={!product && !uploadedImageKey}
            className="block w-full cursor-pointer border px-3 py-2 text-[16px] leading-[1.2]"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setSelectedFile(file);
            }}
          />
          <input type="hidden" name="imageKey" value={uploadedImageKey} />
          {uploadError ? (
            <p className="mt-2 text-[15px] leading-[1.25]">
              {uploadError}
            </p>
          ) : null}
          {product && (
            <p className="mt-2 text-[15px] leading-[1.25] opacity-70">
              Select a new file to preview it here before saving.
            </p>
          )}
        </div>

        <div className="border-t pt-4">
          <label className="flex items-start gap-2 text-[16px] leading-[1.2]">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={product?.isActive ?? true}
              className="mt-[1px]"
            />
            <span>Visible to storefront</span>
          </label>
          <p className="mt-2 text-[15px] leading-[1.25] opacity-70">
            Turn this off to hide the product from the storefront.
          </p>
        </div>
      </div>

      <div className="space-y-12 md:space-y-16">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-3 block text-[16px] leading-none md:mb-4">
                Name
              </label>
              <input
                name="name"
                defaultValue={product?.name ?? ""}
                required
                className="w-full border-b pb-2 text-[16px] leading-[1.2]"
              />
            </div>

            <div>
              <label className="mb-3 block text-[16px] leading-none md:mb-4">
                Slug
              </label>
              <input
                name="slug"
                defaultValue={product?.slug ?? ""}
                className="w-full border-b pb-2 text-[16px] leading-[1.2]"
              />
              <p className="mt-2 text-[15px] leading-[1.25] opacity-70">
                Leave blank to auto-generate.
              </p>
            </div>

            <div>
              <label className="mb-3 block text-[16px] leading-none md:mb-4">
                Price (USD)
              </label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={defaultPrice}
                required
                className="w-full border-b pb-2 text-[16px] leading-[1.2]"
              />
            </div>
          </div>

          <div>
            <label className="mb-3 block text-[16px] leading-none md:mb-4">
              Description
            </label>
            <textarea
              name="description"
              defaultValue={product?.description ?? ""}
              required
              rows={3}
              className="w-full resize-y border-b pb-2 text-[16px] leading-[1.35]"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-3 block text-[16px] leading-none md:mb-4">
                Origin
              </label>
              <input
                name="origin"
                defaultValue={product?.origin ?? ""}
                required
                className="w-full border-b pb-2 text-[16px] leading-[1.2]"
              />
            </div>

            <div>
              <label className="mb-3 block text-[16px] leading-none md:mb-4">
                Flavor notes
              </label>
              <input
                name="flavorNotes"
                defaultValue={defaultFlavorNotes}
                placeholder="Chocolate, Citrus, Honey"
                className="w-full border-b pb-2 text-[16px] leading-[1.2]"
              />
              <p className="mt-2 text-[15px] leading-[1.25] opacity-70">
                Comma-separated.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <label className="mb-3 block text-[16px] leading-none">
                Available grinds
              </label>
              <div className="space-y-2">
                {Object.values(GrindOption).map((grind) => (
                  <label
                    key={grind}
                    className="flex items-start gap-2 text-[16px] leading-[1.2]"
                  >
                    <input
                      type="checkbox"
                      name="availableGrinds"
                      value={grind}
                      defaultChecked={
                        product
                          ? product.availableGrinds.includes(grind)
                          : grind === GrindOption.whole_bean
                      }
                      className="mt-[1px]"
                    />
                    <span>{formatEnumLabel(grind)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-[16px] leading-none">
                Available sizes
              </label>
              <div className="space-y-2">
                {Object.values(BagSize).map((size) => (
                  <label
                    key={size}
                    className="flex items-start gap-2 text-[16px] leading-[1.2]"
                  >
                    <input
                      type="checkbox"
                      name="availableSizes"
                      value={size}
                      defaultChecked={
                        product
                          ? product.availableSizes.includes(size)
                          : size === BagSize.oz12
                      }
                      className="mt-[1px]"
                    />
                    <span>{formatEnumLabel(size)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <SubmitButton
            label={submitLabel}
            isPreparingUpload={isPreparingUpload}
          />
        </div>
      </div>
    </form>
  );
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-");
}

async function createSquareUploadFile(file: File, slug: string) {
  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  const outputSize = 1600;
  canvas.width = outputSize;
  canvas.height = outputSize;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is unavailable");
  }

  const cropSize = Math.min(image.naturalWidth, image.naturalHeight);
  const offsetX = (image.naturalWidth - cropSize) / 2;
  const offsetY = (image.naturalHeight - cropSize) / 2;

  context.drawImage(
    image,
    offsetX,
    offsetY,
    cropSize,
    cropSize,
    0,
    0,
    outputSize,
    outputSize
  );

  const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);

  return new File([blob], `${slug}.jpg`, {
    type: "image/jpeg",
  });
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load selected image"));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to process image"));
          return;
        }

        resolve(blob);
      },
      type,
      quality
    );
  });
}
