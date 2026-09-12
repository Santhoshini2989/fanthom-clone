"use client";

import { useState } from "react";
import {
  BookA,
  Bot,
  CalendarClock,
  ChevronDown,
  Download,
  FileCheck2,
  FilePenLine,
  Link2,
  Lock,
  LockOpen,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  Video,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { ORG, TEAMS, USERS, userById } from "@/data/users";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PillSelect } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { IntegrationStatus, SettingCard, SettingRow, SettingSection } from "./primitives";
import { cn } from "@/lib/utils";

type Capture = "on" | "off" | "optional";
const CAPTURE_OPTIONS = [
  { value: "on" as Capture, label: "On", dot: "on" as const },
  { value: "off" as Capture, label: "Off", dot: "off" as const },
  { value: "optional" as Capture, label: "Optional" },
];
const VIS_OPTIONS = ["All Teams", "User's Team", "Private (No teams)", "User Choose"].map((v) => ({ value: v, label: v }));

/** Organization Settings tab (verified sections: RECORDING · ACCESS CONTROLS · INTEGRATIONS · COMPLIANCE). */
export function OrganizationSettings() {
  const s = useAppStore((x) => x.settings);
  const update = useAppStore((x) => x.updateSettings);
  const { toast } = useToast();
  const [dict, setDict] = useState<string[]>(["Brightline", "Northwind", "MEDDPICC", "SLA"]);
  const [term, setTerm] = useState("");
  const [lock, setLock] = useState<Record<string, 0 | 1 | 2>>({ external: 1, internal: 0, unscheduled: 2 });

  const setCapture = (k: keyof typeof s.orgAutoCapture, v: Capture) => update({ orgAutoCapture: { ...s.orgAutoCapture, [k]: v } });
  const setVis = (k: keyof typeof s.orgVisibility, v: string) => update({ orgVisibility: { ...s.orgVisibility, [k]: v } });
  const LockIcon = ({ k }: { k: string }) => {
    const l = lock[k] ?? 0;
    const labels = ["Users can change to any visibility", "Users cannot modify visibility", "Users have limited flexibility"];
    return (
      <Tooltip label={labels[l]!}>
        <button type="button" aria-label={labels[l]} onClick={() => setLock((x) => ({ ...x, [k]: ((l + 1) % 3) as 0 | 1 | 2 }))} className={cn("rounded p-1", l === 0 ? "text-white/40" : l === 1 ? "text-white" : "text-fathom")}>
          {l === 0 ? <LockOpen className="size-4" /> : <Lock className="size-4" />}
        </button>
      </Tooltip>
    );
  };

  return (
    <div>
      <SettingSection title="Recording">
        <SettingCard icon={<Video />} title="Auto-Capture Meetings" description={<span>Team-specific settings available on <button type="button" className="underline">Team Settings</button></span>}>
          <SettingRow label="External Meetings" control={<PillSelect value={s.orgAutoCapture.external} onChange={(v) => setCapture("external", v)} options={CAPTURE_OPTIONS} className="h-11 text-[17px]" />} />
          <SettingRow label="Internal Meetings" control={<PillSelect value={s.orgAutoCapture.internal} onChange={(v) => setCapture("internal", v)} options={CAPTURE_OPTIONS} className="h-11 text-[17px]" />} />
          <SettingRow label="Unscheduled Meetings" control={<PillSelect value={s.orgAutoCapture.unscheduled} onChange={(v) => setCapture("unscheduled", v)} options={CAPTURE_OPTIONS} className="h-11 text-[17px]" />} />
        </SettingCard>
        <SettingCard icon={<Bot />} title="Single Bot per Meeting" description="Prevent multiple Fathom notetakers from joining the same meeting." control={<Toggle checked={s.singleBot} onChange={(v) => update({ singleBot: v })} />} />
        <SettingCard icon={<Bot />} title="Bot Name" description={<span>Use <code className="rounded bg-black/40 px-1 font-mono text-[13px]">{"{name}"}</code> to include the user&apos;s name, e.g. “{"{name}"}&apos;s Notetaker”.</span>}>
          <div className="flex gap-2">
            <Input defaultValue="{name}'s Notetaker" aria-label="Organization bot name" className="h-12 text-[17px]" />
            <Button size="lg" onClick={() => toast("Bot name saved")}>Save</Button>
            <Button size="lg" variant="ghost" onClick={() => toast("Reverted to default")}>Revert to Default</Button>
          </div>
        </SettingCard>
        <SettingCard icon={<BookA />} title="Transcription Dictionary" description="Add company-specific terms and acronyms so transcripts spell them correctly.">
          <div className="flex flex-wrap gap-2">
            {dict.map((d) => (
              <span key={d} className="flex items-center gap-1.5 rounded-full bg-[#35353c] py-1 pl-3 pr-1.5 text-[15px]">
                {d}
                <button type="button" aria-label={`Remove ${d}`} onClick={() => setDict((x) => x.filter((y) => y !== d))} className="rounded-full p-0.5 text-white/60 hover:bg-white/10 hover:text-white">×</button>
              </span>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (term.trim() && !dict.includes(term.trim())) { setDict((x) => [...x, term.trim()]); setTerm(""); toast("Term added"); } }} className="mt-3 flex gap-2">
            <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Add a term" aria-label="Dictionary term" className="h-11" />
            <Button type="submit" variant="share" disabled={!term.trim()}><Plus className="size-4" /> Add</Button>
          </form>
        </SettingCard>
      </SettingSection>

      <SettingSection title="Access Controls">
        <SettingCard icon={<Users />} title="Team Visibility of Meetings" description="Default visibility for new recordings. Lock icons control whether users can change it.">
          {(["external", "internal", "unscheduled"] as const).map((k) => (
            <SettingRow
              key={k}
              label={`${k[0]!.toUpperCase()}${k.slice(1)} Meetings`}
              control={
                <span className="flex items-center gap-2">
                  <LockIcon k={k} />
                  <PillSelect value={s.orgVisibility[k]} onChange={(v) => setVis(k, v)} options={VIS_OPTIONS} className="h-11 text-[17px]" />
                </span>
              }
            />
          ))}
        </SettingCard>
        <SettingCard
          icon={<Link2 />}
          title="Default Share Link Access"
          description="Who can open a recording link by default."
          control={
            <PillSelect
              value={s.defaultShareAccess}
              onChange={(v) => update({ defaultShareAccess: v })}
              className="h-11 text-[17px]"
              width={340}
              options={[
                { value: "users_choose", label: "Users Choose" },
                { value: "link", label: "Anyone with the link can view" },
                { value: "domain", label: `Anyone @${ORG.domain} can view` },
                { value: "added", label: "Only people added can view" },
              ]}
            />
          }
        />
        <SettingCard icon={<ShieldCheck />} title="Restrict Anonymous Recording Access" badge={<Badge kind="beta">Enterprise</Badge>} description="Disable the “Anyone with the link” option across the organization." control={<Toggle checked={s.restrictAnonymous} onChange={(v) => update({ restrictAnonymous: v })} />} />
        <SettingCard icon={<ShieldCheck />} title="Single Sign-On Configuration" badge={<Badge kind="beta">Enterprise</Badge>} description="Configure SAML SSO and SCIM provisioning with Okta, Entra ID, or Google." control={<Button onClick={() => toast("SSO setup opens in a new tab", "info")}>Configure</Button>} />
      </SettingSection>

      <SettingSection title="Integrations">
        {[
          { key: "hubspot" as const, name: "HubSpot", desc: "Sync summaries, action items, and deal insights to HubSpot records.", color: "#FF7A59", glyph: "H" },
          { key: "salesforce" as const, name: "Salesforce", desc: "Log call data to Contacts, Accounts, and Opportunities.", color: "#00A1E0", glyph: "sf" },
          { key: "zapier" as const, name: "Zapier", desc: "Trigger workflows when recordings are ready.", color: "#FF4A00", glyph: "Z" },
          { key: "slack" as const, name: "Slack", desc: "Post summaries to channels. Requires public channels.", color: "#4A154B", glyph: "S" },
        ].map((i) => (
          <SettingCard
            key={i.key}
            icon={<span className="flex size-8 items-center justify-center rounded-lg text-[14px] font-black text-white" style={{ backgroundColor: i.color }}>{i.glyph}</span>}
            title={i.name}
            description={i.desc}
            control={<button type="button" onClick={() => { update({ [i.key]: !s[i.key] }); toast(s[i.key] ? `${i.name} disconnected` : `${i.name} connected`); }} className="rounded-md px-2 py-1 hover:bg-white/6"><IntegrationStatus connected={s[i.key]} /></button>}
          />
        ))}
      </SettingSection>

      <SettingSection title="Compliance">
        <SettingCard
          icon={<FileCheck2 />}
          title="Auto Request Recording Consent"
          badge={<Badge kind="recommended" className="text-[12px]">Recommended</Badge>}
          description="Collect recording consent from attendees in advance"
          control={<PillSelect value={s.orgConsent} onChange={(v) => update({ orgConsent: v })} options={[{ value: "users_choose", label: "Users Choose" }, { value: "on", label: "On" }, { value: "off", label: "Off" }]} className="h-11 text-[17px]" />}
        />
        <SettingCard icon={<CalendarClock />} title="Retention Period" description="Delete recordings, transcripts and summaries after set amount of time" control={<PillSelect value={s.retention} onChange={(v) => update({ retention: v })} options={["30 days", "90 days", "180 days", "1 year", "Forever"].map((v) => ({ value: v, label: v }))} className="h-11 text-[17px]" />} />
        <SettingCard icon={<Download />} title="Disable Recording Download" description="Prevent users from downloading recorded meetings" control={<Toggle checked={s.disableDownload} onChange={(v) => update({ disableDownload: v })} />} />
        <SettingCard icon={<Trash2 />} title="Disable Recording Deletion" description="Prevent users from deleting recorded meetings" control={<Toggle checked={s.disableDeletion} onChange={(v) => update({ disableDeletion: v })} />} />
        <SettingCard icon={<FilePenLine />} title="Disable Recording Modification" description="Prevent users from editing transcripts or trimming portions of recordings" control={<Toggle checked={s.disableModification} onChange={(v) => update({ disableModification: v })} />} />
        <SettingCard icon={<Bot />} title="Disable Bot-Free Capture" description="Require a visible bot in any meeting that users capture" control={<Toggle checked={s.disableBotFree} onChange={(v) => update({ disableBotFree: v })} />} />
        <SettingCard icon={<Sparkles />} title="Exclude team data from AI model training" description={<span>Prevent your users&apos; data being used to improve Fathom’s proprietary AI models. <a href="https://trust.fathom.video/" target="_blank" rel="noreferrer" className="underline">Learn More</a></span>} control={<Toggle checked={s.excludeTraining} onChange={(v) => update({ excludeTraining: v })} />} />
      </SettingSection>
    </div>
  );
}

/** Team Settings tab: per-team overrides of the org defaults ("Org default" option verified). */
export function TeamSettings() {
  const { toast } = useToast();
  const [team, setTeam] = useState(TEAMS[0]!.id);
  const [overrides, setOverrides] = useState<Record<string, Record<string, string>>>({});
  const get = (k: string) => overrides[team]?.[k] ?? "org_default";
  const set = (k: string, v: string) => setOverrides((o) => ({ ...o, [team]: { ...o[team], [k]: v } }));
  const capture = [{ value: "org_default", label: "Org default" }, ...CAPTURE_OPTIONS];
  const vis = [{ value: "org_default", label: "Org default" }, ...VIS_OPTIONS];
  const t = TEAMS.find((x) => x.id === team)!;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <span className="text-[17px] text-white/70">Team</span>
        <PillSelect value={team} onChange={setTeam} align="start" className="h-11 text-[17px]" options={TEAMS.map((x) => ({ value: x.id, label: x.name, description: `${x.memberIds.length} members` }))} />
        <Button variant="share" className="ml-auto" onClick={() => toast("Team created", "info")}><Plus className="size-4" /> New Team</Button>
      </div>
      <SettingSection title="Recording">
        <SettingCard icon={<Video />} title="Auto-Capture Meetings" description={`Overrides the organization default for ${t.name}.`}>
          {(["external", "internal", "unscheduled"] as const).map((k) => (
            <SettingRow key={k} label={`${k[0]!.toUpperCase()}${k.slice(1)} Meetings`} control={<PillSelect value={get(`cap_${k}`)} onChange={(v) => set(`cap_${k}`, v)} options={capture} className="h-11 text-[17px]" />} />
          ))}
        </SettingCard>
      </SettingSection>
      <SettingSection title="Access Controls">
        <SettingCard icon={<Users />} title="Team Visibility of Meetings" description="Where this team’s recordings are visible by default.">
          {(["external", "internal", "unscheduled"] as const).map((k) => (
            <SettingRow key={k} label={`${k[0]!.toUpperCase()}${k.slice(1)} Meetings`} control={<PillSelect value={get(`vis_${k}`)} onChange={(v) => set(`vis_${k}`, v)} options={vis} className="h-11 text-[17px]" />} />
          ))}
        </SettingCard>
      </SettingSection>
      <SettingSection title="Members">
        <SettingCard icon={<Users />} title={`${t.name} members`} description={`${t.memberIds.length} people`}>
          <ul className="divide-y divide-white/10">
            {t.memberIds.map((id) => {
              const u = userById(id);
              return (
                <li key={id} className="flex items-center gap-3 py-2.5">
                  <Avatar user={u} size="md" />
                  <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold">{u.name}</span><span className="block text-[13px] text-white/50">{u.email}</span></span>
                  <span className="text-[13px] text-white/60">{id === "u_nancy" || id === "u_marcus" ? "Team Admin" : "Member"}</span>
                </li>
              );
            })}
          </ul>
        </SettingCard>
      </SettingSection>
    </div>
  );
}

