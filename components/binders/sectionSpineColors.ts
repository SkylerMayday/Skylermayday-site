/**
 * Spine color schemes per section.
 *
 * Generation sections: one solid color BLOCK per game title in that
 * generation (multi-block spine). Hex values from the product spec's
 * palette table (2026-07-09) — real game box-art brand colors.
 *
 * Non-generation sections: a single thematic gradient (from/to hex),
 * chosen at design stage per the product spec's delegation. Saturation
 * kept in line with the generation palette.
 *
 * Keyed by EXACT live section name. Anything not present here falls back
 * to FALLBACK_SPINE (a neutral slate gradient) — so a brand-new section
 * name published later still renders a valid spine with zero code change
 * (preserves the "grows automatically" principle). Coder: keep this table
 * the single source of spine color truth.
 */

export interface BlockSpine {
  kind: "blocks";
  blocks: string[]; // hex colors, one per game title
}

export interface GradientSpine {
  kind: "gradient";
  from: string; // hex
  to: string; // hex
}

export type SpineScheme = BlockSpine | GradientSpine;

const GENERATION_SPINES: Record<string, BlockSpine> = {
  "Generation I": { kind: "blocks", blocks: ["#CC2929", "#2E8B57", "#2A5DBF", "#F2C41B"] },
  "Generation II": { kind: "blocks", blocks: ["#C4A130", "#A8A8B0", "#7FD8D8"] },
  "Generation III": { kind: "blocks", blocks: ["#8B1A2B", "#1B4C9E", "#1F8A5F"] },
  "Generation IV": { kind: "blocks", blocks: ["#A8C8E8", "#F0C8D8", "#B8C0C8"] },
  "Generation V": { kind: "blocks", blocks: ["#1A1A1A", "#F5F5F0"] },
  "Generation VI": { kind: "blocks", blocks: ["#2E6FA8", "#C4364B"] },
  "Generation VII": { kind: "blocks", blocks: ["#F2941C", "#5B4E9E"] },
  "Generation VIII": { kind: "blocks", blocks: ["#3E9ED4", "#C4405A"] },
  "Generation IX": { kind: "blocks", blocks: ["#C4283C", "#8C4EA8"] },
};

const NON_GENERATION_SPINES: Record<string, GradientSpine> = {
  // Regional Variants — earth-tone gradient (regional / terrain identity).
  "Regional Variants": { kind: "gradient", from: "#8A6D3B", to: "#4E7A46" },
  // Alternate Forms — teal->indigo "shifting form" gradient, distinct from megas.
  "Alternate Forms": { kind: "gradient", from: "#2C9AA0", to: "#3B4C9E" },
  // Mega Evolutions — purple/energy gradient (Mega stone / energy identity).
  "Mega Evolutions": { kind: "gradient", from: "#7A2FB0", to: "#C4364B" },
  // VMax — bold red/black gradient (Dynamax red energy).
  "VMax": { kind: "gradient", from: "#C4283C", to: "#1A1A1A" },
};

/** Neutral slate fallback for any unrecognized section name. */
export const FALLBACK_SPINE: GradientSpine = {
  kind: "gradient",
  from: "#64748B",
  to: "#334155",
};

export function getSpineScheme(sectionName: string): SpineScheme {
  return (
    GENERATION_SPINES[sectionName] ??
    NON_GENERATION_SPINES[sectionName] ??
    FALLBACK_SPINE
  );
}
