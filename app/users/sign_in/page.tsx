"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Globe, Loader2 } from "lucide-react";
import { AuthButton, AuthLayout, GoogleG, MicrosoftLogo } from "@/components/auth/auth-layout";
import { Input } from "@/components/ui/input";

/**
 * Sign in (verified): "Sign in to Fathom" 30px/700, three 288×56 white
 * buttons (Google / Microsoft / SSO), "New to Fathom? Sign up", legal line.
 * OAuth is simulated: a short pending state then the app opens.
 */
export default function SignInPage() {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [sso, setSso] = useState(false);
  const [domain, setDomain] = useState("");
  const [error, setError] = useState<string | null>(null);

  const go = (provider: string) => {
    setPending(provider);
    window.setTimeout(() => router.push("/my_calls"), 900);
  };

  return (
    <AuthLayout>
      <h1 className="mt-2 text-center text-3xl font-bold text-off-white">Sign in to Fathom</h1>
      {sso ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain.trim())) {
              setError("Enter your company domain, e.g. acme.com");
              return;
            }
            setError(null);
            go("sso");
          }}
          className="mt-8 w-full max-w-[288px]"
        >
          <label className="mb-1.5 block text-sm text-off-white">Company domain</label>
          <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="acme.com" aria-invalid={!!error} className="h-12 bg-black/40" autoFocus />
          {error && <p className="mt-1.5 text-xs text-[#f87171]">{error}</p>}
          <button type="submit" disabled={!!pending} className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-white text-base font-medium text-black transition-colors hover:bg-[#f3f4f6] disabled:opacity-70">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Globe className="size-4" />} Continue with SSO
          </button>
          <button type="button" onClick={() => setSso(false)} className="mt-3 w-full text-center text-sm text-white/60 hover:text-white">
            Back
          </button>
        </form>
      ) : (
        <div className="mt-8 flex w-full max-w-[288px] flex-col gap-4">
          <AuthButton onClick={() => go("google")} pending={pending === "google"} icon={<GoogleG className="size-4" />}>
            Continue with Google
          </AuthButton>
          <AuthButton onClick={() => go("microsoft")} pending={pending === "microsoft"} icon={<MicrosoftLogo className="size-4" />}>
            Continue with Microsoft
          </AuthButton>
          <AuthButton onClick={() => setSso(true)} pending={false} icon={<Globe className="size-4" />}>
            Continue with SSO
          </AuthButton>
        </div>
      )}
      <p className="mt-9 text-sm text-off-white">
        New to Fathom?{" "}
        <Link href="/users/sign_up" className="text-fathom underline">
          Sign up
        </Link>
      </p>
      <p className="mt-auto pt-10 text-center text-xs text-white/40">
        By using Fathom, you agree to the{" "}
        <Link href="/terms" className="underline">Terms of Service</Link> and{" "}
        <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </AuthLayout>
  );
}
