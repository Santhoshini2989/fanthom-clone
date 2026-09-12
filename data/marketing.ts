/** Copy captured verbatim from fathom.ai on 2026-09-12. */

export const ANNOUNCEMENT = {
  text: "IT'S A WHOLE NEW ORBIT. ANNOUNCING BOT-FREE CAPTURE, A NEW DESKTOP APP, CHATGPT & CLAUDE INTEGRATIONS & MORE",
  cta: "SEE WHAT'S NEW",
  href: "/whats-new",
};

export const NAV = {
  primary: [
    { label: "Overview", href: "/overview" },
    {
      label: "Solutions",
      items: [
        { label: "For sales", href: "/solutions/sales", blurb: "Stay sharp, engage deeper, close faster" },
        { label: "For customer success", href: "/solutions/customer-success", blurb: "Stronger relationships, better retention" },
        { label: "For marketing", href: "/solutions/marketing", blurb: "Less clerical, more creative" },
        { label: "For teams", href: "/solutions/teams", blurb: "Shared visibility. Smarter execution." },
      ],
    },
    {
      label: "Integrations",
      items: [
        { label: "Asana", href: "/integrations/asana" },
        { label: "ChatGPT", href: "/integrations/chatgpt" },
        { label: "Claude", href: "/integrations/claude" },
        { label: "Hubspot", href: "/integrations/hubspot" },
        { label: "Salesforce", href: "/integrations/salesforce" },
        { label: "Zapier", href: "/integrations/zapier" },
        { label: "Public API & MCP", href: "https://developers.fathom.ai/", external: true },
      ],
      footer: { label: "See All Integrations →", href: "/integrations" },
    },
    {
      label: "Resources",
      items: [
        { label: "Resource Hub", href: "/resource-hub" },
        { label: "Partner with Fathom", href: "/partner-programs" },
        { label: "Help Center", href: "https://help.fathom.video/", external: true },
      ],
    },
    { label: "Pricing", href: "/pricing" },
  ],
  secondary: [
    { label: "Book a Demo", href: "/book-a-demo" },
    { label: "Log In", href: "/users/sign_in" },
  ],
  cta: { label: "SIGN UP FREE", href: "/users/sign_up" },
};

export const HERO = {
  title: "AI notetaking that is out of this world",
  subtitle: "Fathom summarizes your meetings so you can focus on the conversation.",
  subtitleStrong: "Now available bot-free.",
  cta: "GET STARTED - FREE FOREVER",
  trust: ["SOC 2 Type II", "GDPR", "HIPAA Compliant", "SSO / SCIM"],
  rating: { score: "5.0/5.0", label: "#1 rated", reviews: "6,500+ reviews" },
  usedAt: "Used at 300K+ companies",
};

export const LOGO_STRIP = ["HubSpot", "Adobe", "Zapier", "Grubhub", "EA", "Calendly", "Notion", "Asana"];

export const CAPTURE_SECTION = {
  title: "Capture notes your way – bot or no bot – so you can stay focused on the meeting",
  cards: [
    { title: "AI summaries instantly available after your call", kind: "summary" },
    { title: "Your meeting data, now inside ChatGPT, Claude, and more", kind: "llm" },
    { title: "Automatically monitor key topics so you never miss critical moments", kind: "monitor" },
  ],
};

export const AUDIENCE = {
  title: "Whether you’re a team of 1 or 1,000, Fathom’s got your back",
  tabs: ["Fathom for teams", "Fathom for individuals"],
  teams: {
    headline: "Shared visibility. Smarter execution.",
    body: "Fathom gives teams a shared source of truth across every customer conversation, internal sync, and strategy call – so decisions are visible, follow-through is consistent, and nothing gets lost between meetings.",
    body2: "Search conversations, spot patterns, and keep work moving without the manual work.",
    cta: "SEE OUR PRICING",
    ctaHref: "/pricing?plan=teams",
    points: [
      "Automatic notes, summaries, and updates reduce follow-ups and admin across the team.",
      "Turn conversations into clear next steps that move deals and projects forward.",
      "Keep decisions, commitments, and customer signals visible across meetings and teams.",
      "Spot patterns, risks, and opportunities across conversations before they become problems.",
    ],
  },
  individuals: {
    headline: "Never take notes again.",
    body: "Fathom records, transcribes, and summarizes your meetings so you can stay present. Ask anything about a call and get an answer in seconds.",
    body2: "Free forever for individuals – unlimited recordings, instant summaries, and integrations with the tools you already use.",
    cta: "See our pricing",
    ctaHref: "/pricing?plan=individuals",
    points: [
      "Instant summaries and action items delivered straight to your inbox.",
      "Highlight the moments that matter and share clips with one click.",
      "Ask Fathom to find what was said, when, and by whom.",
      "Works with Zoom, Google Meet, and Microsoft Teams.",
    ],
  },
};

