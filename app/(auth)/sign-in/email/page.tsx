import type { Metadata } from "next";
import { EmailForm } from "@/components/auth/email-form";

export const metadata: Metadata = { title: "Sign in with email · OpsAgent" };

export default async function SignInEmail({ searchParams }: { searchParams: Promise<{ return_to?: string | string[] }> }) {
  const { return_to } = await searchParams;
  return (
    <main className="auth">
      <EmailForm mode="sign-in" returnTo={Array.isArray(return_to) ? return_to[0] : return_to} />
    </main>
  );
}
