import type {
  Folder,
  HighlightType,
  KeywordAlert,
  Meeting,
  Platform,
  Playlist,
  Speaker,
  TranscriptSegment,
} from "../types";
import { productStrategy } from "./product-strategy";
import { standup } from "./standup";
import { salesCall } from "./sales-call";

/** Built-in highlight types (from the in-call highlight panel screenshot). */
export const HIGHLIGHT_TYPES: HighlightType[] = [
  { id: "highlight", name: "Highlight", color: "#00beff", builtIn: true },
  { id: "positive_reaction", name: "Positive Reaction", color: "#22c55e", builtIn: true },
  { id: "needs_review", name: "Needs Review", color: "#facc15", builtIn: true },
  { id: "feedback", name: "Feedback", color: "#f97316", builtIn: true },
  { id: "issues", name: "Issues", color: "#ef4444" },
];

/**
 * Stretch a meeting's timeline by k so the transcript spans the stated
 * duration (the hand-written transcripts are denser than real speech).
 */
function scaleTime(m: Meeting, k: number): Meeting {
  const s = (t?: number) => (t === undefined ? undefined : Math.round(t * k));
  return {
    ...m,
    transcript: m.transcript.map((t) => ({ ...t, start: s(t.start)!, end: s(t.end)! })),
    summaries: Object.fromEntries(
      Object.entries(m.summaries).map(([id, sum]) => [
        id,
        {
          ...sum,
          sections: sum.sections.map((sec) => ({
            ...sec,
            bullets: sec.bullets?.map((b) => ({ ...b, at: s(b.at) })),
            topics: sec.topics?.map((tp) => ({ ...tp, bullets: tp.bullets.map((b) => ({ ...b, at: s(b.at) })) })),
          })),
        },
      ]),
    ),
    actionItems: m.actionItems.map((a) => ({ ...a, at: s(a.at) })),
    highlights: m.highlights.map((h) => ({ ...h, start: s(h.start)!, end: s(h.end)! })),
    questions: m.questions.map((q) => ({ ...q, at: s(q.at)! })),
    comments: m.comments.map((c) => ({ ...c, at: s(c.at) })),
  };
}

/** Meeting 4: still processing. */
const processing: Meeting = {
  id: "361160311",
  title: "Design Review – Onboarding Flow",
  startedAt: "2026-09-12T11:00:00",
  duration: 2110,
  platform: "google_meet",
  status: "processing",
  processingProgress: 62,
  ownerId: "u_nancy",
  attendeeIds: ["u_nancy", "u_priya", "u_ravi", "u_lena"],
  speakers: [],
  transcript: [],
  summaries: {},
  actionItems: [],
  highlights: [],
  questions: [],
  comments: [],
  visibility: "no_teams",
  shareAccess: "added",
  shares: [{ id: "sh_pr_1", target: "u_nancy", label: "Nancy Liang", sublabel: "nancy@brightline.io", role: "owner", kind: "user" }],
  meetingType: "Internal",
  thumbnailSeed: 5,
};

/** Meeting 5: failed (error state). */
const failed: Meeting = {
  id: "361159804",
  title: "Halcyon Renewal Check-in",
  startedAt: "2026-09-12T09:00:00",
  duration: 0,
  platform: "microsoft_teams",
  status: "failed",
  failureReason: "The Fathom Notetaker was not admitted from the waiting room, so nothing was recorded.",
  ownerId: "u_hannah",
  attendeeIds: ["u_hannah", "u_tom"],
  speakers: [],
  transcript: [],
  summaries: {},
  actionItems: [],
  highlights: [],
  questions: [],
  comments: [],
  visibility: "no_teams",
  shareAccess: "added",
  shares: [{ id: "sh_fl_1", target: "u_hannah", label: "Hannah Okafor", sublabel: "hannah@brightline.io", role: "owner", kind: "user" }],
  meetingType: "External",
  thumbnailSeed: 2,
};

