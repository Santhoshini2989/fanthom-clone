"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  ClipboardList,
  Copy,
  FileText,
  ListChecks,
  MessageSquareText,
  MonitorPlay,
  Pencil,
  RotateCcw,
  Settings,
  Sparkles,
  Undo2,
  UserRound,
  Users,
} from "lucide-react";
import type { Meeting, Summary, SummaryBullet } from "@/data/types";
import { LANGUAGES } from "@/data/types";
import { CUSTOMIZABLE_TEMPLATE_IDS, TEMPLATES, templateById } from "@/data/templates";
import { useAppStore } from "@/lib/store";
import { summaryToText } from "@/lib/summary-text";
import { cn, copyText, formatClock } from "@/lib/utils";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/components/ui/dropdown";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { CustomizeTemplateModal } from "./customize-modal";

const ICONS: Record<string, React.ReactNode> = {
  general: <MessageSquareText />,
  sales: <BarChart3 />,
  qa: <MessageSquareText />,
  demo: <MonitorPlay />,
  people: <Users />,
  project: <ClipboardList />,
  interview: <UserRound />,
  retro: <ListChecks />,
};

/**
 * SUMMARY tab (verified): template pill (icon · name ⌄ | gear "Customize"),
 * language pill (flag EN ⌄), cyan "Copy Summary" with a with/without-links
 * choice, then sections: Meeting Purpose, Key Takeaways, Topics (sub-titles +
 * bullets), Next Steps. Bullets carry a timestamp that seeks the recording.
 * After customizing: "✨ Customized summary generated · Apply to Future
 * Summaries · ✎ · ↶" banner (verified).
 */