export const PILLARS = [
  {
    eyebrow: "Clarity",
    title: "Unforgettable meetings...quite literally",
    body: "Shockingly accurate transcripts, instant summaries, and action items with consistent quality across every call – delivered straight to your inbox, like magic.",
    cta: "GET STARTED. IT’S FREE.",
    accent: "cyan",
  },
  {
    eyebrow: "Momentum",
    title: "Eliminate overhead & maximize productivity",
    body: "'Ask Fathom' anything about your meetings – a place to search everything, and get customizable AI summaries tailored to your team's workflow and priorities so you spend less time searching and more time doing.",
    cta: "GET STARTED. IT’S FREE.",
    accent: "purple",
  },
  {
    eyebrow: "Ease",
    title: "Works wherever you do",
    body: "Meeting notes, insights and action items sync automatically with your tools – Slack, Salesforce, HubSpot, Notion, Asana, and beyond – without you lifting a finger.",
    cta: "GET STARTED. IT’S FREE.",
    accent: "pink",
  },
];

export const STATS = {
  title: "Fathom teams work smarter",
  items: [
    { value: "95% of users", label: "say Fathom helps them stay fully present in meetings" },
    { value: "6+ hours saved", label: "per team member every week on follow-up work" },
    { value: "3X Faster", label: "from meeting insights to actionable next steps" },
  ],
  tagline: "Shared understanding. Faster execution. Better results.",
  headline: "Make your team unstoppable",
  cta: "TRY FATHOM FOR YOUR TEAM",
};

export const WORKS_WHERE = {
  eyebrow: "Zero friction, maximum flexibility.",
  title: "Works where you meet",
  apps: ["Google Meet", "Zoom", "Gmail", "Slack", "Microsoft Teams", "Asana"],
  body: "Fathom adapts to your workflow, not the other way around.",
};

export const TEAMS_FLOW = {
  title: "Empower your team’s best work with seriously accurate AI notetaking",
  subtitle: "Every team in flow",
  cta: "GET STARTED. IT’S FREE.",
  roles: [
    {
      name: "Sales",
      title: "Stay sharp, engage deeper, close faster",
      body: "Fathom captures context, tracks engagement and updates your CRM, while you handle the close. AI Scorecards help managers coach with confidence, improving performance effortlessly.",
      cta: "SEE FATHOM FOR SALES",
      href: "/solutions/sales",
    },
    {
      name: "Customer Success",
      title: "Stronger relationships, better retention",
      body: "Fathom captures key moments, surfaces risks and opportunities, automates CRM updates and follow-ups, and spots trends across conversations — so your team can spend less time on admin and more time delivering value.",
      cta: "SEE FATHOM FOR CS",
      href: "/solutions/customer-success",
    },
    {
      name: "Marketing",
      title: "Less clerical, more creative",
      body: "Spot trending feedback and changes in user sentiment, harvest invaluable insights for content, capture context, campaigns, brainstorms, project calls, and so much more.",
      cta: "SEE FATHOM FOR MARKETING",
      href: "/solutions/marketing",
    },
    {
      name: "Operations",
      title: "Less overhead, more progress",
      body: "Track everything, get clear action points from every conversation, and watch as your team moves from ‘we should do that’ to ‘consider it done’",
      cta: "HOW IT WORKS",
      href: "/overview",
    },
    {
      name: "HR & Talent",
      title: "Stronger, happier teams",
      body: "Spot the patterns that predict success, streamline interviews and evaluate candidates with Ask Fathom. Highlights playlists give new employees the tools to flourish.",
      cta: "HOW IT WORKS",
      href: "/overview",
    },
    {
      name: "Product & Engineering",
      title: "Build what matters",
      body: "Track and synthesize feature requests, monitor user satisfaction, and build the features that matter most to your customers.",
      cta: "HOW IT WORKS",
      href: "/overview",
    },
  ],
};