/** Small generated meetings to fill the grid with earlier history. */
interface Sketch {
  id: string;
  title: string;
  startedAt: string;
  duration: number;
  platform: Platform;
  ownerId: string;
  attendeeIds: string[];
  purpose: string;
  takeaways: string[];
  lines: [string, string][]; // [userId, text]
  seed: number;
  folderId?: string;
  meetingType?: string;
  visibility?: Meeting["visibility"];
}

const USER_COLORS: Record<string, string> = {
  u_nancy: "#6d3df5", u_marcus: "#0ea5e9", u_priya: "#f59e0b", u_diego: "#10b981", u_hannah: "#ec4899",
  u_tom: "#8b5cf6", u_lena: "#f97316", u_sam: "#14b8a6", u_aisha: "#3b82f6", u_ravi: "#a855f7",
  u_grace: "#ef4444", u_ben: "#64748b",
};
const USER_NAMES: Record<string, string> = {
  u_nancy: "Nancy Liang", u_marcus: "Marcus Bell", u_priya: "Priya Raman", u_diego: "Diego Alvarez",
  u_hannah: "Hannah Okafor", u_tom: "Tom Whitaker", u_lena: "Lena Fischer", u_sam: "Sam Kowalski",
  u_aisha: "Aisha Abdali", u_ravi: "Ravi Patel", u_grace: "Grace Holloway", u_ben: "Ben Carter",
};

function fromSketch(s: Sketch): Meeting {
  const speakers: Speaker[] = s.attendeeIds.map((uid) => ({
    id: `sp_${uid}`,
    name: USER_NAMES[uid] ?? uid,
    color: USER_COLORS[uid] ?? "#525252",
    userId: uid,
  }));
  const step = Math.max(30, Math.floor(s.duration / (s.lines.length + 1)));
  const transcript: TranscriptSegment[] = s.lines.map(([uid, text], i) => ({
    id: `${s.id}_${i + 1}`,
    speakerId: `sp_${uid}`,
    start: 5 + i * step,
    end: 5 + i * step + Math.min(step - 4, 12 + text.split(" ").length / 2.6),
    text,
  }));
  return {
    id: s.id,
    title: s.title,
    startedAt: s.startedAt,
    duration: s.duration,
    platform: s.platform,
    status: "ready",
    ownerId: s.ownerId,
    attendeeIds: s.attendeeIds,
    speakers,
    transcript,
    summaries: {
      general: {
        templateId: "general",
        language: "en",
        sections: [
          { heading: "Meeting Purpose", paragraph: s.purpose },
          { heading: "Key Takeaways", bullets: s.takeaways.map((t, i) => ({ text: t, at: transcript[Math.min(i, transcript.length - 1)]?.start })) },
        ],
      },
    },
    actionItems: [],
    highlights: [],
    questions: [],
    comments: [],
    visibility: s.visibility ?? "some_teams",
    shareAccess: "domain",
    shares: [{ id: `sh_${s.id}`, target: s.ownerId, label: USER_NAMES[s.ownerId]!, sublabel: "", role: "owner", kind: "user" }],
    folderId: s.folderId,
    meetingType: s.meetingType ?? "Internal",
    thumbnailSeed: s.seed,
  };
}

