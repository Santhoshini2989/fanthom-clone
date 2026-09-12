"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Calendar, Lock, Users } from "lucide-react";
import { FathomWordmark } from "@/components/brand/logo";
import { CallView } from "@/components/meetings/call-view";
import { NotFoundState, ProcessingState } from "@/components/meetings/call-states";
import { FathomSpinner } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAppStore, useHydrated } from "@/lib/store";
import { userById } from "@/data/users";
import { formatDate, formatDurationShort } from "@/lib/utils";
import { PlatformIcon, PLATFORM_LABEL } from "@/components/meetings/platform-icon";

/**
 * Public share view (verified: recipients without an account can view the
 * recording, transcript and questions; "Limited" access hides highlights and
 * comments; "Ask the owner to upgrade your access to view sharing details").
 * Rendered as a non-participant would see it: no team nav, a sign-up nudge.
 */
export default function SharePage() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const meeting = useAppStore((s) => s.meetings.find((m) => m.id === id));
  const limited = true; // recipients who are not attendees get Limited access by default

  return (
    <div className="min-h-screen bg-app-bg text-off-white">
      <header className="sticky top-0 z-50 flex h-12 items-center justify-between border-b border-black/40 bg-app-topbar px-4">
        <Link href="/" aria-label="Fathom">
          <FathomWordmark textClassName="text-[17px]" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden text-[13px] text-white/55 sm:inline">Shared with you via Fathom</span>
          <Link href="/users/sign_up">
            <Button variant="primary" size="sm" className="rounded-full px-4 text-[12px] font-semibold uppercase tracking-wide">
              Get Fathom – Free
            </Button>
          </Link>
        </div>
      </header>

      {!hydrated ? (
        <div className="flex h-[60vh] items-center justify-center"><FathomSpinner /></div>
      ) : !meeting ? (
        <NotFoundState />
      ) : meeting.status !== "ready" ? (
        <ProcessingState meeting={meeting} />
      ) : (
        <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><FathomSpinner /></div>}>
          <CallView
            meeting={limited ? { ...meeting, highlights: [], comments: [] } : meeting}
            readOnly
            sidebar={({ seek }) => (
              <aside className="flex flex-col gap-6">
                <div>
                  <h1 className="text-[21px] font-semibold leading-7">{meeting.title}</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-white/55">
                    <span className="flex items-center gap-1.5"><Calendar className="size-3.5" /> {formatDate(meeting.startedAt)}</span>
                    <span className="flex items-center gap-1.5"><PlatformIcon platform={meeting.platform} className="size-3.5" /> {PLATFORM_LABEL[meeting.platform]} · {formatDurationShort(meeting.duration)}</span>
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-app-card px-4 py-3 text-[13px] leading-5 text-white/70">
                  <p className="flex items-center gap-2 font-semibold text-off-white"><Lock className="size-3.5 text-fathom-warn" /> Limited access</p>
                  <p className="mt-1">You can view the transcript, summary and recording. Ask the owner to upgrade your access to view highlights, comments and sharing details.</p>
                </div>
                <section>
                  <h2 className="mb-2 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-white/55"><Users className="size-3.5" /> Attendees</h2>
                  <ul className="space-y-2">
                    {meeting.attendeeIds.map((uid) => {
                      const u = userById(uid);
                      return (
                        <li key={uid} className="flex items-center gap-2.5 text-[14px]">
                          <Avatar user={u} size="sm" /> {u.name}
                          {uid === meeting.ownerId && <span className="text-[11px] text-white/45">Host</span>}
                        </li>
                      );
                    })}
                  </ul>
                </section>
                {meeting.questions.length > 0 && (
                  <section>
                    <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-white/55">Questions</h2>
                    <ul className="space-y-1.5">
                      {meeting.questions.map((q) => (
                        <li key={q.id}>
                          <button type="button" onClick={() => seek(q.at)} className="flex w-full items-start gap-2 rounded-md py-1 text-left hover:bg-white/[0.04]">
                            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-white/40 text-[10px] text-white/70">?</span>
                            <span className="text-[14px] leading-5 text-white/80">“{q.text}”</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                <div className="rounded-xl border border-fathom/30 bg-gradient-to-br from-fathom/10 to-brand-purple/10 p-4">
                  <p className="text-[15px] font-semibold">Never take notes again</p>
                  <p className="mt-1 text-[13px] leading-5 text-white/65">Fathom records, transcribes and summarizes your meetings. Free forever for individuals.</p>
                  <Link href="/users/sign_up" className="mt-3 inline-block">
                    <Button variant="primary" size="sm" className="rounded-full px-4 text-[12px] font-semibold uppercase tracking-wide">Get started – free</Button>
                  </Link>
                </div>
              </aside>
            )}
          />
        </Suspense>
      )}
    </div>
  );
}
