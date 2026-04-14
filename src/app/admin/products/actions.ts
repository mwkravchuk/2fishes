"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { uploadToS3 } from "@/lib/s3";
import { BagSize, GrindOption } from "@prisma/client";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-");
}

function parseFlavorNotes(input: string) {
  return input
    .split(",")
    .map((note) => note.trim())
    .filter(Boolean);
}

function parsePriceCents(input: string) {
  const dollars = Number(input);
  if (Number.isNaN(dollars) || dollars < 0) {
    throw new Error("Invalid price");
  }
  return Math.round(dollars * 100);
}

function parseGrinds(formData: FormData): GrindOption[] {
  const values = formData.getAll("availableGrinds") as string[];
  return values.filter(Boolean) as GrindOption[];
}

function parseSizes(formData: FormData): BagSize[] {
  const values = formData.getAll("availableSizes") as string[];
  return values.filter(Boolean) as BagSize[];
}

export async function createProduct(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const origin = String(formData.get("origin") || "").trim();
  const flavorNotesInput = String(formData.get("flavorNotes") || "").trim();
  const priceInput = String(formData.get("price") || "").trim();
  const isActive = formData.get("isActive") === "on";
  const file = formData.get("image") as File | null;

  if (!name) throw new Error("Name is required");
  if (!description) throw new Error("Description is required");
  if (!origin) throw new Error("Origin is required");
  if (!priceInput) throw new Error("Price is required");
  if (!file || file.size === 0) throw new Error("Image is required");

  const slug = slugify(slugInput || name);
  const flavorNotes = parseFlavorNotes(flavorNotesInput);
  const priceCents = parsePriceCents(priceInput);

  const availableGrinds = parseGrinds(formData);
  const availableSizes = parseSizes(formData);

  if (availableGrinds.length === 0) {
    throw new Error("At least one grind option is required");
  }

  if (availableSizes.length === 0) {
    throw new Error("At least one bag size is required");
  }

  const existing = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existing) {
    throw new Error("A product with that slug already exists");
  }

  const { key } = await uploadToS3(file, slug);

  await prisma.product.create({
    data: {
      name,
      slug,
      description,
      origin,
      flavorNotes,
      priceCents,
      imageKey: key,
      isActive,
      availableGrinds,
      availableSizes,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect("/admin/products");
}

export async function updateProduct(productId: string, formData: FormData) {
  const existingProduct = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!existingProduct) {
    throw new Error("Product not found");
  }

  const name = String(formData.get("name") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const origin = String(formData.get("origin") || "").trim();
  const flavorNotesInput = String(formData.get("flavorNotes") || "").trim();
  const priceInput = String(formData.get("price") || "").trim();
  const isActive = formData.get("isActive") === "on";
  const file = formData.get("image") as File | null;

  if (!name) throw new Error("Name is required");
  if (!description) throw new Error("Description is required");
  if (!origin) throw new Error("Origin is required");
  if (!priceInput) throw new Error("Price is required");

  const slug = slugify(slugInput || name);
  const flavorNotes = parseFlavorNotes(flavorNotesInput);
  const priceCents = parsePriceCents(priceInput);

  const availableGrinds = parseGrinds(formData);
  const availableSizes = parseSizes(formData);

  if (availableGrinds.length === 0) {
    throw new Error("At least one grind option is required");
  }

  if (availableSizes.length === 0) {
    throw new Error("At least one bag size is required");
  }

  const conflictingSlug = await prisma.product.findFirst({
    where: {
      slug,
      NOT: { id: productId },
    },
    select: { id: true },
  });

  if (conflictingSlug) {
    throw new Error("Another product already uses that slug");
  }

  let imageKey = existingProduct.imageKey;

  if (file && file.size > 0) {
    const upload = await uploadToS3(file, slug);
    imageKey = upload.key;
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      name,
      slug,
      description,
      origin,
      flavorNotes,
      priceCents,
      imageKey,
      isActive,
      availableGrinds,
      availableSizes,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/shop");
  redirect("/admin/products");
}

export async function toggleProductActive(productId: string, nextIsActive: boolean) {
  await prisma.product.update({
    where: { id: productId },
    data: { isActive: nextIsActive },
  });

  revalidatePath("/admin/products");
  revalidatePath("/shop");
}