export const FINAL_CTA = {
  eyebrow: "Never miss what matters",
  title: "Stop guessing. Ask Fathom.",
  subtitle: "Start today, for free.",
  cta: "GET STARTED. IT’S FREE.",
};

export const FOOTER = {
  columns: [
    {
      title: "Product",
      links: [
        { label: "Overview", href: "/overview" },
        { label: "Pricing", href: "/pricing" },
        { label: "What's New", href: "/whats-new" },
        { label: "Integrations", href: "/integrations" },
        { label: "Public API & MCP", href: "https://developers.fathom.ai/" },
      ],
    },
    {
      title: "Solutions",
      links: [
        { label: "For Sales", href: "/solutions/sales" },
        { label: "For Customer Success", href: "/solutions/customer-success" },
        { label: "For Marketing", href: "/solutions/marketing" },
        { label: "For Teams", href: "/solutions/teams" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Resource Hub", href: "/resource-hub" },
        { label: "Help Center", href: "https://help.fathom.video/" },
        { label: "Partner with Fathom", href: "/partner-programs" },
        { label: "Status", href: "https://status.fathom.video/" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about-us" },
        { label: "Careers", href: "https://jobs.ashbyhq.com/fathom.video" },
        { label: "Security & Compliance", href: "https://trust.fathom.video/" },
      ],
    },
    {
      title: "Compare",
      links: [
        { label: "Competitor Overview", href: "/vs/others" },
        { label: "Fathom vs. Fireflies", href: "/vs/fireflies" },
        { label: "Fathom vs. Granola", href: "/vs/granola" },
        { label: "Fathom vs. Gong", href: "/vs/gong" },
        { label: "Fathom vs. Otter", href: "/vs/otter" },
        { label: "Fathom vs. Read AI", href: "/vs/read-ai" },
        { label: "Fathom vs. ZoomMate", href: "/vs/zoom" },
        { label: "Fathom vs. Google Meet's Gemini", href: "/vs/google-meet" },
        { label: "Fathom vs. Built-In Solutions", href: "/vs/built-in" },
      ],
    },
  ],
  legal: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
};

export type PlanAudience = "individuals" | "teams";

export interface Plan {
  id: string;
  audience: PlanAudience;
  eyebrow: string;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  priceNote?: string;
  seatNote?: string;
  cta: string;
  ctaKind: "yellow" | "outline";
  guarantee: string;
  features: string[];
  accent: "none" | "cyan" | "purple";
}

export const PLANS: Plan[] = [
  {
    id: "free",
    audience: "individuals",
    eyebrow: "FOR INDIVIDUALS",
    name: "Free",
    priceMonthly: 0,
    priceAnnual: 0,
    priceNote: "Free forever.",
    cta: "GET STARTED",
    ctaKind: "yellow",
    guarantee: "90 day guarantee",
    features: [
      "Unlimited recordings + transcriptions",
      "Choice of bot-free (in beta) or bot capture",
      "Instant AI call summaries",
      "Clips, playlists + search across calls",
    ],
    accent: "none",
  },
  {
    id: "premium",
    audience: "individuals",
    eyebrow: "FOR INDIVIDUALS",
    name: "Premium",
    priceMonthly: 19,
    priceAnnual: 16,
    seatNote: "/month / per user",
    cta: "START FREE TRIAL",
    ctaKind: "outline",
    guarantee: "90 day guarantee",
    features: [
      "Everything from Free",
      "Advanced call summaries",
      "AI-generated action items",
      "Conversational meeting assistant",
      "Custom meeting bot",
    ],
    accent: "cyan",
  },
  {
    id: "team_ind",
    audience: "individuals",
    eyebrow: "FOR TEAMS",
    name: "Team",
    priceMonthly: 19,
    priceAnnual: 15,
    seatNote: "/month / per user",
    priceNote: "(2 user min)",
    cta: "START FREE TEAM TRIAL (2+ USERS)",
    ctaKind: "outline",
    guarantee: "90 day guarantee",
    features: [
      "Everything from Premium",
      "Global search across calls",
      "Playlists of highlights from meetings",
      "Collaboration using comments, folders, keyword alerts, + more",
    ],
    accent: "purple",
  },
  {
    id: "team",
    audience: "teams",
    eyebrow: "FOR TEAMS",
    name: "Team",
    priceMonthly: 19,
    priceAnnual: 15,
    seatNote: "/month / per user",
    priceNote: "(2 user min)",
    cta: "START FREE TRIAL",
    ctaKind: "yellow",
    guarantee: "90 day guarantee",
    features: [
      "Unlimited meetings captured & instant AI summaries",
      "AI generated action items",
      "Conversational meeting assistant",
      "Playlists of highlights from meetings",
      "Collaboration using comments, folders, keyword alerts, + more",
    ],
    accent: "none",
  },
  {
    id: "business",
    audience: "teams",
    eyebrow: "FOR TEAMS",
    name: "Business",
    priceMonthly: 29,
    priceAnnual: 25,
    seatNote: "/month / per user",
    priceNote: "(2 user min)",
    cta: "START FREE TRIAL",
    ctaKind: "outline",
    guarantee: "90 day guarantee",
    features: [
      "Everything from Team",
      "CRM field sync, updating records after meetings automatically",
      "Deal View summarizing insights",
      "Coaching metrics & AI scorecards",
      "Advanced call summaries, including custom summaries*",
    ],
    accent: "cyan",
  },
  {
    id: "enterprise",
    audience: "teams",
    eyebrow: "FOR TEAMS",
    name: "Enterprise",
    priceMonthly: 39,
    priceAnnual: 35,
    seatNote: "/month / per user",
    priceNote: "(2 user min)",
    cta: "BOOK A MEETING",
    ctaKind: "outline",
    guarantee: "90 day guarantee",
    features: [
      "Everything from Business",
      "Launch Assist Onboarding Program",
      "Organization-wide security controls",
      "SSO & SCIM provisioning",
      "Custom data retention programs",
      "Dedicated Success Manager & priority Support SLAs",
    ],
    accent: "purple",
  },
];

export const PRICING_EXTRAS = {
  freeBanner: {
    label: "Free plan",
    text: "Unlimited recordings, instant call summaries, integrations with LLMs & more.",
    cta: "Sign up. Free forever. →",
  },
  talkToSales: "Get the best plan for your team. Talk to sales →",
  moreWays: {
    title: "More ways to get started with Fathom",
    cards: [
      { title: "Qualified Portfolio Program", body: "Affilliated startups of select VCs & accelerators get up to 2 years free of Fathom Team.", cta: "CHECK ELIGIBILITY →" },
      { title: "Get 10 free seats for nonprofits", body: "Because we know that doing good is hard enough. Let us help get you started.", cta: "APPLY HERE TO QUALIFY →" },
      { title: "Switching from Gong?", body: "Or something similar? Get Fathom Business free through your contract plus data migration.", cta: "SWITCH NOW →" },
    ],
  },
  featureTable: {
    title: "Meet your brilliant AI meeting partner",
    plans: ["Free", "Premium", "Team", "Business", "Enterprise"],
    ctas: ["GET STARTED", "START FREE TRIAL", "START FREE TRIAL", "START FREE TRIAL", "CONTACT SALES"],
    groups: [
      {
        title: "CAPTURING & MANAGING CONTENT",
        rows: [
          { label: "NEW! Choice of bot-free* and bot capture-types", note: "(*Beta feature for Mac)", cells: [true, true, true, true, true] },
          { label: "Recordings & call storage (unlimited)", cells: [true, true, true, true, true] },
          { label: "Transcription (unlimited)", cells: [true, true, true, true, true] },
          { label: "Call downloads and clips (unlimited)", cells: [true, true, true, true, true] },
          { label: "Playlists of clips & highlights for your meetings", cells: [true, true, true, true, true] },
          { label: "Playlists of clips & highlights for all team meetings", cells: [false, false, true, true, true] },
        ],
      },
      {
        title: "INSIGHTS",
        rows: [
          { label: "Automated summaries", cells: [true, true, true, true, true] },
          { label: "Advanced summaries", cells: [false, true, true, true, true] },
          { label: "AI action items", cells: [false, true, true, true, true] },
          { label: "AI follow-up emails", cells: [false, true, true, true, true] },
          { label: "Coaching metrics", cells: [false, false, false, true, true] },
          { label: "Custom summaries", cells: [false, false, false, true, true] },
        ],
      },
      {
        title: "SEARCH, DISCOVERY & ALERTS",
        rows: [
          { label: "Attendee and keyword search in your meetings", cells: [true, true, true, true, true] },
          { label: "Ask Fathom: AI within a single call", cells: [true, true, true, true, true] },
          { label: "Account-wide Ask Fathom: AI for all calls", note: "(*Beta feature)", cells: [false, 'Unlimited for "My Calls"', 'Unlimited for "My Calls"; limited lookback for "Team Calls"', true, true] },
          { label: "Attendee and keyword search in all team meetings", cells: [false, false, true, true, true] },
          { label: "AI search alerts", cells: [false, false, true, true, true] },
          { label: "Keyword alerts", cells: [false, false, true, true, true] },
        ],
      },
      {
        title: "TEAM WORKSPACE",
        rows: [
          { label: "Team members", cells: [false, false, true, true, true] },
          { label: "Team recordings view", cells: [false, false, true, true, true] },
          { label: "Team folders", cells: [false, false, true, true, true] },
          { label: "Comments & mentions", cells: [false, false, true, true, true] },
          { label: "Customer view", cells: [false, false, false, true, true] },
          { label: "Deal view", cells: [false, false, false, true, true] },
        ],
      },
      {
        title: "ADMIN, INTREGRATIONS & SECURITY",
        rows: [
          { label: "NEW! Claude & ChatGPT Integrations", cells: [true, true, true, true, true] },
          { label: "Zapier, Make & other automation integrations", cells: [true, true, true, true, true] },
          { label: "Slack integration", cells: [true, true, true, true, true] },
          { label: "Public API & MCP", cells: [true, true, true, true, true] },
          { label: "CRM syncs", cells: ["Max 3 users/ domain", "Max 3 users/ domain", "Max 3 users/ domain", true, true] },
          { label: "Disable in-meeting banner", cells: [false, true, true, true, true] },
          { label: "Custom bot name", cells: [false, true, true, true, true] },
          { label: "CRM Field sync", cells: [false, false, false, true, true] },
          { label: "Launch Assist Onboarding", cells: [false, false, false, "$", true] },
          { label: "Custom data retention policies", cells: [false, false, false, false, true] },
          { label: "Single sign-on integration", cells: [false, false, false, false, true] },
          { label: "Okta SCIM provisioning", cells: [false, false, false, false, true] },
          { label: "Organization wide security controls", cells: [false, false, false, false, true] },
          { label: "Increased cyber security insurance coverage", cells: [false, false, false, false, true] },
          { label: "Custom contracts & red-line support", cells: [false, false, false, false, true] },
          { label: "Dedicated Customer Success & channel", cells: [false, false, false, false, true] },
          { label: "HIPAA: signed BAA", cells: [false, false, false, false, true] },
        ],
      },
    ],
  },
  contact: {
    title: "Ready to explore what’s out there?",
    body: "Whether you’d like to learn more about Fathom, how it works for your team, or which plan is the best fit – our sales team is here to help.",
    cta: "CONTACT SALES",
  },
};

export const AUTH_TESTIMONIAL = {
  quote: "'Work smarter, not harder,' they said.",
  emphasis: "Fathom took it personally.",
  name: "Rosanne K.",
  title: "Executive",
  rating: "#1 rated",
  reviews: "6,500+ reviews",
  usedAt: "Used at over 290K+ companies",
  logos: ["HubSpot", "Adobe", "zapier", "GRUBHUB", "EA", "Calendly"],
};
