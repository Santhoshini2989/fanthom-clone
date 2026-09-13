"use client";

import { create } from "zustand";
import { useEffect, useSyncExternalStore } from "react";
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
import { CURRENT_USER_ID } from "@/data/users";
import { DEFAULT_TEMPLATE_ID } from "@/data/templates";
import { api, ApiError } from "./api";
import { uid } from "./utils";

/**
 * Client store. The local PostgreSQL database (via /api) is the source of
 * truth: `load()` pulls everything on first use, every mutation calls the API
 * and replaces the affected meeting with the server's copy. Meetings that are
 * being recorded or processed are polled so the UI reflects pipeline progress.
 *
 * Only UI preferences (per-meeting template/language, Ask Fathom history)
 * stay in memory.
 */

export type AutoRecord = "all" | "external" | "internal" | "none";
export type AutoShare = "summary_recording" | "summary" | "nothing";

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
  templateInstructions: Record<string, string>;
  webhooks: { id: string; url: string; scopes: string[]; events: string[] }[];
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

/** Meeting as returned by the API: the UI shape plus raw pipeline state. */
export type ApiMeeting = Meeting & {
  db?: { status: string; processingStep: string | null; meetUrl: string | null; hasRecording: boolean; recordingProvider: string | null; stopRequested: boolean; botClaimedAt: string | null };
};

interface AppState {
  loaded: boolean;
  loadError: string | null;
  capabilities: { gemini: boolean };
  currentUserId: string;
  meetings: ApiMeeting[];
  folders: Folder[];
  playlists: Playlist[];
  alerts: KeywordAlert[];
  highlightTypes: HighlightType[];
  settings: Settings;
  customizedSummaries: Record<string, string>;
  meetingPrefs: Record<string, { templateId?: string; language?: string }>;
  transcriptEdits: Record<string, TranscriptEdit>;
  trimmedSegments: Record<string, string[]>;
  bookmarks: Record<string, number[]>;
  dismissedBanners: string[];
  askHistory: Record<string, { q: string; a: string; at?: number; citations?: { meetingId: string; at: number; label: string }[] }[]>;
  seenTutorial: boolean;

