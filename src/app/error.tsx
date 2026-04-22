"use client";

import { useEffect } from "react";
import Link from "next/link";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mt-16 pb-24">
      <div className="ui-page-tight">
        <div className="max-w-[680px]">
          <h1 className="ui-body-tight">Something went wrong.</h1>
          <p className="ui-body-loose mt-8">
            The page could not be loaded. You can try again or return to the
            main shop flow.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <button type="button" onClick={reset} className="ui-button">
              Try again
            </button>
            <Link href="/shop" className="ui-button inline-block">
              Go to shop
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
