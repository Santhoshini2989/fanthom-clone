import type { Meeting, Speaker, TranscriptSegment } from "../types";

const speakers: Speaker[] = [
  { id: "s_tom", name: "Tom Whitaker", pronouns: "he/him", color: "#8b5cf6", userId: "u_tom" },
  { id: "s_hannah", name: "Hannah Okafor", pronouns: "she/her", color: "#ec4899", userId: "u_hannah" },
  { id: "s_grace", name: "Grace Holloway", pronouns: "she/her", color: "#ef4444", userId: "u_grace" },
  { id: "s_ben", name: "Ben Carter", pronouns: "he/him", color: "#64748b", userId: "u_ben" },
];

let n = 0;
const seg = (speakerId: string, start: number, end: number, text: string): TranscriptSegment => ({
  id: `sc_${++n}`,
  speakerId,
  start,
  end,
  text,
});

const transcript: TranscriptSegment[] = [
  seg("s_tom", 5, 24, "Grace, Ben, thanks for joining. I've got Hannah with me, she leads customer success and she'll be your main contact after today if we go forward. I thought we'd spend the first ten minutes on where you are, then I'll show you the dashboard, and we'll leave time for Ben's security questions."),
  seg("s_grace", 25, 31, "That works. Ben has a lot of questions, so save time."),
  seg("s_ben", 32, 36, "I do. Fair warning."),
  seg("s_tom", 37, 52, "Noted. So Grace, when we spoke last month you said the pain was visibility across your regional teams. Can you say more about what that looks like day to day?"),
  seg("s_grace", 53, 132, "Sure. We have eleven regional ops teams, and each one runs their weekly review differently. Some record, some take notes, most do neither. So when I'm asked in the leadership meeting why the Midwest missed their SLA, I'm reconstructing it from Slack threads and memory. I've got two people who spend probably a day a week just chasing down what was decided in meetings they weren't in. That's the pain. The other thing is onboarding. We've hired forty people this year and every one of them asks the same questions in their first month, and the answers exist, they're just in someone's head."),
  seg("s_hannah", 133, 160, "That onboarding point comes up a lot with ops teams. One thing our customers do is build a playlist of the best explanations from recorded meetings, so new hires watch the actual conversation rather than a doc someone wrote six months ago."),
  seg("s_grace", 161, 168, "That would be genuinely useful. Ben, that's the thing you were skeptical about."),
  seg("s_ben", 169, 210, "I'm skeptical about recording everything, yes. My concern is where the recordings live, who can see them, and what happens when someone leaves. We have contracts with two federal customers and I can't have meeting recordings sitting in a system I don't control retention on. So before we get to the demo, I want to understand the retention story."),
  seg("s_tom", 211, 262, "Totally fair, and I'd rather deal with it now than at the end. Short version: recordings are stored encrypted, access is controlled per meeting and per team, and on the Business and Enterprise plans you can set a retention period, anything from thirty days to forever, and deletions are logged. When someone leaves, their recordings transfer to an admin rather than disappearing. Hannah, anything I'm missing?"),
  seg("s_hannah", 263, 285, "Just that the retention setting applies to transcripts and summaries too, not only the video. Some tools delete the video and keep the transcript forever, which is the thing that usually worries security teams."),
  seg("s_ben", 286, 311, "Okay, that's better than I expected. I'll want that in writing, and I'll want to see the SOC 2 report, but that's a reasonable starting point. What about the bot? Our people will not be happy with a bot joining every call."),
  seg("s_tom", 312, 362, "Two answers. First, the bot is optional per meeting type. Most of our customers record external calls with the bot, because it's visible and it announces itself, and record internal calls bot-free from the desktop app. Second, on your plan you can set the default so that people choose, or so that it's always on for certain meeting types. Grace, given the visibility problem, I'd suggest defaulting internal weekly reviews to on."),
  seg("s_grace", 363, 380, "I'd want that. If it's optional nobody will turn it on, that's the whole problem. Can I lock it for specific teams?"),
  seg("s_tom", 381, 392, "Yes. Team-level settings override the org default, and admins can lock them so users can't change it."),
  seg("s_grace", 393, 397, "Good."),
  seg("s_tom", 398, 415, "Let me share my screen and show you the dashboard, because I think that's where this gets concrete. Hannah, jump in whenever."),
  seg("s_tom", 416, 486, "So this is the team view. Every regional team's meetings, grouped by week. If I click into Midwest, I see their last review, and the summary at the top tells me the SLA miss was a staffing gap on the night shift that they flagged two weeks ago. Below that, the action items, with owners. And this is the part Grace asked about: I can ask a question across all the Midwest meetings, so 'when was the night shift staffing first raised' gives me the exact moment, with a link to the recording."),
  seg("s_grace", 487, 504, "Okay, that's the thing. That's exactly the thing. How far back does that go?"),
  seg("s_tom", 505, 518, "As far as your retention setting. If you keep meetings for a year, it searches a year."),
  seg("s_ben", 519, 546, "And that search, where does it run? Is the transcript being sent to a third-party model? Because if it is, I need to know which one and whether they train on it."),
  seg("s_hannah", 547, 590, "Fair question. The summaries and search use a model hosted by our provider under a contract that excludes training on customer data, and on the Enterprise plan you can additionally opt the whole org out of any model improvement on our side. We can put both of those in the security questionnaire. I'll send you our standard one after this call, it usually answers about ninety percent of what IT teams ask."),
  seg("s_ben", 591, 600, "Please do. That'd save me writing my own."),
  seg("s_tom", 601, 650, "Let me show one more thing, then we'll talk about next steps. This is the CRM sync. After a customer call, the summary and action items are pushed to the account record automatically. For you, Grace, that's less about CRM and more about your ops tooling, and the same mechanism works for Slack, so each regional team's channel gets the summary posted after their review without anyone doing anything."),
  seg("s_grace", 651, 680, "That would remove the 'did anyone write it down' question entirely. Okay. What does pricing look like for, call it, one hundred and twenty people across eleven teams? And what's the timeline if we said yes?"),
  seg("s_tom", 681, 740, "For a hundred and twenty seats on the Business plan, which is the one with retention controls and the team search, you're looking at twenty-five per seat per month on annual, so about thirty-six thousand a year. If Ben's requirements push you to Enterprise for the org-wide controls and SSO, it's thirty-five per seat. On timeline: most teams your size are fully rolled out in three weeks. We'd do a pilot with two teams first, Hannah would run that, and then roll out the rest once you're comfortable."),
  seg("s_grace", 741, 762, "Three weeks is faster than I expected. I'd want the pilot to be Midwest and Northeast, because those are the two with the biggest visibility problems."),
  seg("s_hannah", 763, 782, "That works. I'd suggest we start the pilot the week after next so Ben has time to review the security docs first. I'll send a proposed pilot plan tomorrow."),
  seg("s_ben", 783, 812, "I'll need about a week with the security questionnaire and the SOC 2 report. If those check out, I don't have an objection. I do want SSO, so assume Enterprise for the pricing conversation."),
  seg("s_tom", 813, 840, "Understood. I'll send a proposal with both options, Business and Enterprise, so you can see the difference, and I'll include the retention and SSO details in writing as Ben asked. Grace, is there anyone else who needs to be in the loop before you can make a decision?"),
  seg("s_grace", 841, 870, "Our CFO will want to see the proposal, but if the number is what you said and Ben signs off on security, I can approve it. Let's target a decision by the end of the month."),
  seg("s_tom", 871, 892, "Great. So: security questionnaire and SOC 2 from Hannah today, pilot plan tomorrow, proposal with both plans by Friday, decision end of month. Anything else?"),
  seg("s_ben", 893, 905, "Just send me the docs. And thanks for actually answering the retention question instead of dodging it."),
  seg("s_grace", 906, 918, "Thanks both. This was more useful than most of these calls."),
  seg("s_tom", 919, 930, "Thanks Grace, thanks Ben. Hannah will follow up today. Talk soon."),
];

