"use client";

import { useMemo, useState } from "react";
import { Building2, Check, ChevronDown, Globe, Link2, Lock, Mail, Search, X } from "lucide-react";
import type { AccessRole, Meeting, ShareAccess } from "@/data/types";
import { ORG, TEAMS, USERS, userById } from "@/data/users";
import { useAppStore } from "@/lib/store";
import { cn, copyText } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

/**
 * "Share Recording" modal (verified): search "Add teams, users, and emails",
 * PEOPLE WITH ACCESS list (name / email, role Owner · Standard · Limited ·
 * Admin ⌄ with descriptions, Remove), footer with the link-access dropdown
 * (Anyone with the link · Anyone @domain · Only people added) and "Copy Link".
 * Adding an email switches to the email variant (chip + Admin ⌄, note,
 * Cancel / Share Recording).
 */
export function ShareModal({ open, onClose, meeting }: { open: boolean; onClose: () => void; meeting: Meeting }) {
  const setShareAccess = useAppStore((s) => s.setShareAccess);
  const addShare = useAppStore((s) => s.addShare);
  const setShareRole = useAppStore((s) => s.setShareRole);
  const removeShare = useAppStore((s) => s.removeShare);
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [pending, setPending] = useState<{ label: string; target: string; kind: "user" | "team" | "email"; sublabel: string }[]>([]);
  const [pendingRole, setPendingRole] = useState<AccessRole>("standard");

  const suggestions = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const taken = new Set([...meeting.shares.map((s) => s.target), ...pending.map((p) => p.target)]);
    const users = USERS.filter((u) => !taken.has(u.id) && (u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))).slice(0, 4);
    const teams = TEAMS.filter((t) => !taken.has(t.id) && t.name.toLowerCase().includes(term));
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(term);
    return [
      ...teams.map((t) => ({ kind: "team" as const, target: t.id, label: t.name, sublabel: `${t.memberIds.length} people` })),
      ...users.map((u) => ({ kind: "user" as const, target: u.id, label: u.name, sublabel: u.email })),
      ...(isEmail && !taken.has(term) ? [{ kind: "email" as const, target: term, label: term, sublabel: term }] : []),
    ];
  }, [q, meeting.shares, pending]);

  const access = meeting.shareAccess;
  const accessLabel: Record<ShareAccess, { label: string; icon: React.ReactNode }> = {
    link: { label: "Anyone with the link can view", icon: <Globe /> },
    domain: { label: `Anyone @${ORG.domain} can view`, icon: <Building2 /> },
    added: { label: "Only people added can view", icon: <Lock /> },
  };

  const roleMeta: Record<AccessRole, { label: string; desc: string }> = {
    owner: { label: "Owner", desc: "" },
    limited: { label: "Limited", desc: "No access to highlights or comments" },
    standard: { label: "Standard", desc: "Access to all content. Can add comments, highlights, or action items" },
    admin: { label: "Admin", desc: "Can share with others, trim meeting, edit the transcript" },
  };

  const close = () => {
    setQ("");
    setPending([]);
    onClose();
  };

  const emailMode = pending.length > 0;

  return (
    <Modal
      open={open}
      onClose={close}
      title="Share Recording"
      width={620}
      footer={
        emailMode ? (
          <div className="flex w-full justify-end gap-2">
            <Button size="lg" className="text-[17px]" onClick={() => setPending([])}>Cancel</Button>
            <Button
              variant="cyan"
              size="lg"
              className="text-[17px] font-semibold"
              onClick={() => {
                for (const p of pending) addShare(meeting.id, { ...p, role: pendingRole });
                toast(`Shared with ${pending.length} ${pending.length === 1 ? "person" : "people"}`);
                setPending([]);
              }}
            >
              Share Recording
            </Button>
          </div>
        ) : (
          <>
            <Dropdown>
              <DropdownTrigger>
                <span className="flex items-center gap-2 rounded-md px-1 py-1 text-[15px] font-medium text-fathom hover:bg-white/5 [&_svg]:size-4">
                  {accessLabel[access].icon}
                  {accessLabel[access].label}
                  <ChevronDown className="size-4" />
                </span>
              </DropdownTrigger>
              <DropdownContent align="start" side="top" width={340} className="p-2">
                {(Object.keys(accessLabel) as ShareAccess[]).map((k) => (
                  <DropdownItem key={k} icon={accessLabel[k].icon} onSelect={() => setShareAccess(meeting.id, k)} className="py-2.5 text-[16px]">
                    <span className="flex items-center gap-3">
                      {accessLabel[k].label}
                      {k === access && <Check className="size-4 text-emerald-400" strokeWidth={2.5} />}
                    </span>
                  </DropdownItem>
                ))}
              </DropdownContent>
            </Dropdown>
            <Button
              variant="outline-cyan"
              size="lg"
              className="text-[17px]"
              onClick={async () => {
                await copyText(`${location.origin}/share/${meeting.id}`);
                toast("Link copied to clipboard");
              }}
            >
              <Link2 className="size-4" /> Copy Link
            </Button>
          </>
        )
      }
    >
      {/* search / chips */}
      <div className="relative">
        <div className="flex min-h-14 flex-wrap items-center gap-2 rounded-lg bg-app-card px-4 py-2">
          <Search className="size-5 shrink-0 text-white/60" />
          {pending.map((p) => (
            <span key={p.target} className="flex items-center gap-1.5 rounded-full bg-[#3b3b40] py-1 pl-3 pr-1.5 text-[17px] text-off-white">
              {p.label}
              <button type="button" aria-label={`Remove ${p.label}`} onClick={() => setPending((x) => x.filter((y) => y.target !== p.target))} className="rounded-full p-0.5 hover:bg-white/10">
                <X className="size-4" />
              </button>
            </span>
          ))}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && suggestions[0]) {
                setPending((p) => [...p, suggestions[0]!]);
                setQ("");
              }
              if (e.key === "Backspace" && !q && pending.length) setPending((p) => p.slice(0, -1));
            }}
            placeholder={pending.length ? "" : "Add teams, users, and emails"}
            aria-label="Add teams, users, and emails"
            className="h-8 min-w-[160px] flex-1 bg-transparent text-[19px] text-off-white placeholder:text-white/45 outline-none"
          />
          {emailMode && (
            <Dropdown>
              <DropdownTrigger>
                <span className="flex items-center gap-1 text-[17px] text-white/80 hover:text-white">
                  {roleMeta[pendingRole].label} <ChevronDown className="size-4" />
                </span>
              </DropdownTrigger>
              <DropdownContent align="end" width={380} className="p-2">
                {(["limited", "standard", "admin"] as AccessRole[]).map((r) => (
                  <DropdownItem key={r} onSelect={() => setPendingRole(r)} description={roleMeta[r].desc} className="py-2.5 text-[17px]">
                    <span className="flex items-center gap-3">{roleMeta[r].label}{r === pendingRole && <Check className="size-4 text-emerald-400" />}</span>
                  </DropdownItem>
                ))}
              </DropdownContent>
            </Dropdown>
          )}
        </div>
        {suggestions.length > 0 && (
          <div className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-white/10 bg-app-menu shadow-xl animate-pop-in">
            {suggestions.map((s) => (
              <button
                key={s.target}
                type="button"
                onClick={() => {
                  setPending((p) => [...p, s]);
                  setQ("");
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-app-menu-hover"
              >
                {s.kind === "user" ? (
                  <Avatar user={userById(s.target)} size="sm" />
                ) : s.kind === "team" ? (
                  <span className="flex size-6 items-center justify-center rounded-full bg-white/10"><Building2 className="size-3.5" /></span>
                ) : (
                  <span className="flex size-6 items-center justify-center rounded-full bg-white/10"><Mail className="size-3.5" /></span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-[15px] text-off-white">{s.label}</span>
                  <span className="block truncate text-[12px] text-white/50">{s.sublabel}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {emailMode ? (
        <p className="mt-6 text-[17px] italic leading-7 text-white/85">
          Individuals will be emailed the enhanced summary and the link to this recording
        </p>
      ) : (
        <>
          <h3 className="mb-2 mt-6 text-[13px] font-bold uppercase tracking-wide text-white/55">People with access</h3>
          <ul className="divide-y divide-white/10">
            {meeting.shares.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[19px] font-semibold leading-6 text-off-white">{s.label}</p>
                  <p className="truncate text-[16px] leading-6 text-white/55">{s.sublabel || (s.kind === "team" ? "0 people" : "")}</p>
                </div>
                {s.role === "owner" ? (
                  <span className="text-[17px] text-white/70">Owner</span>
                ) : (
                  <Dropdown>
                    <DropdownTrigger>
                      <span className="flex items-center gap-1 text-[17px] text-white/80 hover:text-white">
                        {roleMeta[s.role].label} <ChevronDown className="size-4" />
                      </span>
                    </DropdownTrigger>
                    <DropdownContent align="end" width={400} className="p-2">
                      {(["limited", "standard", "admin"] as AccessRole[]).map((r) => (
                        <DropdownItem key={r} onSelect={() => setShareRole(meeting.id, s.id, r)} description={roleMeta[r].desc} className="py-2.5 text-[19px]">
                          <span className="flex items-center gap-3">
                            {roleMeta[r].label}
                            {r === s.role && <Check className="size-4 text-emerald-400" strokeWidth={2.5} />}
                          </span>
                        </DropdownItem>
                      ))}
                      <DropdownSeparator />
                      <DropdownItem destructive className="py-2.5 text-[19px]" onSelect={() => { removeShare(meeting.id, s.id); toast(`Removed ${s.label}`); }}>
                        Remove
                      </DropdownItem>
                    </DropdownContent>
                  </Dropdown>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      <span className={cn("hidden")} />
    </Modal>
  );
}
