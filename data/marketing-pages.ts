import type { MarketingSection } from "@/components/marketing/stub-page";

export interface StubContent {
  eyebrow?: string;
  title: string;
  intro: string;
  sections?: MarketingSection[];
  related?: { label: string; href: string }[];
  legal?: boolean;
}

/** Copy for secondary marketing routes. Overview copy is verbatim from fathom.ai/overview; the rest paraphrases the nav blurbs. */
export const OVERVIEW: StubContent = {
  eyebrow: "How it works",
  title: "Meeting intelligence built around you",
  intro:
    "Capture meetings, uncover insights, and connect your team's tools so meeting context is already there when you need it. Fathom turns meetings into momentum in minutes.",
  sections: [
    { eyebrow: "Never miss what matters", title: "Instant AI summaries in your favorite meeting platform", body: "Coverage before, during, and after calls with live summaries and action items." },
    { eyebrow: "Never miss what matters", title: "Transcription built for real conversations", body: "Handles multiple speakers, accents, and cross-talk with accurate attribution." },
    { eyebrow: "Never miss what matters", title: "Acronym city? No problem.", body: "Custom dictionaries for company-specific language." },
    { eyebrow: "Capture on your terms", title: "Three ways to capture", body: "Transcript-only (bot-free), audio + transcript (bot-free), or full audio + video with the notetaker." },
    { eyebrow: "Stay fully present", title: "Live summaries and a private scratchpad", body: "Desktop app for meeting alerts, iOS app for in-person meetings." },
    { eyebrow: "Turn every meeting into answers", title: "Ask Fathom", body: "Search across calls and uncover decisions, feedback, objections, and competitor mentions." },
    { eyebrow: "Works everywhere you already work", title: "Sync with your tools", body: "Fathom syncs with Slack, Salesforce, HubSpot, Asana, Notion, Zapier." },
    { eyebrow: "Power your AI stack", title: "Meeting context in Claude and ChatGPT", body: "Integrations with Claude and ChatGPT plus public API and MCP support." },
    { eyebrow: "Save 38 minutes per meeting", title: "Start today, for free", body: "Unlimited recordings, instant summaries, integrations with LLMs & more." },
  ],
  related: [
    { label: "Pricing", href: "/pricing" },
    { label: "Integrations", href: "/integrations" },
    { label: "What's new", href: "/whats-new" },
  ],
};

export const SOLUTIONS: Record<string, StubContent> = {
  sales: {
    eyebrow: "Fathom for Sales",
    title: "Stay sharp, engage deeper, close faster",
    intro: "Fathom captures context, tracks engagement and updates your CRM, while you handle the close. AI Scorecards help managers coach with confidence, improving performance effortlessly.",
    sections: [
      { title: "CRM field sync", body: "Update Salesforce and HubSpot records after meetings automatically." },
      { title: "Deal view", body: "Insights summarized across every call on a deal." },
      { title: "Sales templates", body: "SPICED, MEDDPICC, BANT and Sandler summaries out of the box.", bullets: ["Sales", "Sales – SPICED", "Sales – MEDDPICC", "Sales – BANT"] },
      { title: "AI scorecards", body: "Grade calls consistently and coach with evidence." },
      { title: "Ask Fathom", body: "“What objections came up this week?” answered across calls." },
      { title: "Follow-up emails", body: "Drafted from action items, ready to send." },
    ],
    related: [{ label: "Pricing", href: "/pricing?plan=teams" }, { label: "HubSpot integration", href: "/integrations/hubspot" }],
  },
  "customer-success": {
    eyebrow: "Fathom for Customer Success",
    title: "Stronger relationships, better retention",
    intro: "Fathom captures key moments, surfaces risks and opportunities, automates CRM updates and follow-ups, and spots trends across conversations — so your team can spend less time on admin and more time delivering value.",
    sections: [
      { title: "Customer view", body: "Every conversation with an account in one place." },
      { title: "Keyword alerts", body: "Get notified when churn signals or competitors are mentioned." },
      { title: "Customer Success templates", body: "Experiences, challenges, goals, and Q&A – plus REACH." },
    ],
    related: [{ label: "Pricing", href: "/pricing?plan=teams" }],
  },
  marketing: {
    eyebrow: "Fathom for Marketing",
    title: "Less clerical, more creative",
    intro: "Spot trending feedback and changes in user sentiment, harvest invaluable insights for content, capture context, campaigns, brainstorms, project calls, and so much more.",
    sections: [
      { title: "Voice of customer", body: "Search every call for the words customers actually use." },
      { title: "Highlight playlists", body: "Clip the best moments and share them with the team." },
      { title: "Project templates", body: "Project Update and Project Kick-Off summaries." },
    ],
    related: [{ label: "Pricing", href: "/pricing" }],
  },
  teams: {
    eyebrow: "Fathom for Teams",
    title: "Shared visibility. Smarter execution.",
    intro: "Fathom gives teams a shared source of truth across every customer conversation, internal sync, and strategy call – so decisions are visible, follow-through is consistent, and nothing gets lost between meetings.",
    sections: [
      { title: "Team Calls library", body: "Recordings visible to the teams you choose." },
      { title: "Folders & comments", body: "Organize by customer or project and discuss inside the recording." },
      { title: "Account-wide Ask Fathom", body: "Ask questions across all your team’s meetings." },
    ],
    related: [{ label: "Pricing", href: "/pricing?plan=teams" }],
  },
};