  load: (force?: boolean) => Promise<void>;
  refreshMeeting: (id: string) => Promise<ApiMeeting | null>;
  createMeeting: (input: { title?: string; meetUrl?: string; startNow?: boolean }) => Promise<ApiMeeting>;
  importRecording: (file: File, title?: string) => Promise<string>;
  startBot: (id: string) => Promise<void>;
  stopBot: (id: string) => Promise<void>;
  retryMeeting: (id: string) => Promise<void>;
  updateMeeting: (id: string, patch: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => Promise<void>;
  renameMeeting: (id: string, title: string) => Promise<void>;
  addHighlight: (meetingId: string, h: Omit<Highlight, "id" | "createdById">) => Promise<Highlight>;
  removeHighlight: (meetingId: string, highlightId: string) => Promise<void>;
  updateHighlight: (meetingId: string, highlightId: string, patch: Partial<Highlight>) => void;
  toggleActionItem: (meetingId: string, itemId: string) => Promise<void>;
  addActionItem: (meetingId: string, item: Omit<ActionItem, "id" | "source" | "done">) => Promise<void>;
  removeActionItem: (meetingId: string, itemId: string) => Promise<void>;
  setShareAccess: (meetingId: string, access: ShareAccess) => Promise<void>;
  setVisibility: (meetingId: string, v: Visibility) => Promise<void>;
  addShare: (meetingId: string, entry: Omit<ShareEntry, "id">) => Promise<void>;
  setShareRole: (meetingId: string, shareId: string, role: AccessRole) => Promise<void>;
  removeShare: (meetingId: string, shareId: string) => Promise<void>;
  addComment: (meetingId: string, text: string, at?: number) => Promise<void>;
  setMeetingFolder: (meetingId: string, folderId?: string) => Promise<void>;
  createFolder: (name: string) => Promise<Folder>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  createPlaylist: (name: string, description?: string) => Promise<Playlist>;
  deletePlaylist: (id: string) => Promise<void>;
  addClipToPlaylist: (playlistId: string, meetingId: string, highlightId: string) => Promise<void>;
  removeClipFromPlaylist: (playlistId: string, highlightId: string) => Promise<void>;
  createAlert: (a: Omit<KeywordAlert, "id" | "createdAt" | "matchCount">) => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => void;
  setTemplateInstruction: (templateId: string, text: string) => void;
  markSummaryCustomized: (meetingId: string, templateId: string) => void;
  clearSummaryCustomized: (meetingId: string) => void;
  regenerateSummary: (meetingId: string, templateId: string, opts?: { instructions?: string; language?: string }) => Promise<void>;
  setMeetingPref: (meetingId: string, pref: { templateId?: string; language?: string }) => void;
  editTranscript: (meetingId: string, segmentId: string, edit: Omit<TranscriptEdit, "segmentId">) => Promise<void>;
  trimSegments: (meetingId: string, segmentIds: string[]) => Promise<void>;
  addBookmark: (meetingId: string, at: number) => void;
  removeBookmark: (meetingId: string, at: number) => void;
  dismissBanner: (id: string) => void;
  pushAsk: (scope: string, entry: { q: string; a: string; at?: number; citations?: { meetingId: string; at: number; label: string }[] }) => void;
  clearAsk: (scope: string) => void;
  addHighlightType: (t: Omit<HighlightType, "id">) => Promise<void>;
  updateHighlightType: (id: string, patch: Partial<HighlightType>) => void;
  removeHighlightType: (id: string) => Promise<void>;
  reorderHighlightTypes: (ids: string[]) => void;
  addWebhook: (url: string) => void;
  removeWebhook: (id: string) => void;
  setSeenTutorial: () => void;
  resetAll: () => void;
}

const ACTIVE_STATES = new Set(["BOT_REQUESTED", "BOT_JOINING", "RECORDING", "PROCESSING", "TRANSCRIBING", "ANALYZING"]);

function replaceMeeting(list: ApiMeeting[], m: ApiMeeting) {
  const i = list.findIndex((x) => x.id === m.id);
  if (i < 0) return [m, ...list].sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
  const next = list.slice();
  next[i] = m;
  return next;
}

let loading: Promise<void> | null = null;
let settingsTimer: number | null = null;

export const useAppStore = create<AppState>()((set, get) => ({
  loaded: false,
  loadError: null,
  capabilities: { gemini: false },
  currentUserId: CURRENT_USER_ID,
  meetings: [],
  folders: [],
  playlists: [],
  alerts: [],
  highlightTypes: [],
  settings: defaultSettings,
  customizedSummaries: {},
  meetingPrefs: {},
  transcriptEdits: {},
  trimmedSegments: {},
  bookmarks: {},
  dismissedBanners: [],
  askHistory: {},
  seenTutorial: false,

  load: async (force = false) => {
    if (get().loaded && !force) return;
    if (loading && !force) return loading;
    loading = (async () => {
      try {
        const data = await api.get<{
          currentUserId: string;
          meetings: ApiMeeting[];
          folders: Folder[];
          playlists: Playlist[];
          alerts: KeywordAlert[];
          highlightTypes: HighlightType[];
          settings: Partial<Settings>;
          capabilities: { gemini: boolean };
        }>("/api/bootstrap");
        set({
          loaded: true,
          loadError: null,
          currentUserId: data.currentUserId,
          meetings: data.meetings,
          folders: data.folders,
          playlists: data.playlists,
          alerts: data.alerts,
          highlightTypes: data.highlightTypes,
          settings: { ...defaultSettings, ...data.settings },
          capabilities: data.capabilities,
        });
      } catch (e) {
        set({ loaded: true, loadError: e instanceof Error ? e.message : String(e) });
      } finally {
        loading = null;
      }
    })();
    return loading;
  },

  refreshMeeting: async (id) => {
    try {
      const m = await api.get<ApiMeeting>(`/api/meetings/${id}`);
      set((s) => ({ meetings: replaceMeeting(s.meetings, m) }));
      return m;
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) set((s) => ({ meetings: s.meetings.filter((m) => m.id !== id) }));
      return null;
    }
  },

  createMeeting: async (input) => {
    const m = await api.post<ApiMeeting>("/api/meetings", input);
    set((s) => ({ meetings: replaceMeeting(s.meetings, m) }));
    return m;
  },

  importRecording: async (file, title) => {
    const fd = new FormData();
    fd.append("file", file);
    if (title) fd.append("title", title);
    const { id } = await api.post<{ id: string }>("/api/meetings/import", fd);
    await get().refreshMeeting(id);
    return id;
  },

  startBot: async (id) => {
    const m = await api.post<ApiMeeting>(`/api/meetings/${id}/start-bot`);
    set((s) => ({ meetings: replaceMeeting(s.meetings, m) }));
  },
  stopBot: async (id) => {
    const m = await api.post<ApiMeeting>(`/api/meetings/${id}/stop`);
    set((s) => ({ meetings: replaceMeeting(s.meetings, m) }));
  },
  retryMeeting: async (id) => {
    const m = await api.post<ApiMeeting>(`/api/meetings/${id}/retry`);
    set((s) => ({ meetings: replaceMeeting(s.meetings, m) }));
  },

  updateMeeting: (id, patch) => set((s) => ({ meetings: s.meetings.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),

  deleteMeeting: async (id) => {
    set((s) => ({
      meetings: s.meetings.filter((m) => m.id !== id),
      folders: s.folders.map((f) => ({ ...f, meetingIds: f.meetingIds.filter((x) => x !== id) })),
      playlists: s.playlists.map((p) => ({ ...p, clipIds: p.clipIds.filter((c) => c.meetingId !== id) })),
    }));
    await api.delete(`/api/meetings/${id}`);
  },

  renameMeeting: async (id, title) => {
    get().updateMeeting(id, { title });
    const m = await api.patch<ApiMeeting>(`/api/meetings/${id}`, { title });
    set((s) => ({ meetings: replaceMeeting(s.meetings, m) }));
  },

  addHighlight: async (meetingId, h) => {
    const res = await api.post<{ meeting: ApiMeeting; highlightId: string }>(`/api/meetings/${meetingId}/highlights`, {
      typeId: h.typeId,
      start: h.start,
      end: h.end,
      title: h.title,
      segmentIds: h.segmentIds,
      kind: h.kind,
    });
    set((s) => ({ meetings: replaceMeeting(s.meetings, res.meeting) }));
    return res.meeting.highlights.find((x) => x.id === res.highlightId) ?? { ...h, id: res.highlightId, createdById: get().currentUserId };
  },
  removeHighlight: async (meetingId, highlightId) => {
    set((s) => ({
      meetings: s.meetings.map((m) => (m.id === meetingId ? { ...m, highlights: m.highlights.filter((h) => h.id !== highlightId) } : m)),
      playlists: s.playlists.map((p) => ({ ...p, clipIds: p.clipIds.filter((c) => c.highlightId !== highlightId) })),
    }));
    const m = await api.delete<ApiMeeting>(`/api/meetings/${meetingId}/highlights`, { highlightId });
    set((s) => ({ meetings: replaceMeeting(s.meetings, m) }));
  },
  updateHighlight: (meetingId, highlightId, patch) =>
    set((s) => ({
      meetings: s.meetings.map((m) => (m.id === meetingId ? { ...m, highlights: m.highlights.map((h) => (h.id === highlightId ? { ...h, ...patch } : h)) } : m)),
    })),

  toggleActionItem: async (meetingId, itemId) => {
    set((s) => ({
      meetings: s.meetings.map((m) => (m.id === meetingId ? { ...m, actionItems: m.actionItems.map((a) => (a.id === itemId ? { ...a, done: !a.done } : a)) } : m)),
    }));
    const m = await api.patch<ApiMeeting>(`/api/meetings/${meetingId}/action-items`, { itemId });
    set((s) => ({ meetings: replaceMeeting(s.meetings, m) }));
  },
  addActionItem: async (meetingId, item) => {
    const m = await api.post<ApiMeeting>(`/api/meetings/${meetingId}/action-items`, { text: item.text, at: item.at, assigneeId: item.assigneeId });
    set((s) => ({ meetings: replaceMeeting(s.meetings, m) }));
  },
  removeActionItem: async (meetingId, itemId) => {
    set((s) => ({ meetings: s.meetings.map((m) => (m.id === meetingId ? { ...m, actionItems: m.actionItems.filter((a) => a.id !== itemId) } : m)) }));
    const m = await api.delete<ApiMeeting>(`/api/meetings/${meetingId}/action-items`, { itemId });
    set((s) => ({ meetings: replaceMeeting(s.meetings, m) }));
  },

  setShareAccess: async (meetingId, access) => {
    get().updateMeeting(meetingId, { shareAccess: access });
    const m = await api.patch<ApiMeeting>(`/api/meetings/${meetingId}`, { shareAccess: access });
    set((s) => ({ meetings: replaceMeeting(s.meetings, m) }));
  },
  setVisibility: async (meetingId, v) => {
    get().updateMeeting(meetingId, { visibility: v });
    const m = await api.patch<ApiMeeting>(`/api/meetings/${meetingId}`, { visibility: v });
    set((s) => ({ meetings: replaceMeeting(s.meetings, m) }));
  },
  addShare: async (meetingId, entry) => {
    const m = await api.post<ApiMeeting>(`/api/meetings/${meetingId}/shares`, entry);
    set((s) => ({ meetings: replaceMeeting(s.meetings, m) }));
  },
  setShareRole: async (meetingId, shareId, role) => {
    const m = await api.patch<ApiMeeting>(`/api/meetings/${meetingId}/shares`, { shareId, role });
    set((s) => ({ meetings: replaceMeeting(s.meetings, m) }));
  },
  removeShare: async (meetingId, shareId) => {
    const m = await api.delete<ApiMeeting>(`/api/meetings/${meetingId}/shares`, { shareId });
    set((s) => ({ meetings: replaceMeeting(s.meetings, m) }));
  },
  addComment: async (meetingId, text, at) => {
    const m = await api.post<ApiMeeting>(`/api/meetings/${meetingId}/comments`, { text, at });
    set((s) => ({ meetings: replaceMeeting(s.meetings, m) }));
  },

  setMeetingFolder: async (meetingId, folderId) => {
    set((s) => ({
      meetings: s.meetings.map((m) => (m.id === meetingId ? { ...m, folderId } : m)),
      folders: s.folders.map((f) => ({
        ...f,
        meetingIds: f.id === folderId ? Array.from(new Set([...f.meetingIds, meetingId])) : f.meetingIds.filter((x) => x !== meetingId),
      })),
    }));
    await api.patch(`/api/meetings/${meetingId}`, { folderId: folderId ?? null });
  },
  createFolder: async (name) => {
    const f = await api.post<Folder>("/api/library/folders", { name });
    set((s) => ({ folders: [...s.folders, f] }));
    return f;
  },
  renameFolder: async (id, name) => {
    set((s) => ({ folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)) }));
    await api.patch("/api/library/folders", { id, name });
  },
  deleteFolder: async (id) => {
    set((s) => ({ folders: s.folders.filter((f) => f.id !== id), meetings: s.meetings.map((m) => (m.folderId === id ? { ...m, folderId: undefined } : m)) }));
    await api.delete("/api/library/folders", { id });
  },

  createPlaylist: async (name, description) => {
    const p = await api.post<Playlist>("/api/library/playlists", { name, description });
    set((s) => ({ playlists: [...s.playlists, p] }));
    return p;
  },
  deletePlaylist: async (id) => {
    set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) }));
    await api.delete("/api/library/playlists", { id });
  },
  addClipToPlaylist: async (playlistId, meetingId, highlightId) => {
    set((s) => ({
      playlists: s.playlists.map((p) => (p.id === playlistId && !p.clipIds.some((c) => c.highlightId === highlightId) ? { ...p, clipIds: [...p.clipIds, { meetingId, highlightId }] } : p)),
    }));
    await api.post("/api/library/playlist-clips", { playlistId, highlightId });
  },
  removeClipFromPlaylist: async (playlistId, highlightId) => {
    set((s) => ({ playlists: s.playlists.map((p) => (p.id === playlistId ? { ...p, clipIds: p.clipIds.filter((c) => c.highlightId !== highlightId) } : p)) }));
    await api.delete("/api/library/playlist-clips", { playlistId, highlightId });
  },

  createAlert: async (a) => {
    const created = await api.post<KeywordAlert>("/api/library/alerts", a);
    set((s) => ({ alerts: [created, ...s.alerts] }));
  },
  deleteAlert: async (id) => {
    set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) }));
    await api.delete("/api/library/alerts", { id });
  },

  updateSettings: (patch) => {
    set((s) => ({ settings: { ...s.settings, ...patch } }));
    if (settingsTimer) window.clearTimeout(settingsTimer);
    settingsTimer = window.setTimeout(() => {
      void api.patch("/api/settings", get().settings).catch(() => {});
    }, 400);
  },
  setTemplateInstruction: (templateId, text) =>
    get().updateSettings({ templateInstructions: { ...get().settings.templateInstructions, [templateId]: text } }),
  markSummaryCustomized: (meetingId, templateId) => set((s) => ({ customizedSummaries: { ...s.customizedSummaries, [meetingId]: templateId } })),
  clearSummaryCustomized: (meetingId) =>
    set((s) => {
      const next = { ...s.customizedSummaries };
      delete next[meetingId];
      return { customizedSummaries: next };
    }),
  regenerateSummary: async (meetingId, templateId, opts) => {
    const m = await api.post<ApiMeeting>(`/api/meetings/${meetingId}/summary`, { templateId, ...opts });
    set((s) => ({ meetings: replaceMeeting(s.meetings, m) }));
  },
  setMeetingPref: (meetingId, pref) => set((s) => ({ meetingPrefs: { ...s.meetingPrefs, [meetingId]: { ...s.meetingPrefs[meetingId], ...pref } } })),

  editTranscript: async (meetingId, segmentId, edit) => {
    set((s) => ({ transcriptEdits: { ...s.transcriptEdits, [segmentId]: { segmentId, ...edit } } }));
    const m = await api.post<ApiMeeting>(`/api/meetings/${meetingId}/transcript`, { segmentId, ...edit });
    set((s) => {
      const next = { ...s.transcriptEdits };
      delete next[segmentId];
      return { meetings: replaceMeeting(s.meetings, m), transcriptEdits: next };
    });
  },
  trimSegments: async (meetingId, segmentIds) => {
    set((s) => ({ trimmedSegments: { ...s.trimmedSegments, [meetingId]: Array.from(new Set([...(s.trimmedSegments[meetingId] ?? []), ...segmentIds])) } }));
    const m = await api.post<ApiMeeting>(`/api/meetings/${meetingId}/transcript`, { trimSegmentIds: segmentIds });
    set((s) => ({ meetings: replaceMeeting(s.meetings, m) }));
  },
  addBookmark: (meetingId, at) => set((s) => ({ bookmarks: { ...s.bookmarks, [meetingId]: [...(s.bookmarks[meetingId] ?? []), at].sort((a, b) => a - b) } })),
  removeBookmark: (meetingId, at) => set((s) => ({ bookmarks: { ...s.bookmarks, [meetingId]: (s.bookmarks[meetingId] ?? []).filter((x) => x !== at) } })),
  dismissBanner: (id) => set((s) => ({ dismissedBanners: Array.from(new Set([...s.dismissedBanners, id])) })),
  pushAsk: (scope, entry) => set((s) => ({ askHistory: { ...s.askHistory, [scope]: [...(s.askHistory[scope] ?? []), entry] } })),
  clearAsk: (scope) => set((s) => ({ askHistory: { ...s.askHistory, [scope]: [] } })),

  addHighlightType: async (t) => {
    const created = await api.post<HighlightType>("/api/library/highlight-types", { name: t.name, color: t.color });
    set((s) => ({ highlightTypes: [...s.highlightTypes, created] }));
  },
  updateHighlightType: (id, patch) => {
    set((s) => ({ highlightTypes: s.highlightTypes.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
    void api.patch("/api/library/highlight-types", { id, ...patch }).catch(() => {});
  },
  removeHighlightType: async (id) => {
    set((s) => ({ highlightTypes: s.highlightTypes.filter((t) => t.id !== id) }));
    await api.delete("/api/library/highlight-types", { id });
  },
  reorderHighlightTypes: (ids) => {
    set((s) => ({ highlightTypes: ids.map((id) => s.highlightTypes.find((t) => t.id === id)!).filter(Boolean) }));
    void api.patch("/api/library/highlight-types", { order: ids }).catch(() => {});
  },
  addWebhook: (url) => get().updateSettings({ webhooks: [...get().settings.webhooks, { id: uid("wh"), url, scopes: ["My Recordings"], events: ["Summary", "Action items"] }] }),
  removeWebhook: (id) => get().updateSettings({ webhooks: get().settings.webhooks.filter((w) => w.id !== id) }),
  setSeenTutorial: () => set({ seenTutorial: true }),
  resetAll: () => set({ loaded: false, meetings: [] }),
}));

