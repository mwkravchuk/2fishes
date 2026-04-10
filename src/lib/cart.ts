import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { BagSize, GrindOption } from "@prisma/client";

export const CART_COOKIE_NAME = "cartSessionId";

export function createCartSessionId() {
  return randomUUID();
}

type AddItemToCartInput = {
  sessionId: string;
  productId: string;
  selectedSize: BagSize;
  selectedGrind: GrindOption;
  quantity: number;
};

export async function getOrCreateCart(sessionId: string) {
  const existingCart = await prisma.cart.findUnique({
    where: { sessionId },
  });

  if (existingCart) {
    return existingCart;
  }

  return prisma.cart.create({
    data: {
      sessionId,
      totalCents: 0,
    },
  });
}

export async function addItemToCart(input: AddItemToCartInput) {
  const { sessionId, productId, selectedSize, selectedGrind, quantity } = input;

  if (quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || !product.isActive) {
    throw new Error("Product not found");
  }

  if (!product.availableSizes.includes(selectedSize)) {
    throw new Error("Selected size is not available for this product");
  }

  if (!product.availableGrinds.includes(selectedGrind)) {
    throw new Error("Selected grind is not available for this product");
  }

  return prisma.$transaction(async (tx) => {
    let cart = await tx.cart.findUnique({
      where: { sessionId },
    });

    if (!cart) {
      cart = await tx.cart.create({
        data: {
          sessionId,
          totalCents: 0,
        },
      });
    }

    const existingItem = await tx.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        selectedSize,
        selectedGrind,
      },
    });

    if (existingItem) {
      await tx.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
        },
      });
    } else {
      await tx.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          productNameSnap: product.name,
          unitPriceCents: product.priceCents,
          quantity,
          selectedSize,
          selectedGrind,
        },
      });
    }

    return recalculateCartTotalTx(tx, cart.id);
  });
}

export async function getCartBySession(sessionId: string) {
  return prisma.cart.findUnique({
    where: { sessionId },
    include: {
      items: {
        orderBy: { id: "asc" },
        include: {
          product: {
            select: {
              imageUrl: true,
              slug: true,
              isActive: true,
            },
          },
        },
      },
    },
  });
}

export async function updateCartItemQuantity(input: {
  sessionId: string;
  cartItemId: string;
  quantity: number;
}) {
  const { sessionId, cartItemId, quantity } = input;

  if (quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  return prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { sessionId },
    });

    if (!cart) {
      throw new Error("Cart not found");
    }

    const cartItem = await tx.cartItem.findUnique({
      where: { id: cartItemId },
    });

    if (!cartItem || cartItem.cartId !== cart.id) {
      throw new Error("Cart item not found");
    }

    await tx.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    return recalculateCartTotalTx(tx, cart.id);
  });
}

export async function removeCartItem(input: {
  sessionId: string;
  cartItemId: string;
}) {
  const { sessionId, cartItemId } = input;

  return prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { sessionId },
    });

    if (!cart) {
      throw new Error("Cart not found");
    }

    const cartItem = await tx.cartItem.findUnique({
      where: { id: cartItemId },
    });

    if (!cartItem || cartItem.cartId !== cart.id) {
      throw new Error("Cart item not found");
    }

    await tx.cartItem.delete({
      where: { id: cartItemId },
    });

    return recalculateCartTotalTx(tx, cart.id);
  });
}

async function recalculateCartTotalTx(tx: any, cartId: string) {
  const items = await tx.cartItem.findMany({
    where: { cartId },
    select: {
      id: true,
      quantity: true,
      unitPriceCents: true,
    },
  });

  const totalCents = items.reduce((sum, item) => {
    return sum + item.unitPriceCents * item.quantity;
  }, 0);

  return tx.cart.update({
    where: { id: cartId },
    data: { totalCents },
    include: {
      items: true,
    },
  });
}

export function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatBagSize(size: BagSize) {
  switch (size) {
    case "oz12":
      return "12 oz";
    default:
      return size;
  }
}

export function formatGrindOption(grind: GrindOption) {
  switch (grind) {
    case "whole_bean":
      return "Whole bean";
    default:
      return grind;
  }
}