import RoastCountdown from "@/components/RoastCountdown";
import SiteShell from "@/components/SiteShell";

export default function HomePage() {
  return (
    <SiteShell>
      <section className="flex flex-1 flex-col justify-center py-8 md:py-10">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-around md:gap-16">
          <div className="md:w-[38%]">
            <div className="max-w-[420px]">
              <p className="font-display text-[64px] leading-[0.92] tracking-[-0.03em] sm:text-[88px] md:text-[120px] lg:text-[140px]">
                2fishes
              </p>

              <div className="mt-4">
                <p className="text-[26px] leading-[1.0]">coffee roasters</p>
                <p className="text-[26px] leading-[1.0]">sacramento, ca</p>
              </div>

              <div className="mt-4 text-[22px] leading-[1.1] tabular-nums">
                <RoastCountdown />
              </div>
            </div>
          </div>

          <div className="flex md:w-[52%] md:justify-start md:pt-8">
            <div className="w-full max-w-[620px]">
              <div className="aspect-square bg-[#d8d0c4]" />
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}