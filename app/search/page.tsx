import { AppShell } from "@/components/layout/app-shell";
import { SearchResults } from "@/components/search/search-results";

export const metadata = { title: "Search – Fathom" };

/** Server page: reads ?q= and hands it to the client results (route is dynamic, no Suspense bailout). */
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  return (
    <AppShell tabs>
      <SearchResults key={q} q={q} />
    </AppShell>
  );
}
