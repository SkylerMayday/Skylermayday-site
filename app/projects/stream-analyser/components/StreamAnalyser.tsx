"use client";

import { useCallback, useState } from "react";
import { ChannelSearch } from "./ChannelSearch";
import { ChannelOverview } from "./ChannelOverview";
import { VodPicker } from "./VodPicker";
import { AnalysisResults } from "./AnalysisResults";
import { StudioClips } from "./StudioClips";
import { fetchChannelVods, fetchAllChat, getVodPlaybackToken, getVodPlaylistUrl } from "@/lib/stream-analyser/twitch-gql";
import { computeScheduleConsistency } from "@/lib/stream-analyser/schedule";
import { scoreClips, dedupClips } from "@/lib/stream-analyser/chat-clip-detection";
import { buildBenchmark, buildBitrateModel } from "@/lib/stream-analyser/benchmark";
import { generateFeedback, generateImprovementNotes } from "@/lib/stream-analyser/rule-based";
import { runAudioProbe, detectAudioMoments } from "@/lib/stream-analyser/audio-pipeline";
import { callClaude, parseClaudeJson } from "@/lib/stream-analyser/title-rating";
import {
  titleRatingPrompt,
  feedbackPrompt as buildFeedbackPrompt,
  metricsPrompt,
  discoverabilityPrompt,
} from "@/lib/stream-analyser/ai-prompts";
import { fmtDurShort } from "@/lib/stream-analyser/format";
import type {
  AiCardState,
  AudioClip,
  AudioProbeResult,
  BenchmarkModel,
  BitrateModel,
  ChannelData,
  ChatClip,
  ChatComment,
  Discoverability,
  FeedbackItem,
  ScheduleModel,
  StreamMetrics,
  TitleRating,
  VodMeta,
  VodSummary,
} from "@/lib/stream-analyser/types";

type Phase = "idle" | "loadingChannel" | "channelLoaded" | "analyzing" | "analyzed" | "error";

interface AnalysisData {
  meta: VodMeta;
  benchmark: BenchmarkModel;
  bitrate: BitrateModel | null;
  chatClips: ChatClip[];
  audioClips: AudioClip[];
  audioProbe: AudioProbeResult | null;
}

interface SaState {
  phase: Phase;
  channelLogin: string | null;
  channel: ChannelData | null;
  vods: VodSummary[] | null;
  selectedVodId: string | null;
  analysis: AnalysisData | null;
  errorMessage: string | null;
}

const INITIAL_STATE: SaState = {
  phase: "idle",
  channelLogin: null,
  channel: null,
  vods: null,
  selectedVodId: null,
  analysis: null,
  errorMessage: null,
};

