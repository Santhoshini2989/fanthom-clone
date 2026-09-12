"use client";

import { Copy, Gift, Mail, Star } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ORG } from "@/data/users";
import { copyText } from "@/lib/utils";
import { useState } from "react";

/**
 * Referral program (verified: "Refer" in the top bar and a ★ points counter;
 * help center "Fathom Referral Program Guide"). Page layout NOT VERIFIED.
 */
export default function ReferPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const link = "https://fathom.video/invite/nancy-liang";
  const rewards = [
    { pts: 25, label: "Fathom swag" },
    { pts: 100, label: "3 months of Premium" },
    { pts: 250, label: "A year of Premium" },
  ];
  return (
    <AppShell>
      <div className="mx-auto max-w-[760px] px-4 py-12 sm:px-6">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-fathom-warn/15 text-fathom-warn"><Gift className="size-7" /></span>
          <div>
            <h1 className="text-[26px] font-semibold leading-8">Refer a friend, earn rewards</h1>
            <p className="text-[15px] text-white/60">Every teammate or friend who signs up with your link earns you points.</p>
          </div>
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-fathom-warn/15 px-3 py-1.5 text-[17px] font-bold text-fathom-warn">
            <Star className="size-4" fill="currentColor" strokeWidth={0} /> {ORG.referralPoints}
          </span>
        </div>

        <div className="mt-10 rounded-xl bg-app-card p-6">
          <h2 className="text-[15px] font-semibold">Your invite link</h2>
          <div className="mt-3 flex gap-2">
            <Input readOnly value={link} aria-label="Invite link" className="h-12 font-mono text-[14px]" />
            <Button variant="cyan" size="lg" onClick={async () => { await copyText(link); toast("Invite link copied"); }}><Copy className="size-4" /> Copy</Button>
          </div>
          <h2 className="mt-8 text-[15px] font-semibold">Invite by email</h2>
          <form onSubmit={(e) => { e.preventDefault(); if (email.trim()) { toast(`Invite sent to ${email.trim()}`); setEmail(""); } }} className="mt-3 flex gap-2">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="friend@company.com" aria-label="Email" className="h-12" />
            <Button variant="share" size="lg" type="submit" disabled={!email.trim()}><Mail className="size-4" /> Send</Button>
          </form>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {rewards.map((r) => (
            <div key={r.pts} className={`rounded-xl border p-5 ${ORG.referralPoints >= r.pts ? "border-fathom-warn/50 bg-fathom-warn/8" : "border-white/10 bg-app-card"}`}>
              <p className="flex items-center gap-1 text-[22px] font-bold text-fathom-warn"><Star className="size-4" fill="currentColor" strokeWidth={0} /> {r.pts}</p>
              <p className="mt-1 text-[15px] text-off-white">{r.label}</p>
              <p className="mt-2 text-[12px] text-white/50">{ORG.referralPoints >= r.pts ? "Unlocked" : `${r.pts - ORG.referralPoints} points to go`}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
