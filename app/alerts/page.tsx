"use client";

import { useState } from "react";
import { Bell, Mail, MessageSquare, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LibraryPage } from "@/components/layout/library-page";
import { FathomSpinner } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PillSelect } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useAppStore, useHydrated } from "@/lib/store";
import { searchMeetings } from "@/lib/search";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

/**
 * Alerts: keyword alerts across My Calls / Team Calls (pricing page: "Keyword
 * alerts", "AI search alerts"). Layout NOT VERIFIED; behavior modeled on the
 * verified concept: a keyword, a scope, a notification channel, recent matches.
 */
export default function AlertsPage() {
  const hydrated = useHydrated();
  const alerts = useAppStore((s) => s.alerts);
  const meetings = useAppStore((s) => s.meetings);
  const createAlert = useAppStore((s) => s.createAlert);
  const deleteAlert = useAppStore((s) => s.deleteAlert);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [scope, setScope] = useState<"my_calls" | "team_calls">("team_calls");
  const [notify, setNotify] = useState<"email" | "slack">("email");
  const [selected, setSelected] = useState<string | null>(null);

  const current = alerts.find((a) => a.id === selected) ?? alerts[0];
  const matches = current ? searchMeetings(meetings, current.keyword, 20).filter((h) => h.kind === "transcript") : [];

  return (
    <AppShell tabs>
      <LibraryPage askMeetings={meetings} askLabel="Alerts">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-[15px] font-semibold">Alerts</h1>
          <Button variant="share" size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> New Alert
          </Button>
        </div>
        {!hydrated ? (
          <div className="flex h-64 items-center justify-center"><FathomSpinner /></div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <Bell className="mb-4 size-10 text-white/30" />
            <h2 className="text-lg font-semibold">No alerts yet</h2>
            <p className="mt-1 max-w-sm text-sm text-white/55">Get notified whenever a keyword like a competitor or a risk phrase comes up in your calls.</p>
            <Button className="mt-5" variant="share" onClick={() => setOpen(true)}>Create an alert</Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            <ul className="space-y-2">
              {alerts.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(a.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                      current?.id === a.id ? "border-fathom/50 bg-fathom/8" : "border-white/10 bg-app-card hover:border-white/20"
                    }`}
                  >
                    <span className="flex size-8 items-center justify-center rounded-full bg-white/8 text-white/70">
                      {a.notify === "slack" ? <MessageSquare className="size-4" /> : <Mail className="size-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">“{a.keyword}”</span>
                      <span className="block text-[12px] text-white/50">
                        {a.scope === "team_calls" ? "Team Calls" : "My Calls"} · {a.matchCount} match{a.matchCount === 1 ? "" : "es"}
                      </span>
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Delete alert"
                      onClick={(e) => { e.stopPropagation(); deleteAlert(a.id); toast("Alert deleted"); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); deleteAlert(a.id); } }}
                      className="rounded-md p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
                    >
                      <Trash2 className="size-4" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="rounded-xl border border-white/10 bg-app-card p-4">
              {current && (
                <>
                  <h2 className="text-[15px] font-semibold">Recent mentions of “{current.keyword}”</h2>
                  <p className="mb-4 text-[12px] text-white/50">Created {formatDate(current.createdAt)} · notifies via {current.notify === "slack" ? "Slack" : "email"}</p>
                  {matches.length === 0 ? (
                    <p className="text-sm text-white/55">No mentions yet. You’ll be notified as soon as this keyword comes up.</p>
                  ) : (
                    <ul className="divide-y divide-white/8">
                      {matches.map((h, i) =>
                        h.kind === "transcript" ? (
                          <li key={i} className="py-3">
                            <Link href={`/calls/${h.meeting.id}?t=${h.segment.start}&tab=transcript`} className="group block">
                              <p className="text-[14px] leading-5 text-white/85 group-hover:text-off-white">…{h.snippet}…</p>
                              <p className="mt-1 text-[12px] text-white/50">
                                {h.meeting.title} · {formatDate(h.meeting.startedAt)}
                              </p>
                            </Link>
                          </li>
                        ) : null,
                      )}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <Modal open={open} onClose={() => setOpen(false)} title="New Alert" width={480}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!keyword.trim()) return;
              createAlert({ keyword: keyword.trim(), scope, notify });
              toast(`Alert for “${keyword.trim()}” created`);
              setKeyword(""); setOpen(false);
            }}
            className="space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-white/70">Keyword or phrase</label>
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. competitor, cancel, pricing" />
            </div>
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-white/70">Watch</label>
                <PillSelect value={scope} onChange={setScope} align="start" options={[{ value: "my_calls", label: "My Calls" }, { value: "team_calls", label: "Team Calls" }]} />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-white/70">Notify via</label>
                <PillSelect value={notify} onChange={setNotify} align="start" options={[{ value: "email", label: "Email" }, { value: "slack", label: "Slack" }]} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="cyan" type="submit" disabled={!keyword.trim()}>Create Alert</Button>
            </div>
          </form>
        </Modal>
      </LibraryPage>
    </AppShell>
  );
}
