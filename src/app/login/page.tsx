import { signIn } from "../../auth";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/admin" });
        }}
        className="max-w-[480px] px-6 text-center"
      >
        <h1 className="text-[28px] leading-none">sign in (only useful for admins!)</h1>

        <button
          type="submit"
          className="mt-8 border border-black px-5 py-3.5 text-[18px] leading-none cursor-pointer hover:underline"
        >
          Continue with Google
        </button>
      </form>
    </div>
  );
}