const integration = (name: string, blurb: string, bullets: string[]): StubContent => ({
  eyebrow: "Integration",
  title: `Fathom + ${name}`,
  intro: blurb,
  sections: [
    { title: "What syncs", body: `Summaries, action items and highlights flow into ${name} without you lifting a finger.`, bullets },
    { title: "Setup", body: "Connect from Settings → Integrations. Admins can enable it for the whole organization." },
    { title: "Plans", body: "Available on all plans; CRM field sync requires Business." },
  ],
  related: [{ label: "All integrations", href: "/integrations" }, { label: "Settings", href: "/customize" }],
});

export const INTEGRATIONS: Record<string, StubContent> = {
  asana: integration("Asana", "Turn action items into Asana tasks the moment a meeting ends.", ["Action items → tasks", "Assignees preserved", "Link back to the moment"]),
  chatgpt: integration("ChatGPT", "Your meeting data, now inside ChatGPT via MCP.", ["Ask about any meeting", "Summaries and transcripts", "No tab switching"]),
  claude: integration("Claude", "Query your meetings from Claude with the Fathom MCP server.", ["Recordings, summaries, action items", "Custom AI workflows", "Programmatic access"]),
  hubspot: integration("HubSpot", "Log summaries and update deal fields automatically after every call.", ["Contacts, companies, deals", "CRM field sync", "Deal insights"]),
  salesforce: integration("Salesforce", "Sync call summaries and highlights to Contacts, Accounts and Opportunities.", ["Field sync", "Activity logging", "Deal view"]),
  zapier: integration("Zapier", "Trigger any workflow when a recording is ready.", ["Recording ready trigger", "Summary & action items as fields", "Thousands of apps"]),
};

export const INTEGRATIONS_INDEX: StubContent = {
  eyebrow: "Integrations",
  title: "Works everywhere you already work",
  intro: "Meeting notes, insights and action items sync automatically with your tools – Slack, Salesforce, HubSpot, Notion, Asana, and beyond.",
  sections: ["asana", "chatgpt", "claude", "hubspot", "salesforce", "zapier"].map((k) => ({
    title: INTEGRATIONS[k]!.title.replace("Fathom + ", ""),
    body: INTEGRATIONS[k]!.intro,
  })),
  related: ["asana", "chatgpt", "claude", "hubspot", "salesforce", "zapier"].map((k) => ({ label: INTEGRATIONS[k]!.title.replace("Fathom + ", ""), href: `/integrations/${k}` })),
};

export const RESOURCE_HUB: StubContent = {
  eyebrow: "Resources",
  title: "Resource Hub",
  intro: "Guides, webinars and templates to get the most out of Fathom.",
  sections: [
    { title: "Getting started", body: "Connect your calendar, pick a capture mode, and join your next meeting." },
    { title: "Power user webinars", body: "Live sessions on Ask Fathom, templates and team workflows." },
    { title: "Help Center", body: "Step-by-step articles for every feature." },
  ],
  related: [{ label: "Help Center", href: "https://help.fathom.video/" }, { label: "What's new", href: "/whats-new" }],
};

export const WHATS_NEW: StubContent = {
  eyebrow: "What's new",
  title: "It’s a whole new orbit",
  intro: "Bot-free capture, a redesigned desktop app, ChatGPT & Claude integrations, Slack Huddles and account-wide Ask Fathom.",
  sections: [
    { eyebrow: "Launched", title: "Bot-Free Capture (Mac)", body: "Choose how Fathom captures your meetings – bot or no bot, video audio or transcript-only." },
    { eyebrow: "Launched", title: "Live Summaries & Redesigned Desktop App (Mac)", body: "Real-time summaries that build during calls, an integrated scratchpad, and a unified post-meeting workspace." },
    { eyebrow: "Launched", title: "ChatGPT & Claude Integrations (MCP)", body: "Meeting knowledge is now queryable directly from ChatGPT or Claude." },
    { eyebrow: "Launched", title: "Slack Huddles Support", body: "Bot-free recording captures Slack Huddles with transcripts, summaries, and action items." },
    { eyebrow: "Launched", title: "Account-Wide Ask Fathom", body: "Search across all accessible team meetings with role-based prompts." },
    { eyebrow: "Coming soon", title: "iOS app · CLI · Windows desktop app", body: "Mobile capture, a command-line interface for developers, and Windows support." },
  ],
  related: [{ label: "Overview", href: "/overview" }, { label: "Pricing", href: "/pricing" }],
};

