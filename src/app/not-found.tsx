import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mt-16 pb-24">
      <div className="ui-page-tight">
        <div className="max-w-[640px]">
          <h1 className="ui-body-tight">Page not found.</h1>
          <p className="ui-body-loose mt-8">
            The page you were looking for does not exist or is no longer
            available.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/" className="ui-button inline-block">
              Home
            </Link>
            <Link href="/shop" className="ui-button inline-block">
              Shop
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
