import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

function getAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;

      if (!pathname.startsWith("/admin")) return true;

      const email = auth?.user?.email?.toLowerCase();
      if (!email) return false;

      return getAdminEmails().has(email);
    },
    jwt({ token, user }) {
      const email = (user?.email ?? token.email ?? "").toLowerCase();
      token.isAdmin = getAdminEmails().has(email);
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
});