export const salesCall: Meeting = {
  id: "361152077",
  title: "Northwind Logistics <> Brightline – Discovery",
  startedAt: "2026-09-09T14:00:00",
  duration: 1815,
  platform: "zoom",
  status: "ready",
  ownerId: "u_tom",
  attendeeIds: ["u_tom", "u_hannah", "u_grace", "u_ben"],
  externalAttendeeIds: ["u_grace", "u_ben"],
  speakers,
  transcript,
  summaries: {
    general: {
      templateId: "general",
      language: "en",
      sections: [
        {
          heading: "Meeting Purpose",
          paragraph: "Discovery call with Northwind Logistics to understand their cross-team visibility and onboarding pain, address security and retention concerns, demo the team dashboard, and agree next steps toward a decision by end of month.",
        },
        {
          heading: "Key Takeaways",
          bullets: [
            { lead: "Pain:", text: "Eleven regional ops teams run reviews inconsistently; two people spend a day a week reconstructing decisions; 40 new hires ask the same questions.", at: 53 },
            { lead: "Security:", text: "Ben needs retention controls, SSO, and the SOC 2 report in writing; retention applies to video, transcripts, and summaries.", at: 169 },
            { lead: "Pricing:", text: "~120 seats: Business at $25/seat/month annual (~$36k/yr) or Enterprise at $35 for SSO and org-wide controls; Ben asked to assume Enterprise.", at: 681 },
            { lead: "Timeline:", text: "Pilot with Midwest and Northeast starting the week after next; full rollout in ~3 weeks; decision targeted for end of month.", at: 741 },
          ],
        },
        {
          heading: "Topics",
          topics: [
            {
              title: "Customer Situation",
              bullets: [
                { text: "Leadership asks about SLA misses that Grace has to reconstruct from Slack threads and memory.", at: 53 },
                { text: "Onboarding: answers exist in people's heads; Hannah suggested highlight playlists for new hires.", at: 133 },
              ],
            },
            {
              title: "Security & Retention",
              bullets: [
                { text: "Federal customer contracts mean Ben must control retention; recordings are encrypted, per-meeting/team access, retention 30 days to forever with logged deletions.", at: 169 },
                { text: "Departing users' recordings transfer to an admin.", at: 211 },
                { text: "Model provider contract excludes training on customer data; Enterprise can opt the org out of model improvement.", at: 547 },
              ],
            },
            {
              title: "Capture Preferences",
              bullets: [
                { text: "Bot is optional per meeting type; internal reviews can default to on and be locked at the team level.", at: 312 },
              ],
            },
            {
              title: "Demo",
              bullets: [
                { text: "Team view grouped by week; Midwest SLA miss traced to a night-shift staffing gap flagged two weeks earlier.", at: 416 },
                { text: "Cross-meeting question 'when was the night shift staffing first raised' returns the exact moment with a link.", at: 416 },
                { text: "Summaries and action items push to CRM and Slack channels automatically.", at: 601 },
              ],
            },
          ],
        },
        {
          heading: "Next Steps",
          bullets: [
            { text: "Hannah: send the security questionnaire and SOC 2 report today; proposed pilot plan tomorrow.", at: 547 },
            { text: "Tom: proposal with Business and Enterprise options, including retention and SSO details in writing, by Friday.", at: 813 },
            { text: "Ben: review security docs within a week.", at: 783 },
            { text: "Grace: CFO review of the proposal; decision by end of month.", at: 841 },
          ],
        },
      ],
    },
    sales: {
      templateId: "sales",
      language: "en",
      sections: [
        { heading: "Prospect's Needs", bullets: [
          { text: "Cross-team visibility into decisions made in 11 regional weekly reviews.", at: 53 },
          { text: "Faster onboarding for ~40 new hires per year.", at: 53 },
          { text: "Automatic distribution of summaries to each team's Slack channel.", at: 651 },
        ] },
        { heading: "Challenges", bullets: [
          { text: "Inconsistent meeting practices across regions; two FTE-days per week spent reconstructing decisions.", at: 53 },
          { text: "IT (Ben) requires retention control, SSO, and no model training on customer data due to federal contracts.", at: 169 },
          { text: "Staff resistance to a bot joining every call.", at: 286 },
        ] },
        { heading: "Buying Journey", bullets: [
          { lead: "Champion:", text: "Grace Holloway (Director of Operations) can approve if the number holds and security signs off.", at: 841 },
          { lead: "Technical evaluator:", text: "Ben Carter (IT) needs ~1 week with the security questionnaire and SOC 2.", at: 783 },
          { lead: "Economic buyer:", text: "CFO will review the proposal.", at: 841 },
          { lead: "Timeline:", text: "Pilot the week after next (Midwest, Northeast); decision by end of month.", at: 741 },
        ] },
        { heading: "Pricing Discussed", bullets: [
          { text: "120 seats. Business $25/seat/mo annual (~$36k/yr). Enterprise $35/seat/mo for SSO and org-wide controls. Ben asked to assume Enterprise.", at: 681 },
        ] },
        { heading: "Next Steps", bullets: [
          { text: "Security questionnaire + SOC 2 (Hannah, today); pilot plan (Hannah, tomorrow); proposal with both plans (Tom, Friday).", at: 871 },
        ] },
      ],
    },
    sales_spiced: {
      templateId: "sales_spiced",
      language: "en",
      sections: [
        { heading: "Situation", paragraph: "Northwind Logistics runs 11 regional ops teams with inconsistent weekly reviews and ~40 new hires a year; two federal customer contracts constrain data handling." },
        { heading: "Pain", bullets: [
          { text: "Leadership questions about SLA misses are answered from Slack threads and memory.", at: 53 },
          { text: "Two people spend a day a week chasing decisions from meetings they weren't in.", at: 53 },
          { text: "New hires repeatedly ask questions whose answers live in people's heads.", at: 53 },
        ] },
        { heading: "Impact", bullets: [
          { text: "Roughly two FTE-days per week of reconstruction work; slower onboarding across 40 hires.", at: 53 },
          { text: "Cross-meeting search would give the exact moment a risk was first raised, with a link.", at: 487 },
        ] },
        { heading: "Critical Event", bullets: [
          { text: "Decision targeted by end of month; pilot the week after next so Ben can review security first.", at: 763 },
        ] },
        { heading: "Decision", bullets: [
          { text: "Grace approves if pricing holds and Ben signs off; CFO reviews the proposal; Enterprise assumed for SSO.", at: 841 },
        ] },
      ],
    },
  },
  actionItems: [
    { id: "ai_sc_1", text: "Send the security questionnaire and SOC 2 report to Ben", assigneeId: "u_hannah", done: true, at: 547, source: "ai" },
    { id: "ai_sc_2", text: "Send proposed pilot plan for Midwest and Northeast", assigneeId: "u_hannah", done: false, at: 763, source: "ai" },
    { id: "ai_sc_3", text: "Send proposal with Business and Enterprise options, including retention and SSO details in writing", assigneeId: "u_tom", done: false, at: 813, source: "ai" },
    { id: "ai_sc_4", text: "Review security docs and SOC 2 within a week", assigneeId: "u_ben", done: false, at: 783, source: "ai" },
  ],
  highlights: [
    { id: "hl_sc_1", typeId: "needs_review", start: 169, end: 210, title: "Ben raises retention and access concerns tied to federal customer contracts.", createdById: "u_tom", segmentIds: ["sc_8"], kind: "highlight" },
    { id: "hl_sc_2", typeId: "positive_reaction", start: 487, end: 504, title: "Grace reacts to cross-meeting search: 'That's exactly the thing.'", createdById: "u_tom", segmentIds: ["sc_18"], kind: "highlight" },
    { id: "hl_sc_3", typeId: "highlight", start: 681, end: 740, title: "Tom outlines pricing for 120 seats on Business vs Enterprise and a three-week rollout with a two-team pilot.", createdById: "u_hannah", segmentIds: ["sc_25"], kind: "highlight" },
    { id: "hl_sc_4", typeId: "feedback", start: 893, end: 905, title: "Ben appreciates a direct answer on retention rather than a dodge.", createdById: "u_hannah", segmentIds: ["sc_31"], kind: "highlight" },
  ],
  questions: [
    { id: "q_sc_1", text: "Can you say more about what that looks like day to day?", at: 37, askedById: "u_tom" },
    { id: "q_sc_2", text: "What about the bot? Our people will not be happy with a bot joining every call.", at: 286, askedById: "u_ben" },
    { id: "q_sc_3", text: "Can I lock it for specific teams?", at: 363, askedById: "u_grace" },
    { id: "q_sc_4", text: "How far back does that go?", at: 487, askedById: "u_grace" },
    { id: "q_sc_5", text: "Is the transcript being sent to a third-party model?", at: 519, askedById: "u_ben" },
    { id: "q_sc_6", text: "What does pricing look like for one hundred and twenty people across eleven teams?", at: 651, askedById: "u_grace" },
  ],
  comments: [
    { id: "c_sc_1", authorId: "u_hannah", text: "Questionnaire sent 3:40pm. Pilot plan draft in the shared folder.", createdAt: "2026-09-09T15:41:00" },
  ],
  visibility: "all_teams",
  shareAccess: "domain",
  shares: [
    { id: "sh_sc_1", target: "u_tom", label: "Tom Whitaker", sublabel: "tom@brightline.io", role: "owner", kind: "user" },
    { id: "sh_sc_2", target: "u_hannah", label: "Hannah Okafor", sublabel: "hannah@brightline.io", role: "admin", kind: "user" },
    { id: "sh_sc_4", target: "u_nancy", label: "Nancy Liang", sublabel: "nancy@brightline.io", role: "standard", kind: "user" },
    { id: "sh_sc_3", target: "grace.holloway@northwindlogistics.com", label: "Grace Holloway", sublabel: "grace.holloway@northwindlogistics.com", role: "limited", kind: "email" },
  ],
  folderId: "f_northwind",
  meetingType: "External",
  dealName: "Northwind Logistics – 120 seats",
  crmSynced: "hubspot",
  thumbnailSeed: 11,
};
