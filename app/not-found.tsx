import Link from "next/link";
import { FathomWordmark } from "@/components/brand/logo";
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black px-6 text-center text-off-white">
      <FathomWordmark />
      <h1 className="text-[32px] font-light tracking-tight">Lost in space</h1>
      <p className="max-w-sm text-white/60">That page doesn’t exist. Head back to your calls or the home page.</p>
      <div className="flex gap-3">
        <Link href="/my_calls" className="rounded-full bg-fathom px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-black">My Calls</Link>
        <Link href="/" className="rounded-full border border-white/30 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide">Home</Link>
      </div>
    </div>
  );
}
