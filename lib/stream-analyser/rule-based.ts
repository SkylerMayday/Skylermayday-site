/**
 * Rule-based feedback + improvement notes — pure ports of
 * index.html's generateFeedback (:4030-4137) and generateImprovementNotes
 * (:5009-5106). These feed both the always-on rule-based UI panels and the
 * AI prompt builders in ai-prompts.ts (per specs.md §4 note on
 * "Rule-based feedback/improvement inputs").
 */

import type { AudioProbeResult, ChatClip, ChatComment, FeedbackItem, ImprovementNote, VodMeta } from "./types";
import { fmtDur, fmtDurShort } from "./format";

/** Ported from index.html:4030-4137 (generateFeedback). */
export function generateFeedback(
  meta: VodMeta,
  comments: ChatComment[],
  clips: ChatClip[],
  audio: AudioProbeResult | null
): FeedbackItem[] {
  const fb: FeedbackItem[] = [];
  const dur = meta.duration;
  const cpm = dur > 0 ? comments.length / (dur / 60) : 0;

  if (cpm < 2) {
    fb.push({
      tag: "warn",
      body: `Chat velocity was <strong>${cpm.toFixed(1)} msg/min</strong> — quiet chat. Consider more direct chat engagement: ask questions, read messages aloud, use chat polls.`,
    });
  } else if (cpm > 20) {
    fb.push({
      tag: "good",
      body: `Excellent chat engagement at <strong>${cpm.toFixed(1)} msg/min</strong>. This is the kind of density that creates the "everyone's talking at once" energy on VODs.`,
    });
  } else {
    fb.push({ tag: "info", body: `Chat velocity: <strong>${cpm.toFixed(1)} msg/min</strong>. Healthy but room to grow.` });
  }

  const binSec = 60;
  const nBins = Math.ceil(dur / binSec);
  const bins = new Array(nBins).fill(0);
  comments.forEach((c) => {
    const i = Math.floor(c.t / binSec);
    if (i >= 0 && i < nBins) bins[i]++;
  });
  const dead = bins.filter((b) => b < 2).length;
  const deadPct = (dead / nBins) * 100;
  if (deadPct > 40) {
    fb.push({
      tag: "warn",
      body: `<strong>${deadPct.toFixed(0)}%</strong> of your stream minutes had fewer than 2 chat messages. That's a lot of quiet stretches — the VOD won't retain casual viewers through those.`,
    });
  } else if (deadPct < 10) {
    fb.push({
      tag: "good",
      body: `Almost every minute had active chat (only <strong>${deadPct.toFixed(0)}%</strong> quiet). Great consistency.`,
    });
  }

  let maxDeadRun = 0;
  let curRun = 0;
  bins.forEach((b) => {
    if (b < 2) {
      curRun++;
      maxDeadRun = Math.max(maxDeadRun, curRun);
    } else curRun = 0;
  });
  if (maxDeadRun >= 15) {
    fb.push({
      tag: "warn",
      body: `Your longest quiet stretch was <strong>${maxDeadRun} consecutive minutes</strong> with almost no chat. That's a significant pacing issue — viewers who joined during that window likely left. Consider segment changes, audience interaction beats, or game switching to break up long silences.`,
    });
  } else if (maxDeadRun >= 6) {
    fb.push({ tag: "info", body: `Longest quiet stretch: <strong>${maxDeadRun} min</strong>. Not critical, but worth noting — check what was happening at that point.` });
  }

  const coldOpen = comments.filter((c) => c.t < 300);
  const coldCpm = coldOpen.length / 5;
  if (coldCpm < 1) {
    fb.push({
      tag: "warn",
      body: `<strong>Weak cold open</strong> — only ${coldCpm.toFixed(1)} msg/min in your first 5 minutes. VOD viewers decide whether to keep watching in the first 60–90 seconds. Start with energy: greet chat by name, tease what's coming, jump straight into the action.`,
    });
  } else if (coldCpm >= 3) {
    fb.push({
      tag: "good",
      body: `Strong cold open — <strong>${coldCpm.toFixed(1)} msg/min</strong> in the first 5 minutes. Chat engaged early, which is a good signal for VOD retention.`,
    });
  }

  const outroStart = Math.max(0, dur - 300);
  const outro = comments.filter((c) => c.t >= outroStart);
  const outroCpm = outro.length / 5;
  if (outroCpm < 1 && dur > 600) {
    fb.push({
      tag: "info",
      body: `Quiet outro — <strong>${outroCpm.toFixed(1)} msg/min</strong> in the last 5 minutes. A strong close (thanking regulars by name, announcing next stream) helps retain viewers into the raid and leaves a lasting impression.`,
    });
  } else if (outroCpm >= 3) {
    fb.push({
      tag: "good",
      body: `Active outro — <strong>${outroCpm.toFixed(1)} msg/min</strong> in the final 5 minutes. Chat stayed engaged right to the end.`,
    });
  }

  const subMsgs = comments.filter((c) => c.isSubscriber).length;
  const subPct = comments.length > 0 ? (subMsgs / comments.length) * 100 : 0;
  if (subPct < 10 && comments.length > 50) {
    fb.push({
      tag: "info",
      body: `Subscriber chat share is <strong>${subPct.toFixed(0)}%</strong> — most of your active chatters aren't subbed. That's normal at small scale but suggests community loyalty is still building. Prioritise thanking and calling out subs by name.`,
    });
  } else if (subPct >= 30) {
    fb.push({ tag: "good", body: `<strong>${subPct.toFixed(0)}%</strong> of chat messages came from subscribers — your core community is highly engaged.` });
  }

  if (meta.twitchClipCount != null) {
    const cc = meta.twitchClipCount;
    if (cc === 0) {
      fb.push({ tag: "info", body: `No viewer clips were created during this stream. Clip-worthy moments are a strong virality signal — try more reaction-worthy beats.` });
    } else if (cc >= 5) {
      fb.push({ tag: "good", body: `<strong>${cc} viewer clips</strong> created — strong engagement signal. These moments are your best candidates for social media.` });
    } else {
      fb.push({ tag: "info", body: `<strong>${cc} viewer clip${cc !== 1 ? "s" : ""}</strong> created. A few clips made it out — check which moments they cover in the Studio tab.` });
    }
  }

  if (clips.length) {
    const top = clips[0];
    fb.push({ tag: "info", body: `Your peak moment hit at <strong>${fmtDur(top.start)}</strong>. See the Clips section — this is your first priority for social media.` });
    if (clips.length < 3) {
      fb.push({
        tag: "warn",
        body: `Only ${clips.length} clearly clip-worthy moment${clips.length === 1 ? "" : "s"} detected. If you want to feed your social channels regularly, aim for more hype beats — try segments that prompt reactions (reveals, challenges, audience interaction).`,
      });
    } else {
      fb.push({ tag: "good", body: `<strong>${clips.length}</strong> clip-worthy moments — enough to spread across a week of social posts.` });
    }
  } else {
    fb.push({ tag: "warn", body: `No standout clip-worthy moments detected. Chat engagement was flat throughout — consider hooks, segments, or interactive moments next time.` });
  }

  if (audio && !audio.blocked) {
    const echoSamples = audio.results.filter((r) => r.echo);
    if (echoSamples.length >= 3) {
      fb.push({
        tag: "bad",
        body: `<strong>Echo detected</strong> in ${echoSamples.length}/${audio.results.length} audio samples — likely audio routing problem. Mic may be picking up speakers, or you have desktop audio routed through two sources. See the Ear Test section.`,
      });
    } else if (echoSamples.length > 0) {
      fb.push({
        tag: "warn",
        body: `Possible echo in <strong>${echoSamples.length}/${audio.results.length}</strong> samples — not definitive, could be music or in-game echo effects. Worth spot-checking.`,
      });
    } else {
      fb.push({ tag: "good", body: `Clean audio: no echo detected across ${audio.results.length} sampled segments.` });
    }

    if (audio.loudness) {
      const L = audio.loudness;
      if (L.clippingPct > 0.5) {
        fb.push({
          tag: "bad",
          body: `<strong>Audio is clipping</strong> — ${L.clippingPct.toFixed(2)}% of samples are at digital full-scale (peak ${L.peakDbFS.toFixed(1)} dBFS). This is distortion that can't be fixed after recording. Lower your mic gain or add a limiter (OBS: Filters → Limiter at -1 dB) so peaks don't hit the ceiling.`,
        });
      } else if (L.clippingPct > 0.05) {
        fb.push({
          tag: "warn",
          body: `Occasional clipping detected (${L.clippingPct.toFixed(2)}% of samples, peak ${L.peakDbFS.toFixed(1)} dBFS). Not pervasive but worth pulling your mic gain down 2–3 dB or adding an OBS Limiter for safety.`,
        });
      } else if (L.peakDbFS > -1) {
        fb.push({
          tag: "warn",
          body: `Peak level reached <strong>${L.peakDbFS.toFixed(1)} dBFS</strong> — uncomfortably close to digital clipping. A single louder laugh or bass hit will distort. Aim for peaks around -3 to -6 dBFS.`,
        });
      }

      if (L.meanDbFS < -28 && L.meanDbFS > -100) {
        fb.push({
          tag: "warn",
          body: `Mix is <strong>quiet overall</strong> (average ${L.meanDbFS.toFixed(1)} dBFS). Viewers will crank their system volume to hear you, then get blasted switching to other content. Target average loudness closer to -16 dBFS for voice-forward streams.`,
        });
      } else if (L.meanDbFS >= -18 && L.meanDbFS < -12) {
        fb.push({ tag: "good", body: `Mix loudness <strong>${L.meanDbFS.toFixed(1)} dBFS</strong> is in the sweet spot for streaming voice content.` });
      }

      if (L.quietPct > 20) {
        fb.push({
          tag: "warn",
          body: `<strong>${L.quietPct.toFixed(0)}%</strong> of probed audio was near-silent (below -50 dBFS). Either mic was muted, gain is too low, or there were long dead-air stretches. Check that your mic is properly active throughout.`,
        });
      }
    }
  }

  return fb;
}

