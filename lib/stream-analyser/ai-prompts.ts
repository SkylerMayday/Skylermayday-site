/**
 * All Claude system/user prompt builders + result types, ported verbatim
 * (prompt wording unchanged) from index.html:
 *   - titleRatingPrompt      :6248-6253  (maxTokens 1000)
 *   - feedbackPrompt         :6168-6191  (maxTokens 900)
 *   - improvementNotesPrompt :6008-6028  (maxTokens 800)
 *   - metricsPrompt          :6079-6092  (maxTokens 500)
 *   - discoverabilityPrompt  :6439-6449  (maxTokens 1000)
 *   - descriptionPrompt      :6357-6362  (maxTokens 900)
 *
 * Each builder returns { system, user, maxTokens } for the caller to pass
 * straight into callClaude() (title-rating.ts). Parsing uses
 * parseClaudeJson<T>() against the result interfaces below.
 */

import { fmtDur, fmtDurShort, nFmt } from "./format";
import type {
  AudioProbeResult,
  ChannelData,
  ChatClip,
  ChatComment,
  FeedbackItem,
  ImprovementNote,
  VodMeta,
} from "./types";

export type {
  TitleRating,
  StreamMetrics,
  FeedbackItem,
  Discoverability,
  DescriptionAnalysis,
} from "./types";

interface PromptSpec {
  system: string;
  user: string;
  maxTokens: number;
}

function chatStats(meta: VodMeta, comments: ChatComment[]) {
  const dur = meta.duration;
  const cpm = dur > 0 ? comments.length / (dur / 60) : 0;
  const unique = new Set(comments.map((c) => c.user)).size;
  const uniqueRatio = comments.length > 0 ? unique / comments.length : 0;
  const binSec = 60;
  const nBins = Math.ceil(dur / binSec);
  const bins = new Array(nBins).fill(0);
  comments.forEach((c) => {
    const i = Math.floor(c.t / binSec);
    if (i >= 0 && i < nBins) bins[i]++;
  });
  const deadPct = nBins > 0 ? (bins.filter((b) => b < 2).length / nBins) * 100 : 0;
  return { dur, cpm, unique, uniqueRatio, deadPct };
}

function echoAndLoudness(audio: AudioProbeResult | null) {
  const echoCount = audio && !audio.blocked && audio.results ? audio.results.filter((r) => r.echo).length : -1;
  const loudness = audio && audio.loudness;
  return { echoCount, loudness };
}

/** Ported from index.html:6243-6253 (runTitleRating's prompt). */
export function titleRatingPrompt(title: string): PromptSpec {
  const system = `You are a Twitch title optimisation expert. Analyse stream titles and return ONLY valid JSON — no other text.
Return: { "score": 1-10, "verdict": "one sentence", "dimensions": [ { "name": "string", "score": 1-10, "note": "string" } ], "strengths": ["string"], "weaknesses": ["string"], "alternatives": ["string","string","string"] }
Dimensions to score: Clickability, Searchability, Emotional hook, Clarity, Length.
Alternatives should be meaningfully different rewrites — not just minor edits.`;

  const user = `Rate this Twitch stream title: "${title}"`;

  return { system, user, maxTokens: 1000 };
}