export const ABOUT: StubContent = {
  eyebrow: "Company",
  title: "About Us",
  intro: "Fathom is on a mission to make meetings worth having. We build the AI notetaker used at more than 300,000 companies.",
  sections: [
    { title: "Remote-first", body: "A distributed team across North America and Europe." },
    { title: "Customer-obsessed", body: "#1 rated on G2 with 6,500+ reviews." },
    { title: "Careers", body: "We’re hiring across engineering, product and go-to-market." },
  ],
  related: [{ label: "Careers", href: "https://jobs.ashbyhq.com/fathom.video" }],
};

export const PARTNERS: StubContent = {
  eyebrow: "Partners",
  title: "Partner with Fathom",
  intro: "Affiliate, referral and technology partnerships for agencies, consultants and platforms.",
  sections: [
    { title: "Affiliate program", body: "Earn recurring revenue for every team you refer." },
    { title: "Qualified Portfolio Program", body: "Startups affiliated with select VCs get up to 2 years free of Fathom Team." },
    { title: "Technology partners", body: "Build on the public API and MCP server." },
  ],
};

export const DEMO: StubContent = {
  eyebrow: "Book a demo",
  title: "See Fathom for your team",
  intro: "A 30-minute walkthrough of capture modes, Ask Fathom, templates and the team workspace. Our sales team will follow up to schedule.",
  sections: [
    { title: "Who it’s for", body: "Teams of 2 to 2,000 evaluating Team, Business or Enterprise." },
    { title: "What we’ll cover", body: "Your workflow, integrations, security requirements and rollout plan." },
    { title: "Prefer to try it?", body: "Every paid plan starts with a free trial and a 90 day guarantee." },
  ],
};

export const VS: Record<string, StubContent> = Object.fromEntries(
  [
    ["others", "Competitor Overview"],
    ["fireflies", "Fireflies"],
    ["granola", "Granola"],
    ["gong", "Gong"],
    ["otter", "Otter"],
    ["read-ai", "Read AI"],
    ["zoom", "ZoomMate"],
    ["google-meet", "Google Meet's Gemini"],
    ["built-in", "Built-In Solutions"],
  ].map(([slug, name]) => [
    slug,
    {
      eyebrow: "Compare",
      title: slug === "others" ? "Fathom vs. the rest" : `Fathom vs. ${name}`,
      intro: `How Fathom compares to ${slug === "others" ? "other AI notetakers" : name} on capture options, accuracy, price and team features.`,
      sections: [
        { title: "Free forever", body: "Unlimited recordings and summaries at no cost for individuals." },
        { title: "Bot-free capture", body: "Record without a bot joining the call." },
        { title: "Ask Fathom", body: "Conversational search across every meeting." },
      ],
      related: [{ label: "Pricing", href: "/pricing" }, { label: "Overview", href: "/overview" }],
    } satisfies StubContent,
  ]),
);

export const TERMS: StubContent = {
  legal: true,
  title: "Terms of Service",
  intro: "This clone reproduces the structure of Fathom’s legal pages for navigation completeness only. The text below is placeholder legal copy, not Fathom’s actual terms.",
  sections: [
    { title: "1. Acceptance", body: "By using the service you agree to these terms. If you use the service on behalf of an organization, you agree on its behalf." },
    { title: "2. Recordings and consent", body: "You are responsible for obtaining any consent required by law before recording a meeting. The recording notification banner and consent emails help, but do not replace your obligations." },
    { title: "3. Your content", body: "You retain ownership of your recordings, transcripts and summaries. You grant the service the rights needed to process them on your behalf." },
    { title: "4. Termination", body: "You may delete your account at any time from Settings. Recordings are deleted according to your retention settings." },
  ],
};

export const PRIVACY: StubContent = {
  legal: true,
  title: "Privacy Policy",
  intro: "This clone reproduces the structure of Fathom’s legal pages for navigation completeness only. The text below is placeholder copy, not Fathom’s actual policy.",
  sections: [
    { title: "Data we process", body: "Calendar events, meeting audio and video, transcripts and the summaries generated from them." },
    { title: "AI processing", body: "Summaries and search use a model provider under a contract that excludes training on customer data. Enterprise organizations can exclude their data from model improvement." },
    { title: "Retention", body: "Data is kept until you delete it or until the retention period set by your organization elapses." },
    { title: "Security", body: "Encrypted in transit and at rest. SOC 2 Type II, GDPR and HIPAA compliant." },
  ],
};
