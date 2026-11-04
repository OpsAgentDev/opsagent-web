import type { Metadata } from "next";
import Link from "next/link";
import { MailIcon, ShieldIcon } from "@/components/marketing/landing-icons";
import { ContactForm } from "@/components/marketing/ContactForm";
import { TOPICS } from "@/components/marketing/contactTopics";

export const metadata: Metadata = {
  title: "Contact · OpsAgent",
  description: "Send the OpsAgent team a message. We reply by email.",
};

export default async function Contact({ searchParams }: { searchParams: Promise<{ topic?: string | string[] }> }) {
  const { topic } = await searchParams;
  const t = Array.isArray(topic) ? topic[0] : topic;
  const initial = TOPICS.find((x) => x.value === t)?.value ?? "general";
  return (
    <main className="page">
      <h1>Talk to us</h1>
      <p>Questions, security reports, partnerships. We reply to you by email.</p>
      <div className="contact-grid">
        <ContactForm initialTopic={initial} />
        <ul className="contact-card">
          <li>
            <span className="ico"><MailIcon /></span>
            <p><strong>We reply by email</strong></p>
          </li>
          <li>
            <span className="ico"><ShieldIcon /></span>
            <p>
              <strong>Security reports: choose Security as the topic</strong>
              <Link href="/security">Security page</Link>
            </p>
          </li>
        </ul>
      </div>
    </main>
  );
}