export function SummaryPanel({
  meeting,
  onSeek,
  readOnly,
  className,
}: {
  meeting: Meeting;
  onSeek?: (t: number) => void;
  readOnly?: boolean;
  className?: string;
}) {
  const prefs = useAppStore((s) => s.meetingPrefs[meeting.id]);
  const defaultTemplateId = useAppStore((s) => s.settings.defaultTemplateId);
  const setMeetingPref = useAppStore((s) => s.setMeetingPref);
  const instructions = useAppStore((s) => s.settings.templateInstructions);
  const setTemplateInstruction = useAppStore((s) => s.setTemplateInstruction);
  const customized = useAppStore((s) => s.customizedSummaries[meeting.id]);
  const markCustomized = useAppStore((s) => s.markSummaryCustomized);
  const clearCustomized = useAppStore((s) => s.clearSummaryCustomized);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const regenerateSummary = useAppStore((s) => s.regenerateSummary);
  const gemini = useAppStore((s) => s.capabilities.gemini);
  const hasTranscript = meeting.transcript.length > 0;
  const { toast } = useToast();

  const available = Object.keys(meeting.summaries);
  const templateId = prefs?.templateId && available.includes(prefs.templateId) ? prefs.templateId : available.includes(defaultTemplateId) ? defaultTemplateId : (available[0] ?? "general");
  const language = prefs?.language ?? "en";
  const summary: Summary | undefined = meeting.summaries[templateId];
  const template = templateById(templateId);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [applied, setApplied] = useState(false);
  const lang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0]!;

  const isCustomized = customized === templateId;
  const shownSummary = useMemo(() => {
    if (!summary) return undefined;
    if (!isCustomized) return summary;
    // Deterministic "customized" rendering: bullets get their lead bolded from
    // the first clause and a Misc topic is appended, mirroring the placeholder's
    // example instructions.
    const boldLead = (b: SummaryBullet): SummaryBullet => {
      if (b.lead) return b;
      const m = b.text.match(/^([^:.,]{3,40}):?\s(.*)$/);
      return m && m[1] && m[2] ? { ...b, lead: `${m[1]}:`, text: m[2] } : b;
    };
    return {
      ...summary,
      sections: summary.sections.map((sec) => ({
        ...sec,
        bullets: sec.bullets?.map(boldLead),
        topics: sec.topics?.map((tp) => ({ ...tp, bullets: tp.bullets.map(boldLead) })),
      })),
    };
  }, [summary, isCustomized]);

  const copy = async (links: boolean) => {
    if (!shownSummary) return;
    await copyText(summaryToText(meeting, shownSummary, { links, origin: location.origin }));
    toast(links ? "Summary copied with links" : "Summary copied");
  };

  const regenerate = (instruction: string) => {
    setTemplateInstruction(templateId, instruction);
    setRegenerating(true);
    setApplied(false);
    if (gemini && hasTranscript) {
      regenerateSummary(meeting.id, templateId, { instructions: instruction, language: prefs?.language })
        .then(() => markCustomized(meeting.id, templateId))
        .catch((e: unknown) => toast(e instanceof Error ? e.message : "Could not regenerate the summary", "error"))
        .finally(() => setRegenerating(false));
      return;
    }
    window.setTimeout(() => {
      markCustomized(meeting.id, templateId);
      setRegenerating(false);
    }, 1400);
  };

  if (!summary) {
    return (
      <div className={cn("py-10 text-center text-sm text-white/55", className)}>
        No summary has been generated for this recording yet.
      </div>
    );
  }

  const translatedNote = language !== "en";

  return (
    <div className={cn("", className)}>
      {/* toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="inline-flex h-10 items-stretch overflow-hidden rounded-full border border-white/40">
          <Dropdown>
            <DropdownTrigger>
              <span className="flex items-center gap-2 pl-3.5 pr-3 text-[15px] font-medium text-off-white hover:bg-white/8" aria-label="Summary template">
                <span className="[&_svg]:size-4 text-white/85">{ICONS[template.icon]}</span>
                {template.name}
                <ChevronDown className="size-4" strokeWidth={2.25} />
              </span>
            </DropdownTrigger>
            <DropdownContent align="start" width={440} className="max-h-[70vh] overflow-y-auto p-2 scrollbar-thin">
              {TEMPLATES.filter((t) => !t.deprecated || available.includes(t.id)).map((t) => (
                <DropdownItem
                  key={t.id}
                  icon={ICONS[t.icon]}
                  description={t.description}
                  disabled={!available.includes(t.id) && readOnly}
                  className={cn("py-2.5 text-[17px]", t.id === templateId && "bg-[#1f3340] text-fathom [&_span]:text-fathom")}
                  onSelect={() => {
                    if (!available.includes(t.id)) {
                      toast(`Generating a ${t.name} summary is available on the Business plan`, "info");
                      return;
                    }
                    setMeetingPref(meeting.id, { templateId: t.id });
                  }}
                >
                  {t.name}
                </DropdownItem>
              ))}
            </DropdownContent>
          </Dropdown>
          {!readOnly && CUSTOMIZABLE_TEMPLATE_IDS.includes(templateId) && (
            <Tooltip label="Customize" side="top">
              <button
                type="button"
                onClick={() => setCustomizeOpen(true)}
                aria-label="Customize summary template"
                className="flex w-11 items-center justify-center border-l border-white/40 bg-[#3b3b40] text-white hover:bg-[#48484e]"
              >
                <Settings className="size-4" fill="currentColor" strokeWidth={0} />
              </button>
            </Tooltip>
          )}
        </div>

        <Dropdown>
          <DropdownTrigger>
            <span className="flex h-10 items-center gap-2 rounded-full border border-white/40 px-3.5 text-[15px] font-medium text-off-white hover:bg-white/8" aria-label="Summary language">
              <span aria-hidden>{lang.flag}</span>
              {lang.code.toUpperCase()}
              <ChevronDown className="size-4" strokeWidth={2.25} />
            </span>
          </DropdownTrigger>
          <DropdownContent align="start" width={260} className="p-2">
            {LANGUAGES.map((l) => (
              <DropdownItem key={l.code} onSelect={() => setMeetingPref(meeting.id, { language: l.code })} className={cn("py-2.5 text-[17px]", l.code === language && "bg-[#1f3340] text-fathom")}>
                <span className="mr-2" aria-hidden>{l.flag}</span> {l.label}
              </DropdownItem>
            ))}
          </DropdownContent>
        </Dropdown>

        <Dropdown>
          <DropdownTrigger>
            <span className="ml-auto flex h-10 items-center gap-2 rounded-lg bg-app-share px-4 text-[15px] font-semibold text-fathom hover:bg-[#25323a]">
              Copy Summary
              <FileText className="size-4" fill="currentColor" strokeWidth={0} />
            </span>
          </DropdownTrigger>
          <DropdownContent align="end" width={240}>
            <DropdownItem icon={<Copy />} onSelect={() => copy(true)}>Copy with links</DropdownItem>
            <DropdownItem icon={<Copy />} onSelect={() => copy(false)}>Copy without links</DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>

      {regenerating && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-fathom/30 bg-fathom/8 px-4 py-3 text-[15px] text-off-white">
          <Sparkles className="size-4 animate-pulse-slow text-fathom" />
          Regenerating {template.name} summary with your instructions…
        </div>
      )}

      {isCustomized && !regenerating && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl bg-[#1f1f22] px-4 py-3 text-[15px] text-off-white">
          <span className="flex items-center gap-2">
            <span aria-hidden>✨</span> {applied ? "Applied to future summaries" : "Customized summary generated"}
          </span>
          <span className="ml-auto flex items-center gap-2">
            {!applied && (
              <button
                type="button"
                onClick={() => {
                  updateSettings({ defaultTemplateId: templateId });
                  setApplied(true);
                  toast("Instructions will apply to future summaries");
                }}
                className="h-9 rounded-md border border-fathom px-3 text-[15px] font-medium text-fathom hover:bg-fathom/10"
              >
                Apply to Future Summaries
              </button>
            )}
            <Tooltip label="Refine instructions">
              <button type="button" onClick={() => setCustomizeOpen(true)} aria-label="Refine instructions" className="flex size-9 items-center justify-center rounded-md bg-[#2e2e33] text-white hover:bg-[#3a3a40]">
                <Pencil className="size-4" fill="currentColor" strokeWidth={0} />
              </button>
            </Tooltip>
            <Tooltip label="Revert to default">
              <button
                type="button"
                aria-label="Revert to default summary"
                onClick={() => {
                  clearCustomized(meeting.id);
                  setApplied(false);
                  toast("Reverted to the default summary");
                }}
                className="flex size-9 items-center justify-center rounded-md bg-[#2e2e33] text-white hover:bg-[#3a3a40]"
              >
                <Undo2 className="size-4" />
              </button>
            </Tooltip>
          </span>
        </div>
      )}

      {translatedNote && (
        <p className="mb-4 flex items-center gap-2 text-[13px] text-white/55">
          <span aria-hidden>{lang.flag}</span> Summary translated to {lang.label}. Transcript stays in the original language.
        </p>
      )}

      <article className="max-w-[720px]">
        {shownSummary!.sections.map((sec) => (
          <section key={sec.heading} className="mb-7">
            <h3 className="mb-2.5 text-[20px] font-semibold leading-7 text-off-white">{sec.heading}</h3>
            {sec.paragraph && <p className="text-[15px] leading-6 text-white/85">{sec.paragraph}</p>}
            {sec.bullets && <Bullets bullets={sec.bullets} onSeek={onSeek} />}
            {sec.topics?.map((tp) => (
              <div key={tp.title} className="mt-4">
                <h4 className="mb-1.5 text-[16px] font-semibold text-off-white">{tp.title}</h4>
                <Bullets bullets={tp.bullets} onSeek={onSeek} />
              </div>
            ))}
          </section>
        ))}
        {isCustomized && (
          <section className="mb-7">
            <h4 className="mb-1.5 text-[16px] font-semibold text-off-white">Misc</h4>
            <Bullets bullets={[{ text: "Everything not already covered above was reviewed and no additional items were found." }]} />
          </section>
        )}
      </article>

      <CustomizeTemplateModal
        key={`${templateId}-${customizeOpen}`}
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        templateId={templateId}
        initial={instructions[templateId]}
        onRegenerate={regenerate}
      />
      <RotateCcw className="hidden" />
    </div>
  );
}

function Bullets({ bullets, onSeek }: { bullets: SummaryBullet[]; onSeek?: (t: number) => void }) {
  return (
    <ul className="space-y-1.5">
      {bullets.map((b, i) => (
        <li key={i} className="flex gap-2.5 text-[15px] leading-6 text-white/85">
          <span className="mt-[10px] size-1 shrink-0 rounded-full bg-white/70" aria-hidden />
          <span className="min-w-0">
            {b.lead && <b className="font-semibold text-off-white">{b.lead} </b>}
            {b.text}
            {b.at !== undefined && onSeek && (
              <button
                type="button"
                onClick={() => onSeek(b.at!)}
                className="ml-1.5 inline-flex items-center rounded bg-fathom/12 px-1.5 py-px align-middle font-inter text-[11px] font-medium tabular-nums text-fathom transition-colors hover:bg-fathom/25"
                aria-label={`Jump to ${formatClock(b.at)}`}
              >
                {formatClock(b.at)}
              </button>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
