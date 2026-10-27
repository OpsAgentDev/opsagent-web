import type { Metadata } from "next";
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
      <h1>Contact</h1>
      <p>Questions, security reports, partnerships. We reply to you by email.</p>
      <ContactForm initialTopic={initial} />
    </main>
  );
}
