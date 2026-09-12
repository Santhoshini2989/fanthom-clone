/**
 * Domain model for the mock data layer. Shapes mirror what the real product
 * exposes on screen so the layer can be swapped for a backend later.
 */

export type Platform = "zoom" | "google_meet" | "microsoft_teams" | "slack_huddle" | "in_person";

export type Visibility = "private" | "no_teams" | "some_teams" | "all_teams";

export type ShareAccess = "link" | "domain" | "added";

export type AccessRole = "owner" | "admin" | "standard" | "limited";

export type ProcessingStatus = "scheduled" | "recording" | "processing" | "ready" | "failed";

export interface User {
  id: string;
  name: string;
  email: string;
  pronouns?: string;
  title?: string;
  avatarColor: string;
  avatarUrl?: string;
  isExternal?: boolean;
}

export interface Team {
  id: string;
  name: string;
  memberIds: string[];
}

export interface Speaker {
  id: string;
  name: string;
  pronouns?: string;
  color: string;
  userId?: string;
}

export interface TranscriptSegment {
  id: string;
  speakerId: string;
  start: number; // seconds
  end: number;
  text: string;
}

export interface SummarySection {
  heading: string;
  /** A paragraph, or bullet list, or a list of sub-topics with bullets. */
  paragraph?: string;
  bullets?: SummaryBullet[];
  topics?: { title: string; bullets: SummaryBullet[] }[];
}

export interface SummaryBullet {
  /** Optional bold lead like "Launch Date:" */
  lead?: string;
  text: string;
  /** Timestamp the bullet links to (seconds) */
  at?: number;
}

export interface Summary {
  templateId: string;
  language: string;
  sections: SummarySection[];
}

export interface ActionItem {
  id: string;
  text: string;
  assigneeId?: string;
  done: boolean;
  at?: number; // seconds in recording
  source: "ai" | "manual";
}

export type HighlightTypeId =
  | "highlight"
  | "positive_reaction"
  | "needs_review"
  | "feedback"
  | string;

export interface HighlightType {
  id: HighlightTypeId;
  name: string;
  color: string;
  builtIn?: boolean;
}

export interface Highlight {
  id: string;
  typeId: HighlightTypeId;
  start: number;
  end: number;
  /** AI-generated one-line description */
  title: string;
  createdById: string;
  segmentIds: string[];
  kind: "highlight" | "bookmark";
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  at?: number;
  createdAt: string;
}

export interface Question {
  id: string;
  text: string;
  at: number;
  askedById: string;
}

export interface ShareEntry {
  id: string;
  /** user id, team id, or raw email */
  target: string;
  label: string;
  sublabel: string;
  role: AccessRole;
  kind: "user" | "team" | "email";
}

export interface Meeting {
  id: string;
  title: string;
  startedAt: string; // ISO
  duration: number; // seconds
  platform: Platform;
  status: ProcessingStatus;
  ownerId: string;
  attendeeIds: string[];
  externalAttendeeIds?: string[];
  speakers: Speaker[];
  transcript: TranscriptSegment[];
  summaries: Record<string, Summary>; // keyed by templateId
  actionItems: ActionItem[];
  highlights: Highlight[];
  questions: Question[];
  comments: Comment[];
  visibility: Visibility;
  shareAccess: ShareAccess;
  shares: ShareEntry[];
  folderId?: string;
  meetingType?: string;
  dealName?: string;
  crmSynced?: "hubspot" | "salesforce";
  thumbnailSeed: number;
  /** Timeline of who is on camera at which second, for the simulated player */
  activeSpeakerTrack?: { at: number; speakerId: string }[];
  processingProgress?: number;
  failureReason?: string;
}

export interface Folder {
  id: string;
  name: string;
  meetingIds: string[];
  ownerId: string;
  teamId?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  clipIds: { meetingId: string; highlightId: string }[];
  ownerId: string;
}

export interface KeywordAlert {
  id: string;
  keyword: string;
  scope: "my_calls" | "team_calls";
  notify: "email" | "slack";
  matchCount: number;
  createdAt: string;
}

export interface SummaryTemplate {
  id: string;
  name: string;
  description: string;
  category: "general" | "sales" | "customer_success" | "team" | "other";
  icon: "general" | "sales" | "qa" | "demo" | "people" | "project" | "interview" | "retro";
  deprecated?: boolean;
  premium?: boolean;
}

export interface Language {
  code: string;
  label: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "pt", label: "Portuguese", flag: "🇵🇹" },
  { code: "de", label: "German", flag: "🇩🇪" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "it", label: "Italian", flag: "🇮🇹" },
  { code: "nl", label: "Dutch", flag: "🇳🇱" },
];
