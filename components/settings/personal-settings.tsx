"use client";

import { useState } from "react";
import {
  Bot,
  Puzzle,
  GripVertical,
  Image as ImageIcon,
  KeyRound,
  Laptop,
  ListChecks,
  Moon,
  Plus,
  RotateCcw,
  Sparkles,
  Sun,
  Trash2,
  Webhook,
  Zap,
} from "lucide-react";
import { useAppStore, DEFAULT_BOT_NAME, type AutoRecord, type AutoShare } from "@/lib/store";
import { TEMPLATES } from "@/data/templates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PillSelect } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { useToast } from "@/components/ui/toast";
import { IntegrationStatus, SettingCard, SettingRow, SettingSection } from "./primitives";
import { PlatformIcon } from "@/components/meetings/platform-icon";
import { cn } from "@/lib/utils";

/**
 * Personal settings page at /customize (verified sections and controls):
 * "Auto-record [⌄] and auto-share [⌄] with attendees" · VIDEO CONFERENCING ·
 * PREMIUM FEATURES (Zapier, Bot Name, Auto-Generate Action Items, Default
 * Meeting Summary Template, Recording Notification Banner) · INTEGRATIONS ·
 * OPTIONS · FATHOM APPS · HIGHLIGHT OPTIONS · API.
 */
