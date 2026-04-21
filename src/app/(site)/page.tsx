import RoastScheduleNotice from "@/components/RoastScheduleNotice";

export default function HomePage() {
  return (
    <section className="flex flex-1 flex-col justify-center py-8 md:py-10">
      <div className="ui-page-wide flex flex-col gap-10 md:flex-row md:items-start md:justify-around md:gap-16">
        <div className="md:w-[38%]">
          <div className="max-w-[420px]">
            <p className="font-display text-[64px] leading-[0.92] tracking-[-0.03em] sm:text-[88px] md:text-[120px] lg:text-[140px]">
              2fishes
            </p>

            <div className="mt-4">
              <p className="text-[26px] leading-none">coffee roasters</p>
              <p className="text-[26px] leading-none">sacramento, ca</p>
            </div>

            <RoastScheduleNotice variant="home" className="mt-8" />

            <div className="mt-16 text-[18px] leading-[1.1] tabular-nums md:mt-48">
              do not buy stuff! this website is a demo! (payments that go through stripe wont charge you but i get ur info so just dont :p)
            </div>
          </div>
        </div>

        <div className="flex md:w-[52%] md:justify-start md:pt-8">
          <div className="w-full max-w-[520px] md:max-w-[620px]">
            <div className="ui-surface-muted aspect-square">
              <img
                src="/homepage.avif"
                alt="The shadow of two fishes, the owners of the coffee roasting company"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