/** Kick off the bootstrap fetch on the client and report when data is ready. */
export function useHydrated() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const loaded = useAppStore((s) => s.loaded);
  const load = useAppStore((s) => s.load);
  useEffect(() => {
    if (mounted) void load();
  }, [mounted, load]);
  return mounted && loaded;
}

/** Poll one meeting while the bot or the pipeline is working on it. */
export function useMeetingPolling(id: string | undefined, intervalMs = 2500) {
  const status = useAppStore((s) => s.meetings.find((m) => m.id === id)?.db?.status);
  const refresh = useAppStore((s) => s.refreshMeeting);
  useEffect(() => {
    if (!id || !status || !ACTIVE_STATES.has(status)) return;
    const t = window.setInterval(() => void refresh(id), intervalMs);
    return () => window.clearInterval(t);
  }, [id, status, intervalMs, refresh]);
}

/** Poll the whole list while any meeting is active (dashboard cards). */
export function useActiveMeetingsPolling(intervalMs = 4000) {
  const activeIds = useAppStore((s) => s.meetings.filter((m) => m.db && ACTIVE_STATES.has(m.db.status)).map((m) => m.id).join(","));
  const refresh = useAppStore((s) => s.refreshMeeting);
  useEffect(() => {
    if (!activeIds) return;
    const ids = activeIds.split(",");
    const t = window.setInterval(() => ids.forEach((id) => void refresh(id)), intervalMs);
    return () => window.clearInterval(t);
  }, [activeIds, intervalMs, refresh]);
}
