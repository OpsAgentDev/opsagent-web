import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProblemView } from "@/components/marketing/ProblemView";
import { PROBLEMS } from "@/lib/marketing/problems";
import "../../landing.css";

type Props = { params: Promise<{ slug: string }> };

// Only slugs in PROBLEMS exist; anything else is a 404 at build time and at request time.
export const dynamicParams = false;

export const generateStaticParams = () => PROBLEMS.map((p) => ({ slug: p.slug }));

async function entryFor({ params }: Props) {
  const { slug } = await params;
  const entry = PROBLEMS.find((p) => p.slug === slug);
  if (!entry) notFound();
  return entry;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { title, description } = await entryFor(props);
  return { title, description };
}

export default async function ProblemPage(props: Props) {
  return <ProblemView entry={await entryFor(props)} />;
}
