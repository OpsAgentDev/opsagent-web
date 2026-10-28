import type { Metadata } from "next";
import { AuthOptions } from "@/components/auth/auth-options";

export const metadata: Metadata = { title: "Sign in · OpsAgent" };

type Search = Promise<{ return_to?: string | string[]; error?: string | string[] }>;
const one = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

export default async function SignIn({ searchParams }: { searchParams: Search }) {
  const q = await searchParams;
  return (
    <main className="auth">
      <AuthOptions mode="sign-in" returnTo={one(q.return_to)} error={one(q.error)} />
    </main>
  );
}