/** Ported from index.html:5009-5106 (generateImprovementNotes). */
export function generateImprovementNotes(
  meta: VodMeta,
  comments: ChatComment[],
  clips: ChatClip[],
  audio: AudioProbeResult | null
): ImprovementNote[] {
  const notes: ImprovementNote[] = [];
  const dur = meta.duration;
  const cpm = dur > 0 ? comments.length / (dur / 60) : 0;

  const binSec = 60;
  const nBins = Math.ceil(dur / binSec);
  const bins = new Array(nBins).fill(0);
  comments.forEach((c) => {
    const i = Math.floor(c.t / binSec);
    if (i >= 0 && i < nBins) bins[i]++;
  });
  const deadPct = nBins > 0 ? (bins.filter((b) => b < 2).length / nBins) * 100 : 0;

  const unique = new Set(comments.map((c) => c.user)).size;
  const uniqueRatio = comments.length > 0 ? unique / comments.length : 0;

  const echoCount = audio && !audio.blocked && audio.results ? audio.results.filter((r) => r.echo).length : -1;
  const loudness = audio && audio.loudness;

  if (loudness && loudness.clippingPct > 0.5) {
    notes.push({
      priority: 1,
      tag: "bad",
      text: `<strong>Fix clipping before your next stream.</strong> Your audio hit digital full-scale — that distortion is permanent and can't be fixed after the fact. In OBS, go to your mic source → Filters → add a Limiter set to -1 dB. This takes 30 seconds and prevents the problem entirely.`,
    });
  }
  if (echoCount >= 3) {
    notes.push({
      priority: 1,
      tag: "bad",
      text: `<strong>Resolve the audio echo before going live again.</strong> Echo detected in ${echoCount} audio samples — likely your mic picking up your speakers. Switch to headphones, or in OBS check that desktop audio isn't routed twice (once through your capture card and once through your audio interface).`,
    });
  }
  if (loudness && loudness.meanDbFS < -28 && loudness.meanDbFS > -100) {
    notes.push({
      priority: 2,
      tag: "warn",
      text: `<strong>Raise your mic level.</strong> Your average loudness was ${loudness.meanDbFS.toFixed(1)} dBFS — viewers will max out their volume to hear you, then get blasted switching tabs. Target -16 to -14 dBFS average. In OBS, slowly raise your mic gain filter until the meter sits in the yellow on a normal speaking voice.`,
    });
  }

  if (deadPct > 40) {
    notes.push({
      priority: 2,
      tag: "warn",
      text: `<strong>Break up the quiet stretches.</strong> ${deadPct.toFixed(0)}% of your stream minutes had almost no chat. Before going live, write down 3–5 topics or questions to fall back on when the conversation dies. Asking chat a direct question ("what's everyone playing right now?") reliably triggers a response burst.`,
    });
  } else if (deadPct > 20) {
    notes.push({
      priority: 3,
      tag: "warn",
      text: `<strong>Reduce quiet minutes.</strong> About ${deadPct.toFixed(0)}% of your stream had minimal chat activity. Try narrating your gameplay or thought process during those stretches — it gives viewers something to respond to even when nothing dramatic is happening.`,
    });
  }

  if (cpm < 2 && deadPct <= 40) {
    notes.push({
      priority: 2,
      tag: "warn",
      text: `<strong>Drive more chat interaction.</strong> Your chat velocity was ${cpm.toFixed(1)} msg/min — low for sustained viewer retention. The fastest lever: read chat messages aloud and respond to them by name. Viewers who feel acknowledged come back and bring others.`,
    });
  }

  if (uniqueRatio < 0.25 && comments.length > 50) {
    notes.push({
      priority: 3,
      tag: "warn",
      text: `<strong>Chat is dominated by a few users.</strong> Only ${(uniqueRatio * 100).toFixed(0)}% unique chatters relative to total messages — a sign that a small group is carrying the conversation. Try acknowledging lurkers directly ("I know a lot of you are watching quietly — what brought you to the stream today?") to pull in the silent majority.`,
    });
  }

  if (dur < 30 * 60) {
    notes.push({
      priority: 3,
      tag: "info",
      text: `<strong>Stream longer.</strong> At ${fmtDurShort(dur)}, this session was too short for Twitch's recommendation algorithm to pick it up. Aim for at least 90 minutes — the algorithm starts surfacing channels to browse pages after sustained streaming time, not just quality.`,
    });
  }

  if (clips.length < 2) {
    notes.push({
      priority: 3,
      tag: "info",
      text: `<strong>Create more "moment" opportunities.</strong> Only ${clips.length} clip-worthy moment${clips.length === 1 ? " was" : "s were"} detected. Moments that generate clips tend to be: challenge attempts with a clear outcome, genuine reactions to game events, audience interaction payoffs, or anything with a build-up and a punchline. Plan at least one of these per hour.`,
    });
  }

  notes.sort((a, b) => a.priority - b.priority);
  return notes.slice(0, 5);
}