/** Users tab: seat list with roles (Account Admin / Team Admin / Member) and invite. */
export function UsersSettings() {
  const { toast } = useToast();
  const [invite, setInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<Record<string, string>>({ u_nancy: "Account Admin", u_marcus: "Team Admin", u_hannah: "Team Admin" });
  const internal = USERS.filter((u) => !u.isExternal);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <p className="text-[17px] text-white/70">{internal.length} of 25 seats used · <span className="text-off-white">{ORG.plan} plan</span></p>
        <Button variant="share" className="ml-auto" onClick={() => setInvite(true)}><UserPlus className="size-4" /> Invite Users</Button>
      </div>
      <div className="overflow-hidden rounded-xl bg-app-card">
        <table className="w-full text-left text-[15px]">
          <thead className="text-[12px] uppercase tracking-wide text-white/45">
            <tr className="border-b border-white/10">
              <th className="px-5 py-3 font-bold">User</th>
              <th className="hidden px-5 py-3 font-bold md:table-cell">Team</th>
              <th className="px-5 py-3 font-bold">Role</th>
              <th className="hidden px-5 py-3 font-bold sm:table-cell">Status</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {internal.map((u) => {
              const team = TEAMS.find((t) => t.memberIds.includes(u.id));
              return (
                <tr key={u.id} className="hover:bg-white/[0.03]">
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-3"><Avatar user={u} size="md" /><span className="min-w-0"><span className="block font-semibold">{u.name}</span><span className="block text-[13px] text-white/50">{u.email}</span></span></span>
                  </td>
                  <td className="hidden px-5 py-3 text-white/70 md:table-cell">{team?.name ?? "—"}</td>
                  <td className="px-5 py-3">
                    <PillSelect value={roles[u.id] ?? "Member"} onChange={(v) => { setRoles((r) => ({ ...r, [u.id]: v })); toast("Role updated"); }} size="sm" variant="ghost" align="start" options={["Account Admin", "Team Admin", "Member"].map((r) => ({ value: r, label: r }))} />
                  </td>
                  <td className="hidden px-5 py-3 sm:table-cell"><span className="text-emerald-400">Active</span></td>
                  <td className="px-3 py-3 text-right">
                    <Dropdown>
                      <DropdownTrigger><span aria-label="User options" className="inline-flex size-7 items-center justify-center rounded-md text-white/60 hover:bg-white/8"><MoreHorizontal className="size-4" /></span></DropdownTrigger>
                      <DropdownContent align="end" width={220}>
                        <DropdownItem onSelect={() => toast("Password reset email sent", "info")}>Send reset email</DropdownItem>
                        <DropdownSeparator />
                        <DropdownItem destructive onSelect={() => toast("Seat removed", "info")}>Remove from organization</DropdownItem>
                      </DropdownContent>
                    </Dropdown>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Modal open={invite} onClose={() => setInvite(false)} title="Invite Users" width={480}>
        <form onSubmit={(e) => { e.preventDefault(); if (email.trim()) { toast(`Invite sent to ${email.trim()}`); setEmail(""); setInvite(false); } }} className="space-y-4">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@brightline.io" aria-label="Email" />
          <p className="text-[13px] text-white/55">Invited users get a seat on the {ORG.plan} plan and join with Google or Microsoft.</p>
          <div className="flex justify-end gap-2"><Button onClick={() => setInvite(false)}>Cancel</Button><Button variant="cyan" type="submit" disabled={!email.trim()}>Send Invite</Button></div>
        </form>
      </Modal>
    </div>
  );
}

/** Meeting Types tab (verified feature: meeting types + AI scorecards). */
export function MeetingTypesSettings() {
  const { toast } = useToast();
  const [types, setTypes] = useState([
    { id: "mt1", name: "Discovery Call", rule: "External · title contains “Discovery”", template: "Sales - SPICED", scorecard: true },
    { id: "mt2", name: "Customer QBR", rule: "External · title contains “QBR”", template: "Customer Success", scorecard: false },
    { id: "mt3", name: "Standup", rule: "Internal · recurring daily", template: "General", scorecard: false },
    { id: "mt4", name: "Candidate Interview", rule: "External · title contains “Interview”", template: "Candidate Interview", scorecard: true },
  ]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <p className="text-[15px] text-white/60">Meeting types classify calls automatically and choose the summary template and AI scorecard to apply.</p>
        <Button variant="share" className="ml-auto shrink-0" onClick={() => setCreating(true)}><Plus className="size-4" /> New Type</Button>
      </div>
      <div className="space-y-3">
        {types.map((t) => (
          <SettingCard
            key={t.id}
            icon={<Sparkles />}
            title={t.name}
            description={t.rule}
            control={
              <span className="flex items-center gap-3">
                <span className="hidden text-[14px] text-white/60 sm:inline">{t.template}</span>
                <span className="flex items-center gap-1.5 text-[13px] text-white/60"><span>Scorecard</span><Toggle size="sm" checked={t.scorecard} onChange={(v) => setTypes((x) => x.map((y) => (y.id === t.id ? { ...y, scorecard: v } : y)))} /></span>
                <button type="button" aria-label="Delete meeting type" onClick={() => { setTypes((x) => x.filter((y) => y.id !== t.id)); toast("Meeting type deleted"); }} className="rounded p-1.5 text-white/40 hover:bg-white/8 hover:text-[#f05252]"><Trash2 className="size-4" /></button>
              </span>
            }
          />
        ))}
      </div>
      <Modal open={creating} onClose={() => setCreating(false)} title="New Meeting Type" width={480}>
        <form onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; setTypes((x) => [...x, { id: `mt_${Date.now()}`, name: name.trim(), rule: "External · manual", template: "General", scorecard: false }]); setName(""); setCreating(false); toast("Meeting type created"); }} className="space-y-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Renewal Call" aria-label="Meeting type name" />
          <div className="flex justify-end gap-2"><Button onClick={() => setCreating(false)}>Cancel</Button><Button variant="cyan" type="submit" disabled={!name.trim()}>Create</Button></div>
        </form>
      </Modal>
      <ChevronDown className="hidden" />
    </div>
  );
}