export function PersonalSettings() {
  const s = useAppStore((x) => x.settings);
  const update = useAppStore((x) => x.updateSettings);
  const highlightTypes = useAppStore((x) => x.highlightTypes);
  const addHighlightType = useAppStore((x) => x.addHighlightType);
  const updateHighlightType = useAppStore((x) => x.updateHighlightType);
  const removeHighlightType = useAppStore((x) => x.removeHighlightType);
  const reorderHighlightTypes = useAppStore((x) => x.reorderHighlightTypes);
  const addWebhook = useAppStore((x) => x.addWebhook);
  const removeWebhook = useAppStore((x) => x.removeWebhook);
  const { toast } = useToast();

  const [botDraft, setBotDraft] = useState(s.botName);
  const [botEditing, setBotEditing] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [drag, setDrag] = useState<string | null>(null);

  const saveBot = () => {
    const v = botDraft.trim();
    if (!v) return;
    update({ botName: v });
    setBotEditing(false);
    toast("Bot name saved");
  };

  return (
    <div>
      {/* sentence header (verified) */}
      <div className="mb-10 flex flex-wrap items-center gap-x-3 gap-y-2 text-[21px] text-off-white">
        <span>Auto-record</span>
        <PillSelect<AutoRecord>
          value={s.autoRecord}
          onChange={(v) => { update({ autoRecord: v }); toast("Auto-record updated"); }}
          align="start"
          width={420}
          className="h-12 rounded-lg bg-[#2a2a2e] px-4 text-[19px] font-normal"
          options={[
            { value: "all", label: "All meetings", badge: <Badge kind="most-common" className="ml-3 text-[12px]">Most common</Badge> },
            { value: "external", label: "External meetings" },
            { value: "internal", label: "Internal meetings" },
            { value: "none", label: "No meetings. I'll record manually" },
          ]}
        />
        <span>and auto-share</span>
        <PillSelect<AutoShare>
          value={s.autoShare}
          onChange={(v) => { update({ autoShare: v }); toast("Auto-share updated"); }}
          align="start"
          width={300}
          className="h-12 rounded-lg bg-[#2a2a2e] px-4 text-[19px] font-normal"
          options={[
            { value: "summary_recording", label: "Summary & recording" },
            { value: "summary", label: "Summary only" },
            { value: "nothing", label: "Nothing" },
          ]}
        />
        <span>with attendees</span>
      </div>

      <SettingSection title="Video Conferencing">
        <SettingCard
          icon={<PlatformIcon platform="zoom" className="size-8 rounded-lg" />}
          title={<span>Zoom: <span className={s.zoom ? "text-emerald-400" : "text-white/50"}>{s.zoom ? "Fully Enabled" : "Not connected"}</span></span>}
          description="Fathom joins your Zoom meetings as a notetaker and records in gallery view."
          control={<Toggle checked={s.zoom} onChange={(v) => update({ zoom: v })} label="Zoom" />}
        >
          <SettingRow label="Enhanced Recording: Record gallery mode and with improved recording quality" control={<Toggle checked={s.enhancedRecording} onChange={(v) => update({ enhancedRecording: v })} />} />
          <SettingRow label="Auto-record unscheduled Zoom meetings" control={<Toggle checked={s.recordUnscheduledZoom} onChange={(v) => update({ recordUnscheduledZoom: v })} />} />
        </SettingCard>
        <SettingCard
          icon={<PlatformIcon platform="google_meet" className="size-8" />}
          title={<span>Google Meet: <span className={s.googleMeet ? "text-emerald-400" : "text-white/50"}>{s.googleMeet ? "Fully Enabled" : "Not connected"}</span></span>}
          description="Fathom joins Google Meet calls from your calendar."
          control={<Toggle checked={s.googleMeet} onChange={(v) => update({ googleMeet: v })} label="Google Meet" />}
        >
          <SettingRow label="Auto-record unscheduled Google Meet meetings" control={<Toggle checked={s.recordUnscheduledMeet} onChange={(v) => update({ recordUnscheduledMeet: v })} />} />
        </SettingCard>
        <SettingCard
          icon={<PlatformIcon platform="microsoft_teams" className="size-8" />}
          title={<span>Microsoft Teams: <span className={s.teams ? "text-emerald-400" : "text-white/50"}>{s.teams ? "Fully Enabled" : "Not connected"}</span></span>}
          description="Connect Teams so Fathom can join meetings hosted there."
          control={<Toggle checked={s.teams} onChange={(v) => update({ teams: v })} label="Microsoft Teams" />}
        />
      </SettingSection>

      <SettingSection title="Premium Features">
        <SettingCard icon={<Zap />} title="Zapier" description="Trigger Zaps when a recording is ready, with the summary and action items as fields." control={<Toggle checked={s.zapier} onChange={(v) => update({ zapier: v })} />} />

        <SettingCard
          icon={<Bot />}
          title={<span>Bot Name: <span className="font-normal">{s.botName}</span></span>}
          description="The name your Fathom notetaker will go by when it joins meetings."
        >
          {botEditing ? (
            <div className="rounded-lg bg-[#1f1f22] p-3">
              <Input value={botDraft} onChange={(e) => setBotDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveBot(); if (e.key === "Escape") setBotEditing(false); }} autoFocus className="h-14 border-fathom bg-[#1a1a1d] text-[19px]" aria-label="Bot name" />
              <div className="mt-3 flex items-center gap-2">
                <Button variant="cyan" size="lg" className="text-[17px]" onClick={saveBot}>Save</Button>
                <Button size="lg" className="text-[17px]" onClick={() => { setBotEditing(false); setBotDraft(s.botName); }}>Cancel</Button>
                <button type="button" onClick={() => { setBotDraft(DEFAULT_BOT_NAME); }} className="ml-auto flex items-center gap-1.5 text-[17px] text-white/70 hover:text-white">
                  <RotateCcw className="size-4" /> Revert to Default
                </button>
              </div>
            </div>
          ) : (
            <Button size="sm" onClick={() => { setBotDraft(s.botName); setBotEditing(true); }}>Edit bot name</Button>
          )}
        </SettingCard>

        <SettingCard icon={<ListChecks />} title="Auto-Generate Action Items" description="Detect action items in every meeting, including who they're assigned to." control={<Toggle checked={s.autoActionItems} onChange={(v) => update({ autoActionItems: v })} />} />

        <SettingCard
          icon={<Sparkles />}
          title="Default Meeting Summary Template"
          description="External meetings only. Attendees receive this summary when you share."
          control={
            <PillSelect
              value={s.defaultTemplateId}
              onChange={(v) => { update({ defaultTemplateId: v }); toast("Default template updated"); }}
              width={560}
              className="h-12 text-[17px]"
              options={TEMPLATES.filter((t) => !t.deprecated).map((t) => ({ value: t.id, label: t.name, description: t.description }))}
            />
          }
        />

        <SettingCard
          icon={<ImageIcon />}
          title="Recording Notification Banner"
          description={<span><b className="text-white/70">WARNING:</b> If you disable this, you are responsible for notifying attendees that the call is being recorded according to the laws of your jurisdiction.</span>}
          control={<Toggle checked={s.recordingBanner} onChange={(v) => update({ recordingBanner: v })} />}
        />
      </SettingSection>

      <SettingSection title="Integrations">
        {[
          { key: "slack" as const, name: "Slack", desc: "Automatically send highlights and summaries to a channel.", color: "#4A154B", glyph: "S" },
          { key: "salesforce" as const, name: "Salesforce", desc: "Sync call summaries & highlights to matching Contacts, Accounts, and Opportunities.", color: "#00A1E0", glyph: "sf" },
          { key: "hubspot" as const, name: "HubSpot", desc: "Log call summaries and action items to the matching contact and deal.", color: "#FF7A59", glyph: "H" },
          { key: "close" as const, name: "Close", desc: "Attach call notes to leads in Close.", color: "#1E88E5", glyph: "C" },
        ].map((i) => (
          <SettingCard
            key={i.key}
            icon={<span className="flex size-8 items-center justify-center rounded-lg text-[14px] font-black text-white" style={{ backgroundColor: i.color }}>{i.glyph}</span>}
            title={i.name}
            description={i.desc}
            control={
              <button type="button" onClick={() => { update({ [i.key]: !s[i.key] }); toast(s[i.key] ? `${i.name} disconnected` : `${i.name} connected`); }} className="rounded-md px-2 py-1 hover:bg-white/6">
                <IntegrationStatus connected={s[i.key]} />
              </button>
            }
          />
        ))}
      </SettingSection>

      <SettingSection title="Options">
        <SettingCard title="Auto Request Recording Consent" description="Collect recording consent from attendees in advance via email." control={<Toggle checked={s.autoConsent} onChange={(v) => update({ autoConsent: v })} />} />
        <SettingCard title="Make external meetings visible to your team by default" description="Team plans only. You can change visibility per recording." control={<Toggle checked={s.externalVisibleToTeam} onChange={(v) => update({ externalVisibleToTeam: v })} />} />
        <SettingCard
          icon={s.theme === "dark" ? <Moon /> : <Sun />}
          title="Appearance"
          description="Switch between the dark and light interface."
          control={
            <PillSelect
              value={s.theme}
              onChange={(v) => update({ theme: v })}
              options={[{ value: "dark", label: "Dark", icon: <Moon /> }, { value: "light", label: "Light", icon: <Sun /> }]}
            />
          }
        />
      </SettingSection>

      <SettingSection title="Fathom Apps">
        <SettingCard icon={<Laptop />} title="Desktop App" description="Bot-free capture, live summaries and meeting alerts." control={<span className={cn("text-[17px] font-medium", s.desktopApp ? "text-emerald-400" : "text-fathom")}>{s.desktopApp ? "Installed ✓" : "Download"}</span>} />
        <SettingCard icon={<PlatformIcon platform="zoom" className="size-7 rounded-md" />} title="Zoom App" description="Highlight and control recording from inside Zoom." control={<span className={cn("text-[17px] font-medium", s.zoomApp ? "text-emerald-400" : "text-fathom")}>{s.zoomApp ? "Installed ✓" : "Install"}</span>} />
        <SettingCard icon={<Puzzle />} title="Chrome Extension" description="Adds Fathom controls to Google Meet in your browser." control={<button type="button" onClick={() => { update({ chromeExtension: !s.chromeExtension }); toast(s.chromeExtension ? "Extension removed" : "Extension installed"); }} className={cn("text-[17px] font-medium", s.chromeExtension ? "text-emerald-400" : "text-fathom")}>{s.chromeExtension ? "Installed ✓" : "Install"}</button>} />
      </SettingSection>

      <SettingSection title="Highlight Options">
        <SettingCard title="Highlight types" description="Rename, recolor, reorder or remove the highlight types available on your calls.">
          <ul className="space-y-1.5">
            {highlightTypes.map((t) => (
              <li
                key={t.id}
                draggable
                onDragStart={() => setDrag(t.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (!drag || drag === t.id) return;
                  const ids = highlightTypes.map((x) => x.id);
                  const from = ids.indexOf(drag);
                  const to = ids.indexOf(t.id);
                  ids.splice(from, 1);
                  ids.splice(to, 0, drag);
                  reorderHighlightTypes(ids);
                  setDrag(null);
                }}
                className="flex items-center gap-3 rounded-lg bg-[#1f1f22] px-3 py-2"
              >
                <GripVertical className="size-4 cursor-grab text-white/30" />
                <input type="color" value={t.color} onChange={(e) => updateHighlightType(t.id, { color: e.target.value })} aria-label={`${t.name} color`} className="size-6 cursor-pointer rounded border-0 bg-transparent p-0" />
                <input
                  value={t.name}
                  onChange={(e) => updateHighlightType(t.id, { name: e.target.value })}
                  aria-label="Highlight type name"
                  className="h-8 min-w-0 flex-1 rounded-md bg-transparent px-2 text-[15px] font-semibold uppercase tracking-wide outline-none focus:bg-black/30"
                  style={{ color: t.color }}
                />
                <button type="button" aria-label={`Delete ${t.name}`} onClick={() => { removeHighlightType(t.id); toast("Highlight type removed"); }} className="rounded p-1.5 text-white/40 hover:bg-white/8 hover:text-[#f05252]">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => addHighlightType({ name: "New Highlight", color: "#a855f7" })} className="mt-3 flex items-center gap-1.5 text-[15px] font-medium text-fathom hover:underline">
            <Plus className="size-4" /> Add More
          </button>
        </SettingCard>
      </SettingSection>

      <SettingSection title="API">
        <SettingCard icon={<KeyRound />} title="Public API" description="Use the Fathom API and MCP server to read recordings, summaries and action items.">
          <label className="block text-[15px] text-white/70">API Key</label>
          <div className="mt-1.5 flex h-12 items-center rounded-lg bg-[#1a1a1d] px-4 font-mono text-[15px] tracking-widest text-white/70">••••••••••••••••••••••••••••••••••••••••</div>
          <label className="mt-4 block text-[15px] text-white/70">Webhook Secret</label>
          <div className="mt-1.5 flex gap-2">
            <div className="flex h-12 flex-1 items-center rounded-lg bg-[#1a1a1d] px-4 font-mono text-[15px] tracking-widest text-white/70">••••••••••••••••••••••••••••••••</div>
            <Button size="lg" onClick={() => toast("Secret copied", "info")} aria-label="Copy webhook secret">⧉</Button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (webhookUrl.trim()) { addWebhook(webhookUrl.trim()); setWebhookUrl(""); toast("Webhook added"); } }} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://your-endpoint.example.com/fathom" aria-label="Webhook URL" className="h-11" />
            <Button variant="share" size="md" type="submit" disabled={!webhookUrl.trim()}><Webhook className="size-4" /> Add Webhook</Button>
          </form>
          <h4 className="mb-2 mt-6 text-[15px] font-bold uppercase tracking-wide text-white/50">Webhooks</h4>
          <ul className="space-y-2">
            {s.webhooks.map((w) => (
              <li key={w.id} className="rounded-lg bg-[#1f1f22] p-4">
                <div className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 truncate text-[16px] font-semibold">{w.url}</span>
                  <Button variant="outline-cyan" size="sm" onClick={() => toast("Test payload sent", "info")}>Send Test Payload ⓘ</Button>
                  <button type="button" aria-label="Delete webhook" onClick={() => { removeWebhook(w.id); toast("Webhook removed"); }} className="flex size-8 items-center justify-center rounded-md bg-[#3a1f1f] text-[#f05252] hover:bg-[#4a2424]">
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4 text-[14px]">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-white/40">Scopes</p>
                    {w.scopes.map((x) => <p key={x} className="text-white/75">✓ {x}</p>)}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-white/40">Events</p>
                    {w.events.map((x) => <p key={x} className="text-white/75">▪ {x}</p>)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </SettingCard>
      </SettingSection>
    </div>
  );
}