/** Top-level orchestrator/state machine. Owns the data flow described in specs.md §5. */
export function StreamAnalyser() {
  const [state, setState] = useState<SaState>(INITIAL_STATE);
  const [schedule, setSchedule] = useState<ScheduleModel | null>(null);
  const [discoverability, setDiscoverability] = useState<AiCardState<Discoverability>>({ status: "idle" });
  const [titleRating, setTitleRating] = useState<AiCardState<TitleRating>>({ status: "idle" });
  const [feedback, setFeedback] = useState<AiCardState<FeedbackItem[]>>({ status: "idle" });
  const [metrics, setMetrics] = useState<AiCardState<StreamMetrics>>({ status: "idle" });

  const [logLines, setLogLines] = useState<string[]>([]);
  const [progressPct, setProgressPct] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(null);

  const addLog = useCallback((msg: string) => {
    setLogLines((prev) => [...prev, `${new Date().toLocaleTimeString()} — ${msg}`]);
  }, []);

  async function runDiscoverabilityAudit(channel: ChannelData) {
    setDiscoverability({ status: "loading" });
    try {
      const spec = discoverabilityPrompt(channel);
      const raw = await callClaude(spec.system, spec.user, spec.maxTokens);
      const data = parseClaudeJson<Discoverability>(raw);
      setDiscoverability({ status: "ok", data });
    } catch (err) {
      setDiscoverability({ status: "error", message: (err as Error).message });
    }
  }

  async function handleChannelSearch(login: string) {
    setState({ ...INITIAL_STATE, phase: "loadingChannel", channelLogin: login });
    setSchedule(null);
    setDiscoverability({ status: "idle" });
    setLogLines([]);
    addLog(`Loading channel data for ${login}…`);

    try {
      const [channelRes, vods] = await Promise.all([
        fetch(`/api/stream-analyser/channel?login=${encodeURIComponent(login)}`).then((r) => r.json()),
        fetchChannelVods(login),
      ]);

      if (!channelRes.ok) {
        const message =
          channelRes.error === "not_found"
            ? "Channel not found or has no public data."
            : "Twitch data unavailable (their API changed or blocked this request).";
        setState((s) => ({ ...s, phase: "error", errorMessage: message }));
        addLog(`Channel load failed: ${message}`);
        return;
      }

      const channel = channelRes.channel as ChannelData;
      setSchedule(computeScheduleConsistency(vods));
      setState((s) => ({ ...s, phase: "channelLoaded", channel, vods }));
      addLog(`Loaded ${vods.length} VODs for ${login}.`);

      // Fire discoverability audit in the background — never blocks the UI.
      void runDiscoverabilityAudit(channel);
    } catch (err) {
      setState((s) => ({ ...s, phase: "error", errorMessage: (err as Error).message }));
      addLog(`Channel load failed: ${(err as Error).message}`);
    }
  }

  async function handleVodSelect(vodId: string) {
    const vod = state.vods?.find((v) => v.id === vodId);
    if (!vod) return;

    const startTime = Date.now();
    setState((s) => ({ ...s, phase: "analyzing", selectedVodId: vodId, analysis: null }));
    setTitleRating({ status: "idle" });
    setFeedback({ status: "idle" });
    setMetrics({ status: "idle" });
    setElapsedSeconds(null);
    setProgressPct(0);
    addLog(`Starting analysis for VOD ${vodId}…`);

    const meta: VodMeta = {
      id: vod.id,
      title: vod.title,
      duration: vod.lengthSeconds,
      twitchClipCount: null,
    };

    let comments: ChatComment[] = [];
    try {
      addLog("Fetching chat replay…");
      comments = await fetchAllChat(vodId);
      addLog(`Fetched ${comments.length} chat messages.`);
    } catch (err) {
      addLog(`Chat fetch failed (continuing without chat): ${(err as Error).message}`);
    }
    setProgressPct(20);

    try {
      if (!state.channel) throw new Error("No channel loaded");
      const clipCountParams = new URLSearchParams({
        vodId,
        broadcasterId: state.channel.id,
        startedAt: vod.createdAt,
        durationSeconds: String(vod.lengthSeconds),
      });
      const clipCountRes = await fetch(`/api/stream-analyser/channel?${clipCountParams.toString()}`).then((r) =>
        r.json()
      );
      if (clipCountRes.ok) meta.twitchClipCount = clipCountRes.clipCount;
    } catch {
      // Non-fatal — clip count is a nice-to-have benchmark row.
    }
    setProgressPct(30);

    const chatClips = scoreClips(comments, meta.duration);
    const benchmark = buildBenchmark(meta, comments, chatClips);
    addLog(`Scored ${chatClips.length} chat-driven clip candidates.`);
    setProgressPct(40);

    let bitrate: BitrateModel | null = null;
    try {
      addLog("Fetching stream bitrate info…");
      const token = await getVodPlaybackToken(vodId);
      const masterUrl = getVodPlaylistUrl(token, vodId);
      const masterText = await fetch(`/api/stream-analyser/playlist-proxy?url=${encodeURIComponent(masterUrl)}`).then(
        (r) => r.text()
      );
      bitrate = buildBitrateModel(masterText);
    } catch (err) {
      addLog(`Bitrate fetch failed: ${(err as Error).message}`);
    }
    setProgressPct(55);

    let audioProbe: AudioProbeResult | null = null;
    let audioClips: AudioClip[] = [];
    try {
      audioProbe = await runAudioProbe(vodId, (pct, msg) => {
        setProgressPct(55 + pct * 0.4);
        addLog(msg);
      });
      if (!audioProbe.blocked) {
        const moments = detectAudioMoments(audioProbe.decodedBuffers);
        const rawAudioClips: AudioClip[] = moments.map((m) => ({
          start: Math.max(0, m.absoluteTime - 15),
          end: Math.min(meta.duration, m.absoluteTime + 15),
          score: m.zScore,
          z: m.zScore,
          rms: m.rms,
        }));
        const deduped = dedupClips(rawAudioClips, chatClips);
        audioClips = deduped.audioClips;
      } else {
        addLog(`Audio probe blocked: ${audioProbe.reason}`);
      }
    } catch (err) {
      audioProbe = { blocked: true, reason: (err as Error).message, results: [], loudness: null, decodedBuffers: [] };
      addLog(`Audio probe failed: ${(err as Error).message}`);
    }
    setProgressPct(95);

    setState((s) => ({
      ...s,
      phase: "analyzed",
      analysis: { meta, benchmark, bitrate, chatClips, audioClips, audioProbe },
    }));
    setProgressPct(100);
    setElapsedSeconds(Math.round((Date.now() - startTime) / 1000));
    addLog(`Analysis complete in ${Math.round((Date.now() - startTime) / 1000)}s.`);

    // AI cards — fire-and-forget, never block the non-AI analysis (specs.md §6 edge cases).
    const ruleFeedback = generateFeedback(meta, comments, chatClips, audioProbe);
    const ruleNotes = generateImprovementNotes(meta, comments, chatClips, audioProbe);
    void ruleNotes; // rule-based notes feed the AI prompt only; no dedicated UI panel in this port's component list.

    setTitleRating({ status: "loading" });
    (async () => {
      try {
        const spec = titleRatingPrompt(meta.title);
        const raw = await callClaude(spec.system, spec.user, spec.maxTokens);
        setTitleRating({ status: "ok", data: parseClaudeJson<TitleRating>(raw) });
      } catch (err) {
        setTitleRating({ status: "error", message: "AI is rate-limited or unavailable — try again later." });
        addLog(`Title rating failed: ${(err as Error).message}`);
      }
    })();

    setFeedback({ status: "loading" });
    (async () => {
      try {
        const spec = buildFeedbackPrompt(meta, comments, chatClips, audioProbe, ruleFeedback);
        const raw = await callClaude(spec.system, spec.user, spec.maxTokens);
        setFeedback({ status: "ok", data: parseClaudeJson<FeedbackItem[]>(raw) });
      } catch {
        // Rule-based feedback still renders via the benchmark card; AI is enhancement only.
        setFeedback({ status: "ok", data: ruleFeedback });
        addLog("AI feedback unavailable — showing rule-based feedback.");
      }
    })();

    setMetrics({ status: "loading" });
    (async () => {
      try {
        const spec = metricsPrompt(meta, comments, chatClips, audioProbe);
        const raw = await callClaude(spec.system, spec.user, spec.maxTokens);
        setMetrics({ status: "ok", data: parseClaudeJson<StreamMetrics>(raw) });
      } catch (err) {
        setMetrics({ status: "error", message: "AI is rate-limited or unavailable — try again later." });
        addLog(`AI metrics failed: ${(err as Error).message}`);
      }
    })();
  }

  return (
    <div className="flex flex-col gap-6">
      <ChannelSearch onSearch={handleChannelSearch} loading={state.phase === "loadingChannel"} />

      {state.phase === "error" && (
        <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {state.errorMessage}
        </div>
      )}

      {(logLines.length > 0 || state.phase === "analyzing") && (
        <div className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
            <div
              className="h-full bg-neutral-900 transition-all dark:bg-neutral-100"
              style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
            />
          </div>
          <div className="max-h-32 overflow-y-auto font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
            {logLines.map((line, i) => (
               
              <div key={i}>{line}</div>
            ))}
          </div>
          {elapsedSeconds !== null && (
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Completed in {fmtDurShort(elapsedSeconds)}.</div>
          )}
        </div>
      )}

      {state.channel && (
        <ChannelOverview
          channel={state.channel}
          discoverability={discoverability}
          onRunDiscoverability={() => void runDiscoverabilityAudit(state.channel!)}
          schedule={schedule}
        />
      )}

      {state.vods && (
        <VodPicker vods={state.vods} onSelect={handleVodSelect} disabled={state.phase === "analyzing"} />
      )}

      {state.analysis && (
        <>
          <AnalysisResults
            meta={state.analysis.meta}
            benchmark={state.analysis.benchmark}
            bitrate={state.analysis.bitrate}
            titleRating={titleRating}
            feedback={feedback}
            metrics={metrics}
          />
          <StudioClips
            chatClips={state.analysis.chatClips}
            audioClips={state.analysis.audioClips}
            audioProbe={state.analysis.audioProbe}
            vodId={state.selectedVodId!}
          />
        </>
      )}
    </div>
  );
}
