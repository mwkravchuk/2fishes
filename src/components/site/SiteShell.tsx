import { ReactNode } from "react";
import SiteHeader from "@/components/site/SiteHeader";

type SiteShellProps = {
  children: ReactNode;
};

export default function SiteShell({ children }: SiteShellProps) {
  return (
    <main className="min-h-screen bg-(--background) text-(--foreground)">
      <div className="flex min-h-[calc(100vh-2rem)] flex-col">
        <SiteHeader />
        {children}
      </div>
    </main>
  );
}
