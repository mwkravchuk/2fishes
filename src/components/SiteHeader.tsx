import Link from "next/link";

export default function SiteHeader() {
  return (
    <nav className="sticky p-4 top-0 z-50 bg-(--background) flex items-start justify-between">
      <Link href="/" className="text-[16px] leading-none hover:underline">
        2fishes
      </Link>

      <div className="flex items-center gap-8 text-[16px] md:gap-10">
        <Link href="/shop" className="hover:underline">
          Shop
        </Link>
        <Link href="/about" className="hover:underline">
          About
        </Link>
      </div>

      <Link href="/cart" className="pr-4 text-[16px] hover:underline">
        Cart
      </Link>
    </nav>
  );
};