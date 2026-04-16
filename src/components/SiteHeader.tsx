import Link from "next/link";
import CartCountLink from "./CartCountLink";
import { auth, signOut } from "@/auth";

export default async function SiteHeader() {
  const session = await auth();

  return (
    <nav className="sticky p-4 top-0 z-50 bg-(--background) flex items-start justify-between">
      <Link
        href="/"
        className="font-display text-[16px] leading-none hover:underline"
      >
        2fishes
      </Link>

      <div className="flex items-center gap-8 text-[16px] md:gap-10">
        <Link href="/shop" className="hover:underline">
          Shop
        </Link>
        <Link href="/about" className="hover:underline">
          About
        </Link>

        {/* Admin link */}
        {session?.user?.isAdmin ? (
          <Link href="/admin" className="hover:underline">
            Admin
          </Link>
        ) : null}
      </div>

      <div className="flex items-center gap-2 text-[16px] md:gap-4">
        {/* Logout */}
        {session ? (
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button className="hover:underline cursor-pointer">
              Log out
            </button>
          </form>
        ) : null}
        <CartCountLink />
      </div>
    </nav>
  );
}