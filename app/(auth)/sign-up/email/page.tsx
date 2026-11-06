import type { Metadata } from "next";
import { EmailForm } from "@/components/auth/email-form";

export const metadata: Metadata = { title: "Create your account · OpsAgent" };

export default async function SignUpEmail({ searchParams }: { searchParams: Promise<{ return_to?: string | string[] }> }) {
  const { return_to } = await searchParams;
  return (
    <main className="auth">
      <EmailForm mode="sign-up" returnTo={Array.isArray(return_to) ? return_to[0] : return_to} />
    </main>
  );
}
