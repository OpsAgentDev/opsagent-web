import type { Metadata } from "next";
import { AuthOptions } from "@/components/auth/auth-options";
import { PasskeyButton } from "@/components/auth/passkey-button";

export const metadata: Metadata = { title: "Sign in · OpsAgent" };

type Search = Promise<{ return_to?: string | string[]; error?: string | string[] }>;
const one = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

export default async function SignIn({ searchParams }: { searchParams: Search }) {
  const q = await searchParams;
  const returnTo = one(q.return_to);
  return (
    <main className="auth">
      <AuthOptions mode="sign-in" returnTo={returnTo} error={one(q.error)} passkeySlot={<PasskeyButton returnTo={returnTo} />} />
    </main>
  );
}
