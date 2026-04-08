import Link from "next/link";
import RoastCountdown from "@/components/RoastCountdown";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] px-4 py-4 md:px-6 md:py-5">
      <div className="flex min-h-[calc(100vh-2rem)] flex-col">
        {/* Nav */}
        <nav className="flex items-start justify-between">
          <div>
            
          </div>
          <div className="flex items-center gap-8 text-[20px] md:gap-10">
            <Link href="/shop" className="hover:underline">
              Shop
            </Link>
            <Link href="/about" className="hover:underline">
              About
            </Link>
          </div>

          <Link href="/cart" className="pr-4 text-[20px] hover:underline">
            Cart
          </Link>
        </nav>

        {/* Hero */}
        <section className="flex flex-1 flex-col justify-center py-8 md:py-10">
          <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between md:gap-16">
            {/* Left side */}
            <div className="md:w-[38%] md:pl-8 lg:pl-12">
              <div className="max-w-[420px]">
                <p className="font-display text-[64px] leading-[0.92] tracking-[-0.03em] sm:text-[88px] md:text-[120px] lg:text-[140px]">
                  2fishes
                </p>

                <div className="mt-4 space-y-0">
                  <p className="text-[26px] leading-[1.0]">coffee roasters</p>
                  <p className="text-[26px] leading-[1.0]">sacramento, ca</p>
                </div>

                <div className="mt-4 text-[22px] leading-[1.1]">
                  <RoastCountdown />
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex md:w-[52%] md:justify-start">
              <div className="w-full max-w-[620px]">
                <div className="aspect-[1/1] bg-[#d8d0c4]" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}