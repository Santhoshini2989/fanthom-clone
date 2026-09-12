"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Calendar, Check, ChevronRight, Loader2, Video } from "lucide-react";
import { AuthButton, AuthLayout, GoogleG, MicrosoftLogo } from "@/components/auth/auth-layout";
import { cn } from "@/lib/utils";

type Step = "signup" | "calendar" | "personalize" | "apps" | "done";

/**
 * Sign up (verified): 🚀, "Sign up for Fathom", "Connect your work email to
 * get started in minutes", Google / Microsoft, "Already have a Fathom account?
 * Sign in". The onboarding steps after it follow the Quick Start guide:
 * connect calendar → personalize → get the apps (NOT VERIFIED visually).
 */
export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("signup");
  const [pending, setPending] = useState<string | null>(null);
  const [provider, setProvider] = useState<"google" | "microsoft">("google");
  const [role, setRole] = useState<string | null>(null);
  const [crm, setCrm] = useState<string | null>(null);

  const go = (p: "google" | "microsoft") => {
    setPending(p);
    setProvider(p);
    window.setTimeout(() => {
      setPending(null);
      setStep("calendar");
    }, 900);
  };

  return (
    <AuthLayout>
      {step === "signup" && (
        <>
          <span className="text-[44px] leading-none" aria-hidden>🚀</span>
          <h1 className="mt-4 text-center text-3xl font-bold text-off-white">Sign up for Fathom</h1>
          <p className="mt-8 text-center text-sm text-off-white">Connect your work email to get started in minutes</p>
          <div className="mt-8 flex w-full max-w-[288px] flex-col gap-4">
            <AuthButton onClick={() => go("google")} pending={pending === "google"} icon={<GoogleG className="size-4" />}>Continue with Google</AuthButton>
            <AuthButton onClick={() => go("microsoft")} pending={pending === "microsoft"} icon={<MicrosoftLogo className="size-4" />}>Continue with Microsoft</AuthButton>
          </div>
          <p className="mt-9 text-sm text-off-white">
            Already have a Fathom account?{" "}
            <Link href="/users/sign_in" className="text-fathom underline">Sign in</Link>
          </p>
          <p className="mt-auto pt-10 text-center text-xs text-white/40">
            By using Fathom, you agree to the <Link href="/terms" className="underline">Terms of Service</Link> and{" "}
            <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </>
      )}

      {step === "calendar" && (
        <>
          <Steps current={1} />
          <Calendar className="mt-6 size-9 text-fathom" />
          <h1 className="mt-4 text-center text-[26px] font-bold leading-8 text-off-white">Connect your calendar</h1>
          <p className="mt-3 text-center text-sm leading-5 text-white/70">
            Fathom uses your calendar to join meetings automatically and take notes, so you never have to remember to start recording.
          </p>
          <div className="mt-8 w-full max-w-[288px]">
            <AuthButton
              onClick={() => {
                setPending("cal");
                window.setTimeout(() => { setPending(null); setStep("personalize"); }, 900);
              }}
              pending={pending === "cal"}
              icon={provider === "google" ? <GoogleG className="size-4" /> : <MicrosoftLogo className="size-4" />}
            >
              Connect {provider === "google" ? "Google" : "Microsoft"} Calendar
            </AuthButton>
            <button type="button" onClick={() => setStep("personalize")} className="mt-3 w-full text-center text-sm text-white/55 hover:text-white">
              Skip for now
            </button>
          </div>
          <p className="mt-auto pt-10 text-center text-xs text-white/40">Fathom only reads meeting times and links. It never sends invites on your behalf.</p>
        </>
      )}

      {step === "personalize" && (
        <>
          <Steps current={2} />
          <h1 className="mt-6 text-center text-[26px] font-bold leading-8 text-off-white">Personalize your account</h1>
          <p className="mt-3 text-center text-sm leading-5 text-white/70">Tell us how you work so summaries and templates match your meetings.</p>
          <div className="mt-6 w-full">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">What best describes your role?</p>
            <div className="grid grid-cols-2 gap-2">
              {["Sales", "Customer Success", "Marketing", "Product & Engineering", "Operations", "HR & Talent"].map((r) => (
                <Choice key={r} selected={role === r} onClick={() => setRole(r)}>{r}</Choice>
              ))}
            </div>
            <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-white/50">Which CRM do you use?</p>
            <div className="grid grid-cols-2 gap-2">
              {["HubSpot", "Salesforce", "Close", "None"].map((c) => (
                <Choice key={c} selected={crm === c} onClick={() => setCrm(c)}>{c}</Choice>
              ))}
            </div>
          </div>
          <button
            type="button"
            disabled={!role}
            onClick={() => setStep("apps")}
            className="mt-8 flex h-12 w-full max-w-[288px] items-center justify-center gap-2 rounded-lg bg-fathom text-base font-semibold text-black transition-[filter] hover:brightness-110 disabled:opacity-40"
          >
            Continue <ChevronRight className="size-4" />
          </button>
        </>
      )}

      {step === "apps" && (
        <>
          <Steps current={3} />
          <Video className="mt-6 size-9 text-fathom" />
          <h1 className="mt-4 text-center text-[26px] font-bold leading-8 text-off-white">Get the desktop app</h1>
          <p className="mt-3 text-center text-sm leading-5 text-white/70">
            The desktop app records bot-free, shows live summaries during your calls, and alerts you when a meeting starts.
          </p>
          <div className="mt-8 w-full max-w-[288px] space-y-3">
            <button
              type="button"
              onClick={() => {
                setPending("dl");
                window.setTimeout(() => { setPending(null); setStep("done"); }, 900);
              }}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-white text-base font-medium text-black hover:bg-[#f3f4f6]"
            >
              {pending === "dl" ? <Loader2 className="size-4 animate-spin" /> : null} Download for Mac
            </button>
            <button type="button" onClick={() => setStep("done")} className="w-full text-center text-sm text-white/55 hover:text-white">
              I’ll do this later
            </button>
          </div>
        </>
      )}

      {step === "done" && (
        <>
          <span className="flex size-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <Check className="size-7" strokeWidth={3} />
          </span>
          <h1 className="mt-5 text-center text-[26px] font-bold leading-8 text-off-white">You’re all set</h1>
          <p className="mt-3 text-center text-sm leading-5 text-white/70">
            Fathom will join your next meeting. Try a test call from your profile menu to see it in action.
          </p>
          <button
            type="button"
            onClick={() => router.push("/my_calls")}
            className="mt-8 flex h-12 w-full max-w-[288px] items-center justify-center rounded-lg bg-fathom text-base font-semibold text-black hover:brightness-110"
          >
            Go to My Calls
          </button>
        </>
      )}
    </AuthLayout>
  );
}

function Steps({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${current} of 3`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={cn("h-1.5 w-10 rounded-full transition-colors", i <= current ? "bg-fathom" : "bg-white/15")} />
      ))}
    </div>
  );
}

function Choice({ children, selected, onClick }: { children: React.ReactNode; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "h-11 rounded-lg border px-3 text-sm font-medium transition-colors",
        selected ? "border-fathom bg-fathom/10 text-fathom" : "border-white/15 bg-black/30 text-off-white hover:border-white/35",
      )}
    >
      {children}
    </button>
  );
}
