export const CART_CHANGED_EVENT = "cart:changed";

export function emitCartChanged(itemCount: number) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(CART_CHANGED_EVENT, {
      detail: { itemCount },
    })
  );
}