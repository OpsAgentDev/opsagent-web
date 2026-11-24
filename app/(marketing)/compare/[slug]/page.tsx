import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompareView } from "@/components/marketing/CompareView";
import { COMPARE } from "@/lib/marketing/compare";
import "../../landing.css";

type Props = { params: Promise<{ slug: string }> };

// Only slugs in COMPARE exist; anything else is a 404 at build time and at request time.
export const dynamicParams = false;

export const generateStaticParams = () => COMPARE.map((c) => ({ slug: c.slug }));

async function entryFor({ params }: Props) {
  const { slug } = await params;
  const entry = COMPARE.find((c) => c.slug === slug);
  if (!entry) notFound();
  return entry;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { title, description } = await entryFor(props);
  return { title, description };
}

export default async function ComparePage(props: Props) {
  return <CompareView entry={await entryFor(props)} />;
}
