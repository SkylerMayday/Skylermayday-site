import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CardSlot from "./CardSlot";
import type { BinderSlot } from "@/lib/binders";

// Mirrors lib/binders.test.ts's `slot(...)` factory shape/defaults exactly
// (field-for-field) so fixtures stay consistent across the two test files.
// Not imported directly from that file: importing a `.test.ts` module would
// re-execute its own top-level `describe(...)` blocks as part of this file's
// suite collection (a well-known Vitest/Jest cross-import gotcha).
const slot = (overrides?: Partial<BinderSlot>): BinderSlot => ({
  dexNumber: 1,
  slotName: "Test Slot",
  slotType: "BASE",
  slotId: "slot-1",
  cardId: "card-1",
  imageUrl: "https://example.com/1.png",
  language: "EN",
  remarks: null,
  isLocked: false,
  ...overrides,
});

// The lock glyph's two shapes, mirroring CardSlot.tsx's inline <svg>: a body
// <rect> plus the shackle <path>. Matching on the actual geometry is what
// keeps the assertions below meaning "the lock icon is present" — the looser
// `span[aria-hidden="true"] svg` query they used to run would keep passing if
// the lock were swapped for any unrelated decorative icon in the same overlay
// span, i.e. the exact regression this guard exists to catch (commit 426e3a3).
const LOCK_ICON_BODY_SELECTOR = 'rect[x="5"][y="11"][width="14"][height="9"]';
const LOCK_ICON_SHACKLE_SELECTOR = 'path[d="M8 11V8a4 4 0 0 1 8 0v3"]';

function queryLockIcon(button: HTMLElement): SVGSVGElement | null {
  const icons = button.querySelectorAll<SVGSVGElement>('span[aria-hidden="true"] svg');
  for (const icon of icons) {
    const hasBody = icon.querySelector(LOCK_ICON_BODY_SELECTOR) !== null;
    const hasShackle = icon.querySelector(LOCK_ICON_SHACKLE_SELECTOR) !== null;
    if (hasBody && hasShackle) return icon;
  }
  return null;
}

describe("CardSlot", () => {
  it("renders an empty slot as an inert div with no button", () => {
    render(<CardSlot slot={slot({ cardId: null, imageUrl: null })} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("Test Slot")).toBeInTheDocument();
  });

  it("renders a filled slot with a working image as a focusable, clickable button, with the lock icon when locked", async () => {
    render(<CardSlot slot={slot({ isLocked: true })} />);
    const button = screen.getByRole("button");
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("aria-label", expect.stringContaining("Test Slot"));
    expect(button).toHaveAttribute("aria-label", expect.stringContaining("(locked)"));
    expect(queryLockIcon(button)).toBeInTheDocument();

    await userEvent.click(button);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders a filled slot without isLocked and shows no lock icon", () => {
    render(<CardSlot slot={slot({ isLocked: false })} />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).not.toContain("(locked)");
    expect(queryLockIcon(button)).not.toBeInTheDocument();
  });

  it("falls back to Placeholder when the image 404s, but keeps the button clickable and the lock icon intact", async () => {
    render(<CardSlot slot={slot({ isLocked: true })} />);
    fireEvent.error(screen.getByRole("img"));

    const fallback = screen.getByRole("img", { name: /image unavailable/i });
    expect(fallback).toBeInTheDocument();

    const button = screen.getByRole("button");
    expect(queryLockIcon(button)).toBeInTheDocument();

    await userEvent.click(button);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("restores focus to the triggering button when the zoom modal closes", async () => {
    render(<CardSlot slot={slot()} />);
    const button = screen.getByRole("button");

    await userEvent.click(button);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(button);
  });
});
