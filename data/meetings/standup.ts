import type { Meeting, Speaker, TranscriptSegment } from "../types";

const speakers: Speaker[] = [
  { id: "s_diego", name: "Diego Alvarez", pronouns: "he/him", color: "#10b981", userId: "u_diego" },
  { id: "s_aisha", name: "Aisha Abdali", pronouns: "she/her", color: "#3b82f6", userId: "u_aisha" },
  { id: "s_ravi", name: "Ravi Patel", pronouns: "he/him", color: "#a855f7", userId: "u_ravi" },
  { id: "s_marcus", name: "Marcus Bell", pronouns: "he/him", color: "#0ea5e9", userId: "u_marcus" },
];

let n = 0;
const seg = (speakerId: string, start: number, end: number, text: string): TranscriptSegment => ({
  id: `su_${++n}`,
  speakerId,
  start,
  end,
  text,
});

const transcript: TranscriptSegment[] = [
  seg("s_diego", 3, 14, "Morning. Let's keep it quick, Marcus has a hard stop at quarter past. Aisha, you want to start?"),
  seg("s_aisha", 15, 52, "Sure. Yesterday I finished the role definitions doc for the dashboard permissions and sent it to Ravi. Today I'm starting the access review checklist so we're ready for the week of the 6th. One blocker: staging is still on the old ingestion pipeline, so I can't test the multi-workspace case there. Diego, can someone flip staging over?"),
  seg("s_diego", 53, 68, "Yes, that's on me. I'll do it right after this, should take twenty minutes. Sorry, I thought I'd already done it."),
  seg("s_aisha", 69, 73, "No worries, thanks."),
  seg("s_ravi", 74, 121, "Okay, me. Yesterday I got the export flow working end to end, CSV and the scheduled email. Today I'm picking up the permissions model now that I have Aisha's doc. The one thing I want to flag is that the role names in the doc don't match what's in the API, the doc says 'viewer' and the API says 'member'. I'm going to go with the doc and rename the API, unless anyone objects."),
  seg("s_marcus", 122, 140, "Go with the doc. The API name was a placeholder. Just make sure the migration is backward compatible for the two customers on the old integration."),
  seg("s_ravi", 141, 148, "Will do. I'll add a compatibility alias for thirty days."),
  seg("s_diego", 149, 190, "For me, yesterday was mostly the pipeline edge case for accounts with more than ten workspaces. The fix is in review. Today, flipping staging, then I'm pairing with Aisha on the review checklist in the afternoon. No blockers. Oh, and the on-call handoff is tomorrow, so Ravi, you're up."),
  seg("s_ravi", 191, 196, "Got it. I saw the calendar invite."),
  seg("s_marcus", 197, 262, "Quick update from me, then I have to run. Product strategy meeting last week confirmed the July 14th date and the beta on July 1st, so nothing changes for this sprint. The entitlement checks for the new tier got scoped at four days, not a week, so I'll add them to the sprint after next. One ask: can we get the permissions model into a demo-able state by next Wednesday? Hannah wants to show it to Northwind before the beta email goes out."),
  seg("s_ravi", 263, 283, "Wednesday is tight but doable if the staging flip happens today. I'd say Wednesday afternoon, with the caveat that the multi-workspace case might still be rough."),
  seg("s_marcus", 284, 294, "That's fine, Northwind has three workspaces. Thanks all, I'm dropping."),
  seg("s_diego", 295, 312, "Thanks Marcus. Anything else? Aisha, do you want to talk about the retention setting now or leave it for planning?"),
  seg("s_aisha", 313, 352, "Leave it for planning, but I'll put a one-pager together so we don't spend the whole meeting on it. Short version: we need a per-account setting with a default of forever, a scheduled job, and an audit log entry when data is deleted. It's about three days of work if we do it before search, and much more if we do it after."),
  seg("s_diego", 353, 372, "Perfect, bring the one-pager to planning. Okay, that's it. Ravi, staging will be flipped by ten. Everyone go build things."),
];

