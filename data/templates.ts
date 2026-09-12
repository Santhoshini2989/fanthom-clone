import type { SummaryTemplate } from "./types";

/**
 * The 17 summary templates Fathom lists (help center "Advanced AI Features in
 * Team Edition" + the settings screenshot). Descriptions verbatim.
 */
export const TEMPLATES: SummaryTemplate[] = [
  {
    id: "chronological",
    name: "Chronological",
    description: "Short summary of the meeting by chapter",
    category: "general",
    icon: "general",
    deprecated: true,
  },
  {
    id: "general",
    name: "General",
    description: "Capture any call's insights and key takeaways.",
    category: "general",
    icon: "general",
  },
  {
    id: "sales",
    name: "Sales",
    description: "Unpack a prospect’s needs, challenges, and buying journey.",
    category: "sales",
    icon: "sales",
    premium: true,
  },
  {
    id: "sales_sandler",
    name: "Sales - Sandler",
    description: "Notes based on Sandler Selling System",
    category: "sales",
    icon: "sales",
    premium: true,
  },
  {
    id: "sales_spiced",
    name: "Sales - SPICED",
    description: "Notes based on the sales methodology by Winning by Design.",
    category: "sales",
    icon: "sales",
    premium: true,
  },
  {
    id: "sales_meddpicc",
    name: "Sales - MEDDPICC",
    description: "Notes based on the popular sales methodology.",
    category: "sales",
    icon: "sales",
    premium: true,
  },
  {
    id: "sales_bant",
    name: "Sales - BANT",
    description: "Notes based on the popular sales methodology.",
    category: "sales",
    icon: "sales",
    premium: true,
  },
  {
    id: "qa",
    name: "Q&A",
    description: "Recap questions with answers.",
    category: "general",
    icon: "qa",
    premium: true,
  },
  {
    id: "demo",
    name: "Demo",
    description: "Showcase journeys and impact.",
    category: "sales",
    icon: "demo",
    premium: true,
  },
  {
    id: "customer_success",
    name: "Customer Success",
    description: "Experiences, challenges, goals, and Q&A.",
    category: "customer_success",
    icon: "people",
    premium: true,
  },
  {
    id: "customer_success_reach",
    name: "Customer Success - REACH",
    description: "Notes based on expansion framework by HelloCCO",
    category: "customer_success",
    icon: "people",
    premium: true,
  },
  {
    id: "one_on_one",
    name: "One-on-One",
    description: "Updates, priorities, support signals, and discussion.",
    category: "team",
    icon: "people",
    premium: true,
  },
  {
    id: "project_update",
    name: "Project Update",
    description: "Break down each task's status, discussion, and next steps.",
    category: "team",
    icon: "project",
    premium: true,
  },
  {
    id: "project_kickoff",
    name: "Project Kick-Off",
    description: "Focus on vision, targets, and resources.",
    category: "team",
    icon: "project",
    premium: true,
  },
  {
    id: "candidate_interview",
    name: "Candidate Interview",
    description: "Delve into a candidate's experience, goals, and responses.",
    category: "other",
    icon: "interview",
    premium: true,
  },
  {
    id: "retrospective",
    name: "Retrospective",
    description: "Capture processes to start, stop, and continue.",
    category: "team",
    icon: "retro",
    premium: true,
  },
];

export const DEFAULT_TEMPLATE_ID = "general";

export function templateById(id: string): SummaryTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[1]!;
}

/** Deal-summary templates that can be customized with the gear icon. */
export const CUSTOMIZABLE_TEMPLATE_IDS = [
  "general",
  "sales",
  "sales_sandler",
  "sales_spiced",
  "sales_meddpicc",
  "sales_bant",
];

/** Placeholder shown in the customize modal textarea (verbatim from screenshot). */
export const CUSTOMIZE_PLACEHOLDER =
  'ex: "Increase detail",\n"Prefix each bullet point with its topic+colon in bold","Append a \'Misc\' topic with everything not already covered"';
