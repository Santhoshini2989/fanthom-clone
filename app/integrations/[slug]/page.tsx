import { notFound } from "next/navigation";
import { MarketingStubPage } from "@/components/marketing/stub-page";
import { INTEGRATIONS } from "@/data/marketing-pages";
export function generateStaticParams() { return Object.keys(INTEGRATIONS).map((slug) => ({ slug })); }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = INTEGRATIONS[slug];
  if (!c) notFound();
  return <MarketingStubPage {...c} />;
}
