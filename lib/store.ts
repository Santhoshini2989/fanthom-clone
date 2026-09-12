"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AccessRole,
  ActionItem,
  Folder,
  Highlight,
  HighlightType,
  KeywordAlert,
  Meeting,
  Playlist,
  ShareAccess,
  ShareEntry,
  Visibility,
} from "@/data/types";
import { ALERTS, FOLDERS, HIGHLIGHT_TYPES, MEETINGS, PLAYLISTS } from "@/data/meetings";
import { CURRENT_USER_ID } from "@/data/users";
import { DEFAULT_TEMPLATE_ID } from "@/data/templates";
import { uid } from "./utils";

export type AutoRecord = "all" | "external" | "internal" | "none";
export type AutoShare = "summary_recording" | "summary" | "nothing";
export type Theme = "dark" | "light";

export interface Settings {
  autoRecord: AutoRecord;
  autoShare: AutoShare;
  zoom: boolean;
  googleMeet: boolean;
  teams: boolean;
  enhancedRecording: boolean;
  recordUnscheduledZoom: boolean;
  recordUnscheduledMeet: boolean;
  zapier: boolean;
  botName: string;
  autoActionItems: boolean;
  defaultTemplateId: string;
  recordingBanner: boolean;
  slack: boolean;
  salesforce: boolean;
  hubspot: boolean;
  close: boolean;
  autoConsent: boolean;
  externalVisibleToTeam: boolean;
  desktopApp: boolean;
  zoomApp: boolean;
  chromeExtension: boolean;
  theme: Theme;
  /** custom instructions per template id (Customize modal) */
  templateInstructions: Record<string, string>;
  webhooks: { id: string; url: string; scopes: string[]; events: string[] }[];
  // org
  orgAutoCapture: { external: "on" | "off" | "optional"; internal: "on" | "off" | "optional"; unscheduled: "on" | "off" | "optional" };
  singleBot: boolean;
  orgVisibility: { external: string; internal: string; unscheduled: string };
  defaultShareAccess: "users_choose" | ShareAccess;
  restrictAnonymous: boolean;
  orgConsent: "users_choose" | "on" | "off";
  retention: string;
  disableDownload: boolean;
  disableDeletion: boolean;
  disableModification: boolean;
  disableBotFree: boolean;
  excludeTraining: boolean;
}

export const DEFAULT_BOT_NAME = "Nancy's Notetaker";

const defaultSettings: Settings = {
  autoRecord: "none",
  autoShare: "nothing",
  zoom: true,
  googleMeet: true,
  teams: false,
  enhancedRecording: true,
  recordUnscheduledZoom: false,
  recordUnscheduledMeet: false,
  zapier: false,
  botName: DEFAULT_BOT_NAME,
  autoActionItems: true,
  defaultTemplateId: DEFAULT_TEMPLATE_ID,
  recordingBanner: true,
  slack: true,
  salesforce: true,
  hubspot: false,
  close: false,
  autoConsent: false,
  externalVisibleToTeam: true,
  desktopApp: true,
  zoomApp: true,
  chromeExtension: false,
  theme: "dark",
  templateInstructions: {},
  webhooks: [{ id: "wh_1", url: "https://example.com", scopes: ["My Recordings", "My Team-Shared Recordings"], events: ["Summary", "Action items"] }],
  orgAutoCapture: { external: "on", internal: "off", unscheduled: "optional" },
  singleBot: true,
  orgVisibility: { external: "All Teams", internal: "User's Team", unscheduled: "User Choose" },
  defaultShareAccess: "users_choose",
  restrictAnonymous: false,
  orgConsent: "users_choose",
  retention: "Forever",
  disableDownload: false,
  disableDeletion: false,
  disableModification: false,
  disableBotFree: false,
  excludeTraining: false,
};

export interface TranscriptEdit {
  segmentId: string;
  text?: string;
  speakerId?: string;
}

interface AppState {
  meetings: Meeting[];
  folders: Folder[];
  playlists: Playlist[];
  alerts: KeywordAlert[];
  highlightTypes: HighlightType[];
  settings: Settings;
  /** ids of meetings whose summaries were "regenerated" with custom instructions */
  customizedSummaries: Record<string, string>; // meetingId -> templateId
  /** per meeting selected template + language */
  meetingPrefs: Record<string, { templateId?: string; language?: string }>;
  /** transcript edits keyed by segment id */
  transcriptEdits: Record<string, TranscriptEdit>;
  trimmedSegments: Record<string, string[]>; // meetingId -> segment ids
  bookmarks: Record<string, number[]>; // meetingId -> seconds
  dismissedBanners: string[];
  askHistory: Record<string, { q: string; a: string; at?: number }[]>;
  seenTutorial: boolean;

