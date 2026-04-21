import SiteHeaderClient from "./SiteHeaderClient";
import { auth, signOut } from "@/auth";

export default async function SiteHeader() {
  const session = await auth();

  async function logoutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <SiteHeaderClient
      isAdmin={Boolean(session?.user?.isAdmin)}
      isLoggedIn={Boolean(session)}
      logoutAction={session ? logoutAction : undefined}
    />
  );
}
