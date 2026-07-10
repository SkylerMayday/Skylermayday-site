/**
 * Shared TypeScript types for the Stream Analyser port. No runtime code —
 * pure type definitions, per specs.md §4.
 */

export interface VodSummary {
  id: string;
  title: string;
  broadcastType: string;
  lengthSeconds: number;
  previewThumbnailURL: string;
  viewCount: number;
  createdAt: string;
  ownerLogin: string;
  ownerDisplayName: string;
}

export interface VodMeta {
  id: string;
  title: string;
  duration: number;
  twitchClipCount: number | null;
}

export interface ChatComment {
  t: number;
  user: string;
  msg: string;
  emotes: { id: string; name: string }[];
  badges: string[];
  isSubscriber: boolean;
  isMod: boolean;
  isVIP: boolean;
}

export interface ChatClip {
  start: number;
  end: number;
  score: number;
  z: number;
  laughs: number;
  hype: number;
  hypeEmotes: number;
  unique: number;
  msgCount: number;
  sample: ChatComment[];
}

export interface AudioMoment {
  absoluteTime: number;
  rms: number;
  zScore: number;
}

export interface AudioClip {
  start: number;
  end: number;
  score: number;
  z: number;
  rms: number;
}

export interface EchoResult {
  offset: number;
  echo: boolean;
  confidence: number;
  lagMs: number;
}

export interface LoudnessStats {
  peakDbFS: number;
  meanDbFS: number;
  clippingPct: number;
  quietPct: number;
  samplesAnalysed: number;
}

export interface DecodedSegment {
  offset: number;
  buffer: AudioBuffer;
}

export interface AudioProbeResult {
  blocked: boolean;
  reason?: string;
  results: EchoResult[];
  loudness: LoudnessStats | null;
  decodedBuffers: DecodedSegment[];
}

export interface ChannelData {
  id: string;
  login: string;
  displayName: string;
  description: string;
  profileImageUrl: string;
  followers: number;
  title: string;
  category: string;
  tags: string[];
  language: string;
}

export interface BenchmarkRow {
  label: string;
  value: string;
  status: "ok" | "warn" | "bad" | "dim";
  ranges: string;
  note: string;
}

export interface BenchmarkModel {
  rows: BenchmarkRow[];
}

export interface BitrateVariant {
  bw: number;
  res: string;
  name: string;
  uri: string;
}

export interface BitrateModel {
  variants: BitrateVariant[];
  sourceNote: string;
}

export interface HlsMediaPlaylist {
  initUri: string | null;
  segments: { uri: string; duration: number }[];
}

export interface HlsVariant {
  uri: string;
  bandwidth: number;
  res?: string;
  name?: string;
}

export interface ScheduleModel {
  totalStreams: number;
  dayCounts: number[];
  dayNames: string[];
  consistencyPct: number;
  peakLabel: string;
  avgDurSec: number;
  medianGapDays: number | null;
  weekdays: number[];
}

export interface FeedbackItem {
  tag: "good" | "warn" | "bad" | "info";
  body: string;
}

export interface ImprovementNote {
  priority: 1 | 2 | 3;
  tag: "good" | "warn" | "bad" | "info";
  text: string;
}

export interface AiDimension {
  name: string;
  score: number;
  note: string;
}

export interface TitleRating {
  score: number;
  verdict: string;
  dimensions: AiDimension[];
  strengths: string[];
  weaknesses: string[];
  alternatives: string[];
}

export interface StreamMetrics {
  overall: number;
  verdict: string;
  dimensions: AiDimension[];
}

export interface Discoverability {
  score: number;
  verdict: string;
  dimensions: AiDimension[];
  wins: string[];
  issues: string[];
  actions: string[];
}

export interface DescriptionAnalysis {
  score: number;
  verdict: string;
  dimensions: AiDimension[];
  strengths: string[];
  issues: string[];
  rewrite: string;
}

export type AiCardState<T = unknown> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; data: T }
  | { status: "error"; message: string };