/** Ported from index.html:6142-6191 (runAIFeedback's prompt). */
export function feedbackPrompt(
  meta: VodMeta,
  comments: ChatComment[],
  clips: ChatClip[],
  audio: AudioProbeResult | null,
  ruleBasedFeedback: FeedbackItem[]
): PromptSpec {
  const { dur, cpm, unique, uniqueRatio, deadPct } = chatStats(meta, comments);
  const { echoCount, loudness } = echoAndLoudness(audio);
  const topClip = clips && clips[0];

  const system = `You are a Twitch stream analyst. Given stream metrics, generate a list of specific, data-driven feedback items a streamer can read immediately after their session.
Return ONLY valid JSON — an array of objects, each: { "tag": "good"|"warn"|"bad"|"info", "body": "HTML string with <strong> for emphasis" }.
Rules:
- Reference actual numbers from the data. Be precise.
- "good" = genuine strength worth celebrating. "bad" = something broken. "warn" = opportunity. "info" = context or FYI.
- Max 8 items. Prioritise bad → warn → good → info ordering.
- Body should be 1-2 sentences. No generic filler.
- Return ONLY the JSON array, no other text.`;

  const ruleText = ruleBasedFeedback.map((item) => `[${item.tag}] ${item.body.replace(/<[^>]+>/g, "")}`).join("\n");

  const user = `Stream data:
- Duration: ${fmtDurShort(dur)} (${Math.round(dur / 60)} min)
- Chat: ${nFmt(comments.length)} total messages, ${nFmt(unique)} unique chatters, ${cpm.toFixed(1)} msg/min
- Dead-air: ${deadPct.toFixed(0)}% of minutes had fewer than 2 messages
- Unique chatter ratio: ${(uniqueRatio * 100).toFixed(0)}% (higher = more diverse participation)
- Clip-worthy moments: ${clips ? clips.length : 0}${topClip ? ` — top at ${fmtDur(topClip.start)} (score ${topClip.score.toFixed(1)})` : ""}
${loudness ? `- Audio loudness: mean ${loudness.meanDbFS.toFixed(1)} dBFS, peak ${loudness.peakDbFS.toFixed(1)} dBFS, ${loudness.clippingPct.toFixed(2)}% clipping, ${loudness.quietPct.toFixed(0)}% quiet` : "- Audio: not analysed"}
${echoCount >= 0 ? `- Echo detected in ${echoCount} audio samples` : ""}

Rule-based feedback already generated (for context):
${ruleText}

Generate feedback that is more contextual and specific to these numbers. If the rules already captured something well, improve the phrasing. If something important is missing from the rules, add it.`;

  return { system, user, maxTokens: 900 };
}

/** Ported from index.html:5982-6028 (runAIImprovementNotes's prompt). */
export function improvementNotesPrompt(
  meta: VodMeta,
  comments: ChatComment[],
  clips: ChatClip[],
  audio: AudioProbeResult | null,
  ruleBasedNotes: ImprovementNote[]
): PromptSpec {
  const { dur, cpm, uniqueRatio, deadPct } = chatStats(meta, comments);
  const { echoCount, loudness } = echoAndLoudness(audio);
  const topClip = clips && clips[0];

  const system = `You are a Twitch stream coach. You give concise, specific, actionable advice to streamers based on their stream data.
Your output must be valid JSON — an array of up to 5 objects, each with: { "priority": 1-3, "tag": "bad"|"warn"|"info"|"good", "text": "HTML string" }.
In the text field, use <strong> tags for emphasis. Be direct and specific — reference the actual numbers.
Do not use generic advice. Do not repeat yourself. Priority 1 = must fix now, 2 = should fix soon, 3 = worth considering.
Return ONLY the JSON array, no other text.`;

  const ruleText = ruleBasedNotes
    .map((n, i) => `${i + 1}. [${n.tag}] ${(n.text || "").replace(/<[^>]+>/g, "")}`)
    .join("\n");

  const user = `Stream data:
- Duration: ${fmtDurShort(dur)} (${Math.round(dur / 60)} minutes)
- Chat: ${nFmt(comments.length)} messages, ${nFmt(new Set(comments.map((c) => c.user)).size)} unique chatters, ${cpm.toFixed(1)} msg/min
- Dead-air: ${deadPct.toFixed(0)}% of minutes had <2 messages
- Unique chatter ratio: ${(uniqueRatio * 100).toFixed(0)}%
- Clip-worthy moments detected: ${clips ? clips.length : 0}${topClip ? ` (top moment at ${fmtDur(topClip.start)}, score ${topClip.score.toFixed(1)})` : ""}
${loudness ? `- Audio loudness: mean ${loudness.meanDbFS.toFixed(1)} dBFS, peak ${loudness.peakDbFS.toFixed(1)} dBFS, ${loudness.clippingPct.toFixed(2)}% clipping` : "- Audio: not analysed"}
${echoCount >= 0 ? `- Echo detected in ${echoCount}/15 audio samples` : ""}

Rule-based notes already generated (use as context, but synthesise and improve):
${ruleText}

Write 3-5 improvement notes that are more contextual, specific to these exact numbers, and prioritised correctly. If the data shows something the rules missed, include it. If the rules are already correct and well-phrased, you may refine rather than replace them.`;

  return { system, user, maxTokens: 800 };
}