  // actions
  updateMeeting: (id: string, patch: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;
  renameMeeting: (id: string, title: string) => void;
  addHighlight: (meetingId: string, h: Omit<Highlight, "id" | "createdById">) => Highlight;
  removeHighlight: (meetingId: string, highlightId: string) => void;
  updateHighlight: (meetingId: string, highlightId: string, patch: Partial<Highlight>) => void;
  toggleActionItem: (meetingId: string, itemId: string) => void;
  addActionItem: (meetingId: string, item: Omit<ActionItem, "id" | "source" | "done">) => void;
  removeActionItem: (meetingId: string, itemId: string) => void;
  setShareAccess: (meetingId: string, access: ShareAccess) => void;
  setVisibility: (meetingId: string, v: Visibility) => void;
  addShare: (meetingId: string, entry: Omit<ShareEntry, "id">) => void;
  setShareRole: (meetingId: string, shareId: string, role: AccessRole) => void;
  removeShare: (meetingId: string, shareId: string) => void;
  addComment: (meetingId: string, text: string, at?: number) => void;
  setMeetingFolder: (meetingId: string, folderId?: string) => void;
  createFolder: (name: string) => Folder;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  createPlaylist: (name: string, description?: string) => Playlist;
  deletePlaylist: (id: string) => void;
  addClipToPlaylist: (playlistId: string, meetingId: string, highlightId: string) => void;
  removeClipFromPlaylist: (playlistId: string, highlightId: string) => void;
  createAlert: (a: Omit<KeywordAlert, "id" | "createdAt" | "matchCount">) => void;
  deleteAlert: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setTemplateInstruction: (templateId: string, text: string) => void;
  markSummaryCustomized: (meetingId: string, templateId: string) => void;
  clearSummaryCustomized: (meetingId: string) => void;
  setMeetingPref: (meetingId: string, pref: { templateId?: string; language?: string }) => void;
  editTranscript: (segmentId: string, edit: Omit<TranscriptEdit, "segmentId">) => void;
  trimSegments: (meetingId: string, segmentIds: string[]) => void;
  addBookmark: (meetingId: string, at: number) => void;
  removeBookmark: (meetingId: string, at: number) => void;
  dismissBanner: (id: string) => void;
  pushAsk: (scope: string, entry: { q: string; a: string; at?: number }) => void;
  clearAsk: (scope: string) => void;
  addHighlightType: (t: Omit<HighlightType, "id">) => void;
  updateHighlightType: (id: string, patch: Partial<HighlightType>) => void;
  removeHighlightType: (id: string) => void;
  reorderHighlightTypes: (ids: string[]) => void;
  addWebhook: (url: string) => void;
  removeWebhook: (id: string) => void;
  setSeenTutorial: () => void;
  resetAll: () => void;
}

const initial = () => ({
  meetings: MEETINGS,
  folders: FOLDERS,
  playlists: PLAYLISTS,
  alerts: ALERTS,
  highlightTypes: HIGHLIGHT_TYPES,
  settings: defaultSettings,
  customizedSummaries: {},
  meetingPrefs: {},
  transcriptEdits: {},
  trimmedSegments: {},
  bookmarks: {},
  dismissedBanners: [],
  askHistory: {},
  seenTutorial: false,
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initial(),

      updateMeeting: (id, patch) =>
        set((s) => ({ meetings: s.meetings.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      deleteMeeting: (id) =>
        set((s) => ({
          meetings: s.meetings.filter((m) => m.id !== id),
          folders: s.folders.map((f) => ({ ...f, meetingIds: f.meetingIds.filter((x) => x !== id) })),
          playlists: s.playlists.map((p) => ({ ...p, clipIds: p.clipIds.filter((c) => c.meetingId !== id) })),
        })),
      renameMeeting: (id, title) => get().updateMeeting(id, { title }),

      addHighlight: (meetingId, h) => {
        const full: Highlight = { ...h, id: uid("hl"), createdById: CURRENT_USER_ID };
        set((s) => ({
          meetings: s.meetings.map((m) =>
            m.id === meetingId ? { ...m, highlights: [...m.highlights, full].sort((a, b) => a.start - b.start) } : m,
          ),
        }));
        return full;
      },
      removeHighlight: (meetingId, highlightId) =>
        set((s) => ({
          meetings: s.meetings.map((m) =>
            m.id === meetingId ? { ...m, highlights: m.highlights.filter((h) => h.id !== highlightId) } : m,
          ),
          playlists: s.playlists.map((p) => ({ ...p, clipIds: p.clipIds.filter((c) => c.highlightId !== highlightId) })),
        })),
      updateHighlight: (meetingId, highlightId, patch) =>
        set((s) => ({
          meetings: s.meetings.map((m) =>
            m.id === meetingId
              ? { ...m, highlights: m.highlights.map((h) => (h.id === highlightId ? { ...h, ...patch } : h)) }
              : m,
          ),
        })),

      toggleActionItem: (meetingId, itemId) =>
        set((s) => ({
          meetings: s.meetings.map((m) =>
            m.id === meetingId
              ? { ...m, actionItems: m.actionItems.map((a) => (a.id === itemId ? { ...a, done: !a.done } : a)) }
              : m,
          ),
        })),
      addActionItem: (meetingId, item) =>
        set((s) => ({
          meetings: s.meetings.map((m) =>
            m.id === meetingId
              ? { ...m, actionItems: [...m.actionItems, { ...item, id: uid("ai"), source: "manual", done: false }] }
              : m,
          ),
        })),
      removeActionItem: (meetingId, itemId) =>
        set((s) => ({
          meetings: s.meetings.map((m) =>
            m.id === meetingId ? { ...m, actionItems: m.actionItems.filter((a) => a.id !== itemId) } : m,
          ),
        })),

      setShareAccess: (meetingId, access) => get().updateMeeting(meetingId, { shareAccess: access }),
      setVisibility: (meetingId, v) => get().updateMeeting(meetingId, { visibility: v }),
      addShare: (meetingId, entry) =>
        set((s) => ({
          meetings: s.meetings.map((m) =>
            m.id === meetingId && !m.shares.some((x) => x.target === entry.target)
              ? { ...m, shares: [...m.shares, { ...entry, id: uid("sh") }] }
              : m,
          ),
        })),
      setShareRole: (meetingId, shareId, role) =>
        set((s) => ({
          meetings: s.meetings.map((m) =>
            m.id === meetingId ? { ...m, shares: m.shares.map((x) => (x.id === shareId ? { ...x, role } : x)) } : m,
          ),
        })),
      removeShare: (meetingId, shareId) =>
        set((s) => ({
          meetings: s.meetings.map((m) =>
            m.id === meetingId ? { ...m, shares: m.shares.filter((x) => x.id !== shareId) } : m,
          ),
        })),
      addComment: (meetingId, text, at) =>
        set((s) => ({
          meetings: s.meetings.map((m) =>
            m.id === meetingId
              ? {
                  ...m,
                  comments: [
                    ...m.comments,
                    { id: uid("c"), authorId: CURRENT_USER_ID, text, at, createdAt: new Date().toISOString() },
                  ],
                }
              : m,
          ),
        })),

      setMeetingFolder: (meetingId, folderId) =>
        set((s) => ({
          meetings: s.meetings.map((m) => (m.id === meetingId ? { ...m, folderId } : m)),
          folders: s.folders.map((f) => ({
            ...f,
            meetingIds:
              f.id === folderId
                ? Array.from(new Set([...f.meetingIds, meetingId]))
                : f.meetingIds.filter((x) => x !== meetingId),
          })),
        })),
      createFolder: (name) => {
        const f: Folder = { id: uid("f"), name, meetingIds: [], ownerId: CURRENT_USER_ID };
        set((s) => ({ folders: [...s.folders, f] }));
        return f;
      },
      renameFolder: (id, name) => set((s) => ({ folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)) })),
      deleteFolder: (id) =>
        set((s) => ({
          folders: s.folders.filter((f) => f.id !== id),
          meetings: s.meetings.map((m) => (m.folderId === id ? { ...m, folderId: undefined } : m)),
        })),

      createPlaylist: (name, description) => {
        const p: Playlist = { id: uid("pl"), name, description, clipIds: [], ownerId: CURRENT_USER_ID };
        set((s) => ({ playlists: [...s.playlists, p] }));
        return p;
      },
      deletePlaylist: (id) => set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) })),
      addClipToPlaylist: (playlistId, meetingId, highlightId) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId && !p.clipIds.some((c) => c.highlightId === highlightId)
              ? { ...p, clipIds: [...p.clipIds, { meetingId, highlightId }] }
              : p,
          ),
        })),
      removeClipFromPlaylist: (playlistId, highlightId) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId ? { ...p, clipIds: p.clipIds.filter((c) => c.highlightId !== highlightId) } : p,
          ),
        })),

      createAlert: (a) =>
        set((s) => ({
          alerts: [{ ...a, id: uid("al"), createdAt: new Date().toISOString(), matchCount: 0 }, ...s.alerts],
        })),
      deleteAlert: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setTemplateInstruction: (templateId, text) =>
        set((s) => ({
          settings: { ...s.settings, templateInstructions: { ...s.settings.templateInstructions, [templateId]: text } },
        })),
      markSummaryCustomized: (meetingId, templateId) =>
        set((s) => ({ customizedSummaries: { ...s.customizedSummaries, [meetingId]: templateId } })),
      clearSummaryCustomized: (meetingId) =>
        set((s) => {
          const next = { ...s.customizedSummaries };
          delete next[meetingId];
          return { customizedSummaries: next };
        }),
      setMeetingPref: (meetingId, pref) =>
        set((s) => ({ meetingPrefs: { ...s.meetingPrefs, [meetingId]: { ...s.meetingPrefs[meetingId], ...pref } } })),
      editTranscript: (segmentId, edit) =>
        set((s) => ({
          transcriptEdits: { ...s.transcriptEdits, [segmentId]: { ...s.transcriptEdits[segmentId], segmentId, ...edit } },
        })),
      trimSegments: (meetingId, segmentIds) =>
        set((s) => ({
          trimmedSegments: {
            ...s.trimmedSegments,
            [meetingId]: Array.from(new Set([...(s.trimmedSegments[meetingId] ?? []), ...segmentIds])),
          },
        })),
      addBookmark: (meetingId, at) =>
        set((s) => ({ bookmarks: { ...s.bookmarks, [meetingId]: [...(s.bookmarks[meetingId] ?? []), at].sort((a, b) => a - b) } })),
      removeBookmark: (meetingId, at) =>
        set((s) => ({ bookmarks: { ...s.bookmarks, [meetingId]: (s.bookmarks[meetingId] ?? []).filter((x) => x !== at) } })),
      dismissBanner: (id) => set((s) => ({ dismissedBanners: Array.from(new Set([...s.dismissedBanners, id])) })),
      pushAsk: (scope, entry) =>
        set((s) => ({ askHistory: { ...s.askHistory, [scope]: [...(s.askHistory[scope] ?? []), entry] } })),
      clearAsk: (scope) => set((s) => ({ askHistory: { ...s.askHistory, [scope]: [] } })),

      addHighlightType: (t) => set((s) => ({ highlightTypes: [...s.highlightTypes, { ...t, id: uid("ht") }] })),
      updateHighlightType: (id, patch) =>
        set((s) => ({ highlightTypes: s.highlightTypes.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      removeHighlightType: (id) => set((s) => ({ highlightTypes: s.highlightTypes.filter((t) => t.id !== id) })),
      reorderHighlightTypes: (ids) =>
        set((s) => ({
          highlightTypes: ids.map((id) => s.highlightTypes.find((t) => t.id === id)!).filter(Boolean),
        })),
      addWebhook: (url) =>
        set((s) => ({
          settings: {
            ...s.settings,
            webhooks: [...s.settings.webhooks, { id: uid("wh"), url, scopes: ["My Recordings"], events: ["Summary", "Action items"] }],
          },
        })),
      removeWebhook: (id) =>
        set((s) => ({ settings: { ...s.settings, webhooks: s.settings.webhooks.filter((w) => w.id !== id) } })),
      setSeenTutorial: () => set({ seenTutorial: true }),
      resetAll: () => set(initial()),
    }),
    {
      name: "fathom-clone-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        meetings: s.meetings,
        folders: s.folders,
        playlists: s.playlists,
        alerts: s.alerts,
        highlightTypes: s.highlightTypes,
        settings: s.settings,
        customizedSummaries: s.customizedSummaries,
        meetingPrefs: s.meetingPrefs,
        transcriptEdits: s.transcriptEdits,
        trimmedSegments: s.trimmedSegments,
        bookmarks: s.bookmarks,
        dismissedBanners: s.dismissedBanners,
        seenTutorial: s.seenTutorial,
      }),
    },
  ),
);

/** Hydration-safe selector: returns undefined until the persisted store has loaded on the client. */
import { useEffect, useState } from "react";
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => {
    // zustand persist hydrates synchronously from localStorage on first client render,
    // but the server render used defaults, so gate on mount to avoid mismatches.
    setH(true);
  }, []);
  return h;
}