const sketches: Sketch[] = [
  {
    id: "361140277", title: "Weekly Product Sync", startedAt: "2026-09-04T15:00:00", duration: 1680, platform: "zoom",
    ownerId: "u_nancy", attendeeIds: ["u_nancy", "u_priya", "u_sam", "u_ravi"], seed: 13, folderId: "f_product",
    purpose: "Weekly product sync on dashboard progress, usability findings, and the packaging analysis.",
    takeaways: ["Usability sessions scheduled for next week with five participants.", "Sam to present AI feature usage data at Thursday's strategy meeting.", "Ravi confirmed overview and usage views are feature complete."],
    lines: [
      ["u_nancy", "Let's go around quickly. Priya, where are we on the usability sessions?"],
      ["u_priya", "Five participants confirmed for next week, three from beta accounts and two new users. I'll share the script tomorrow."],
      ["u_sam", "I've got the AI feature usage cut ready. The headline is that summaries are used broadly but ask-anything isn't discovered. I'll bring the full deck Thursday."],
      ["u_ravi", "Overview and usage views are done. The team breakdown is in review. I'm starting on export after that."],
      ["u_nancy", "Great. Let's make sure the strategy meeting has everything it needs. Thanks all."],
    ],
  },
  {
    id: "361138812", title: "Halcyon Health – QBR", startedAt: "2026-09-02T17:00:00", duration: 2640, platform: "zoom",
    ownerId: "u_hannah", attendeeIds: ["u_hannah", "u_tom"], seed: 17, folderId: "f_halcyon", meetingType: "External", visibility: "all_teams",
    purpose: "Quarterly business review with Halcyon Health covering adoption, open requests, and the August renewal.",
    takeaways: ["Adoption is at 81% of licensed seats, up from 64% last quarter.", "Halcyon wants the client dashboard before renewal; beta access promised for early July.", "Two open support tickets to be resolved before the renewal conversation."],
    lines: [
      ["u_hannah", "Thanks for the time. I want to walk through adoption first, then your open requests, then talk about the renewal."],
      ["u_tom", "Adoption is at eighty-one percent of licensed seats, up from sixty-four last quarter, which is one of the strongest numbers we see."],
      ["u_hannah", "On requests, the big one is the dashboard. We're targeting a beta the first week of July and I'd like you in it."],
      ["u_tom", "For the renewal we'll send the proposal two weeks ahead so there's no surprise. The two open tickets will be closed before then."],
    ],
  },
  {
    id: "361131540", title: "1:1 Nancy / Priya", startedAt: "2026-08-28T16:30:00", duration: 1500, platform: "google_meet",
    ownerId: "u_nancy", attendeeIds: ["u_nancy", "u_priya"], seed: 19, visibility: "private",
    purpose: "Regular one-on-one covering the empty-state research, design system debt, and Priya's growth plan.",
    takeaways: ["Priya will lead the usability research for the dashboard end to end.", "Design system cleanup deferred until after the dashboard launch.", "Growth plan: Priya to present at the September all-hands."],
    lines: [
      ["u_nancy", "How are you feeling about the dashboard work?"],
      ["u_priya", "Good. I'd like to own the usability research end to end rather than hand it off. I think the empty-state finding shows why."],
      ["u_nancy", "Agreed, it's yours. Let's defer the design system cleanup until after launch so you're not split."],
      ["u_priya", "That works. And I'd like to present the research at the September all-hands if there's a slot."],
      ["u_nancy", "There is. I'll add you."],
    ],
  },
  {
    id: "361129903", title: "Marketing Weekly", startedAt: "2026-08-26T14:00:00", duration: 1920, platform: "zoom",
    ownerId: "u_lena", attendeeIds: ["u_lena", "u_nancy", "u_sam"], seed: 23, folderId: "f_gtm",
    purpose: "Marketing weekly on the launch content plan, mobile sign-up conversion, and the competitor comparison pages.",
    takeaways: ["Mobile sign-ups are 28% of volume but convert at half the desktop rate.", "Competitor comparison pages drove 12% of trial starts last month.", "Launch content plan for the dashboard due the week of the strategy meeting."],
    lines: [
      ["u_lena", "Two things. The mobile conversion problem and the comparison pages."],
      ["u_sam", "Mobile is twenty-eight percent of sign-ups and converts at about half the desktop rate. I'll have the full funnel by Friday."],
      ["u_lena", "That's the number I'll bring to the strategy meeting. On comparison pages, they drove twelve percent of trial starts, so I want to expand them."],
      ["u_nancy", "Both sound right. Get me the launch content plan the same week as the strategy meeting so we can align dates."],
    ],
  },
  {
    id: "361127455", title: "Candidate Interview – Senior Backend", startedAt: "2026-08-21T18:00:00", duration: 2700, platform: "google_meet",
    ownerId: "u_marcus", attendeeIds: ["u_marcus", "u_diego", "u_aisha"], seed: 29, visibility: "no_teams",
    purpose: "Panel interview for the senior backend engineer role focused on search infrastructure experience.",
    takeaways: ["Strong experience building vector search at scale at a previous employer.", "Panel recommends proceeding to the final round.", "Candidate available to start in six weeks."],
    lines: [
      ["u_marcus", "Tell us about the largest search system you've built and what you'd do differently."],
      ["u_aisha", "How did you handle retention and deletion in an indexed system? That's something we're planning now."],
      ["u_diego", "I'd recommend a final round. The retention answer was the most thoughtful we've heard."],
      ["u_marcus", "Agreed. I'll move them forward today."],
    ],
  },
  {
    id: "361124019", title: "Retro – Ingestion Pipeline", startedAt: "2026-08-14T15:00:00", duration: 2400, platform: "google_meet",
    ownerId: "u_diego", attendeeIds: ["u_diego", "u_aisha", "u_ravi", "u_marcus"], seed: 31, folderId: "f_eng",
    purpose: "Retrospective on the ingestion pipeline project: what to start, stop, and continue.",
    takeaways: ["Start: load-testing against the top 50 accounts before every release.", "Stop: nightly batch as the fallback path.", "Continue: pairing on production incidents."],
    lines: [
      ["u_diego", "Let's do start, stop, continue. Aisha, start with start."],
      ["u_aisha", "Start load-testing against the top fifty accounts before every release. It caught the multi-workspace issue."],
      ["u_ravi", "Stop keeping the nightly batch as a fallback. It hides problems."],
      ["u_marcus", "Continue pairing on incidents. The last two were resolved in under an hour because of it."],
    ],
  },
  {
    id: "361119870", title: "Northwind Logistics – Intro Call", startedAt: "2026-08-08T16:00:00", duration: 1260, platform: "zoom",
    ownerId: "u_tom", attendeeIds: ["u_tom", "u_grace"], seed: 37, folderId: "f_northwind", meetingType: "External", visibility: "all_teams",
    purpose: "Introductory call with Grace Holloway at Northwind Logistics to qualify the opportunity.",
    takeaways: ["Eleven regional ops teams with inconsistent meeting practices.", "IT sign-off required; security questions expected on the next call.", "Discovery call scheduled with IT manager Ben Carter."],
    lines: [
      ["u_tom", "Thanks for taking the call. What prompted you to look at this now?"],
      ["u_grace", "We have eleven regional teams and I can't see what any of them decided. My IT manager will have questions, so bring your security person next time."],
      ["u_tom", "Understood. I'll bring Hannah and we'll cover retention and access up front."],
    ],
  },
  {
    id: "361115502", title: "All-Hands – July", startedAt: "2026-07-30T17:00:00", duration: 3300, platform: "zoom",
    ownerId: "u_nancy", attendeeIds: ["u_nancy", "u_marcus", "u_priya", "u_diego", "u_hannah", "u_lena", "u_sam", "u_ravi", "u_aisha", "u_tom"], seed: 41, visibility: "all_teams",
    purpose: "Monthly all-hands covering Q3 results, the dashboard roadmap, and team announcements.",
    takeaways: ["Q3 net revenue retention at 112%.", "Dashboard launch targeted for mid-July.", "Two new hires starting in August."],
    lines: [
      ["u_nancy", "Welcome everyone. Q3 net revenue retention came in at one hundred and twelve percent, our best quarter yet."],
      ["u_marcus", "On the engineering side, the ingestion pipeline is nearly done and the dashboard is targeted for mid-July."],
      ["u_hannah", "Customer success is at a ninety-four percent CSAT, and two new hires start in August."],
      ["u_lena", "Marketing has the launch content plan in progress. Expect a lot of asks for screenshots."],
    ],
  },
  {
    id: "361110288", title: "Pricing Workshop", startedAt: "2026-07-17T14:00:00", duration: 3000, platform: "zoom",
    ownerId: "u_nancy", attendeeIds: ["u_nancy", "u_marcus", "u_lena", "u_sam", "u_hannah"], seed: 43, folderId: "f_product",
    purpose: "Workshop on packaging options for AI features ahead of the Q4 strategy decision.",
    takeaways: ["Three packaging options drafted: usage-based, higher tier, add-on.", "Inference cost per query estimated at six cents.", "Decision deferred to the Q4 strategy meeting pending usage data."],
    lines: [
      ["u_nancy", "We have three options on the table: usage-based, a higher tier, or an add-on."],
      ["u_marcus", "The cost side matters. Each ask-anything query is roughly six cents in inference."],
      ["u_sam", "I'll have usage data by segment before the strategy meeting so we can decide with numbers."],
      ["u_hannah", "Whatever we choose, existing customers need a soft landing."],
    ],
  },
];

