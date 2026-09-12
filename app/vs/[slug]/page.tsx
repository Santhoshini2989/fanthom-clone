import { notFound } from "next/navigation";
import { MarketingStubPage } from "@/components/marketing/stub-page";
import { VS } from "@/data/marketing-pages";
export function generateStaticParams() { return Object.keys(VS).map((slug) => ({ slug })); }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = VS[slug];
  if (!c) notFound();
  return <MarketingStubPage {...c} />;
}
