import type { Metadata } from "next";
import { AuthOptions } from "@/components/auth/auth-options";

export const metadata: Metadata = { title: "Create your account · OpsAgent" };

export default async function SignUp({ searchParams }: { searchParams: Promise<{ return_to?: string | string[] }> }) {
  const { return_to } = await searchParams;
  return (
    <main className="auth">
      <AuthOptions mode="sign-up" returnTo={Array.isArray(return_to) ? return_to[0] : return_to} />
    </main>
  );
}