/** Ported from index.html:6057-6092 (runAIMetrics's prompt). Note: duration intentionally NOT passed as a scoring signal. */
export function metricsPrompt(
  meta: VodMeta,
  comments: ChatComment[],
  clips: ChatClip[],
  audio: AudioProbeResult | null
): PromptSpec {
  const binSec = 60;
  const nBins = Math.ceil((meta.duration || 0) / binSec);
  const bins = new Array(nBins).fill(0);
  comments.forEach((c) => {
    const i = Math.floor(c.t / binSec);
    if (i >= 0 && i < nBins) bins[i]++;
  });
  const deadPct = nBins > 0 ? Math.round((bins.filter((b) => b < 2).length / nBins) * 100) : 0;
  const cpm = meta.duration > 0 ? (comments.length / (meta.duration / 60)).toFixed(2) : "0";
  const unique = new Set(comments.map((c) => c.user)).size;
  const uniqueRatio = comments.length > 0 ? (unique / comments.length).toFixed(2) : "0";
  const topClip = clips && clips[0];
  const { echoCount, loudness } = echoAndLoudness(audio);

  const system = `You are a Twitch stream performance analyst. Given stream engagement metrics, return ONLY valid JSON — no other text, no markdown.
Return exactly: { "overall": <1-10 integer>, "verdict": "<one punchy sentence>", "dimensions": [ { "name": string, "score": <1-10 integer>, "note": "<15 words max>" }, ... ] }
Use exactly these 4 dimension names: "Chat Engagement", "Audience Retention", "Content Quality", "Audio Quality".
Base scores on the data. Be precise and honest — don't inflate.`;

  const user = `Stream metrics:
- Chat messages: ${comments.length} total, ${cpm}/min rate, ${uniqueRatio} unique-chatter ratio
- Dead minutes (< 2 msg): ${deadPct}%
- Clip moments found: ${clips ? clips.length : 0}${topClip ? `, top clip z-score: ${topClip.z ? topClip.z.toFixed(1) : "n/a"}` : ""}
- Echo issues detected: ${echoCount >= 0 ? echoCount : "audio not probed"}
- Loudness mean: ${loudness ? loudness.meanDbFS.toFixed(1) + " dBFS" : "not available"}
- Clipping: ${loudness ? (loudness.clippingPct > 0 ? loudness.clippingPct.toFixed(1) + "% of samples" : "none") : "not available"}

Score all 4 dimensions and give an overall score.`;

  return { system, user, maxTokens: 500 };
}

/** Ported from index.html:6416-6449 (runDiscoverabilityAudit's prompt). */
export function discoverabilityPrompt(channel: ChannelData): PromptSpec {
  const title = channel.title || "(no title set)";
  const category = channel.category || "(no category set)";
  const tags = channel.tags.length ? channel.tags.join(", ") : "(no tags set)";
  const language = channel.language || "unknown";
  const description = channel.description || "(no description set)";

  const system = `You are a Twitch channel discoverability expert. Analyse channel metadata and return ONLY valid JSON — no other text.
Return: { "score": 1-10, "verdict": "one sentence summary", "dimensions": [ { "name": string, "score": 1-10, "note": string } ], "wins": [string], "issues": [string], "actions": [string] }
Dimensions to score: Title clarity, Category fit, Tag coverage, Description quality, Language/accessibility.
Actions should be specific and immediately actionable — not generic advice. Max 5 actions.`;

  const user = `Audit this Twitch channel for discoverability:
- Stream title: "${title}"
- Category: "${category}"
- Tags: ${tags}
- Language: ${language}
- Description: "${description.slice(0, 500)}"`;

  return { system, user, maxTokens: 1000 };
}

/** Ported from index.html:6349-6362 (desc-analysis-btn handler's prompt). */
export function descriptionPrompt(description: string): PromptSpec {
  const system = `You are a Twitch channel growth expert. Analyse channel descriptions and return ONLY valid JSON — no other text.
Return: { "score": 1-10, "verdict": "one sentence", "dimensions": [ { "name": string, "score": 1-10, "note": string } ], "strengths": [string], "issues": [string], "rewrite": "improved version of the description (plain text, max 300 chars)" }
Dimensions: Discoverability, Tone, Call-to-action, Keyword clarity, Completeness.
The rewrite should be a genuinely improved version the streamer can copy directly.`;

  const user = `Analyse this Twitch channel description:\n\n"${description}"`;

  return { system, user, maxTokens: 900 };
}