const ready = sketches.map(fromSketch);

export const MEETINGS: Meeting[] = [
  processing,
  failed,
  scaleTime(standup, 1),
  scaleTime(productStrategy, 3540 / 1798),
  scaleTime(salesCall, 1815 / 930),
  ...ready,
].sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));

export const FOLDERS: Folder[] = [
  { id: "f_product", name: "Product", meetingIds: ["361135142", "361140277", "361110288"], ownerId: "u_nancy", teamId: "t_product" },
  { id: "f_eng", name: "Engineering", meetingIds: ["361148920", "361124019"], ownerId: "u_diego", teamId: "t_engineering" },
  { id: "f_northwind", name: "Northwind Logistics", meetingIds: ["361152077", "361119870"], ownerId: "u_tom", teamId: "t_gtm" },
  { id: "f_halcyon", name: "Halcyon Health", meetingIds: ["361138812"], ownerId: "u_hannah", teamId: "t_gtm" },
  { id: "f_gtm", name: "Go-to-Market", meetingIds: ["361129903"], ownerId: "u_lena", teamId: "t_gtm" },
];

export const PLAYLISTS: Playlist[] = [
  {
    id: "pl_onboarding",
    name: "New hire onboarding",
    description: "The best explanations of how we work, straight from the meetings.",
    clipIds: [
      { meetingId: "361135142", highlightId: "hl_ps_1" },
      { meetingId: "361135142", highlightId: "hl_ps_4" },
      { meetingId: "361152077", highlightId: "hl_sc_3" },
    ],
    ownerId: "u_nancy",
  },
  {
    id: "pl_objections",
    name: "Security objections",
    description: "How prospects raise retention and data concerns, and how we answer.",
    clipIds: [
      { meetingId: "361152077", highlightId: "hl_sc_1" },
      { meetingId: "361152077", highlightId: "hl_sc_4" },
    ],
    ownerId: "u_hannah",
  },
];

export const ALERTS: KeywordAlert[] = [
  { id: "al_1", keyword: "retention", scope: "team_calls", notify: "slack", matchCount: 6, createdAt: "2026-08-20T10:00:00" },
  { id: "al_2", keyword: "competitor", scope: "team_calls", notify: "email", matchCount: 2, createdAt: "2026-08-02T10:00:00" },
  { id: "al_3", keyword: "SOC 2", scope: "my_calls", notify: "email", matchCount: 3, createdAt: "2026-09-01T10:00:00" },
];

export function meetingById(id: string): Meeting | undefined {
  return MEETINGS.find((m) => m.id === id);
}