export const standup: Meeting = {
  id: "361148920",
  title: "Engineering Standup",
  startedAt: "2026-09-11T09:30:00",
  duration: 872,
  platform: "google_meet",
  status: "ready",
  ownerId: "u_diego",
  attendeeIds: ["u_diego", "u_aisha", "u_ravi", "u_marcus"],
  speakers,
  transcript,
  summaries: {
    general: {
      templateId: "general",
      language: "en",
      sections: [
        {
          heading: "Meeting Purpose",
          paragraph: "Daily engineering standup covering dashboard permissions, the export flow, the ingestion edge case, and a request to demo the permissions model to Northwind.",
        },
        {
          heading: "Key Takeaways",
          bullets: [
            { lead: "Staging:", text: "Staging is still on the old ingestion pipeline; Diego will flip it today so Aisha can test the multi-workspace case.", at: 15 },
            { lead: "Role names:", text: "The API role 'member' will be renamed to 'viewer' to match the permissions doc, with a 30-day compatibility alias.", at: 74 },
            { lead: "Demo:", text: "Permissions model to be demo-able by next Wednesday afternoon for Northwind, who have three workspaces.", at: 197 },
            { lead: "Retention:", text: "Aisha will bring a one-pager on the data-retention setting to sprint planning (~3 days if built before search).", at: 313 },
          ],
        },
        {
          heading: "Topics",
          topics: [
            {
              title: "Updates",
              bullets: [
                { text: "Aisha: role definitions doc sent to Ravi; starting the access-review checklist for the week of the 6th.", at: 15 },
                { text: "Ravi: export flow (CSV and scheduled email) working end to end; starting the permissions model.", at: 74 },
                { text: "Diego: fix for accounts with 10+ workspaces is in review; pairing with Aisha on the checklist this afternoon.", at: 149 },
                { text: "Marcus: July 14th date and July 1st beta unchanged; entitlement checks scoped at 4 days for the sprint after next.", at: 197 },
              ],
            },
            {
              title: "Logistics",
              bullets: [
                { text: "On-call handoff is tomorrow; Ravi is up next.", at: 149 },
              ],
            },
          ],
        },
        {
          heading: "Next Steps",
          bullets: [
            { text: "Diego: flip staging to the new ingestion pipeline by 10am.", at: 53 },
            { text: "Ravi: rename API role to 'viewer' with a 30-day alias; permissions demo-able by Wednesday afternoon.", at: 141 },
            { text: "Aisha: retention setting one-pager for sprint planning.", at: 313 },
          ],
        },
      ],
    },
  },
  actionItems: [
    { id: "ai_su_1", text: "Flip staging to the new ingestion pipeline", assigneeId: "u_diego", done: true, at: 53, source: "ai" },
    { id: "ai_su_2", text: "Rename API role 'member' to 'viewer' with a 30-day compatibility alias", assigneeId: "u_ravi", done: false, at: 141, source: "ai" },
    { id: "ai_su_3", text: "Get the permissions model demo-able by Wednesday afternoon for Northwind", assigneeId: "u_ravi", done: false, at: 263, source: "ai" },
    { id: "ai_su_4", text: "Write a one-pager on the data-retention setting for sprint planning", assigneeId: "u_aisha", done: false, at: 313, source: "ai" },
  ],
  highlights: [],
  questions: [
    { id: "q_su_1", text: "Diego, can someone flip staging over?", at: 15, askedById: "u_aisha" },
    { id: "q_su_2", text: "Can we get the permissions model into a demo-able state by next Wednesday?", at: 197, askedById: "u_marcus" },
  ],
  comments: [],
  visibility: "some_teams",
  shareAccess: "added",
  shares: [
    { id: "sh_su_1", target: "u_diego", label: "Diego Alvarez", sublabel: "diego@brightline.io", role: "owner", kind: "user" },
    { id: "sh_su_3", target: "u_nancy", label: "Nancy Liang", sublabel: "nancy@brightline.io", role: "standard", kind: "user" },
    { id: "sh_su_2", target: "t_engineering", label: "Engineering", sublabel: "4 people", role: "standard", kind: "team" },
  ],
  folderId: "f_eng",
  meetingType: "Internal",
  thumbnailSeed: 3,
};
