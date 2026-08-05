import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import ThemeToggle from "./ThemeToggle";

function renderToggle() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ThemeToggle />
    </ThemeProvider>
  );
}

/**
 * Flips the mocked OS colour scheme and flushes the resulting React state
 * update before the caller asserts. Without the `act(...)` wrapper the
 * `next-themes` media listener still fires, but its `setState` is scheduled
 * rather than applied — so a "the label must NOT change" assertion would
 * read a stale DOM and pass even if the behaviour had regressed.
 */
async function flipSystemColorScheme(prefersDark: boolean) {
  await act(async () => {
    globalThis.__setSystemColorScheme(prefersDark);
  });
}

describe("ThemeToggle", () => {
  afterEach(() => {
    // Order-independent: the localStorage spy installed by the last case
    // below must not survive into whatever test runs next, regardless of
    // declaration order or `--sequence.shuffle`.
    vi.restoreAllMocks();
  });

  it("resolves to light on first visit when the OS prefers light", () => {
    globalThis.__setSystemColorScheme(false);
    renderToggle();
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Switch to dark theme");
  });

  it("resolves to dark on first visit when the OS prefers dark", () => {
    globalThis.__setSystemColorScheme(true);
    renderToggle();
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Switch to light theme");
  });

  it("renders a fixed-dimension placeholder before mount, matching the post-mount button's size", () => {
    const html = renderToStaticMarkup(<ThemeToggle />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("h-11");
    expect(html).toContain("w-11");
    expect(html).not.toContain("<button");

    globalThis.__setSystemColorScheme(false);
    renderToggle();
    const button = screen.getByRole("button");
    expect(button.className).toContain("h-11");
    expect(button.className).toContain("w-11");
  });

  it("flips from light to dark and back on click, toggling the .dark class on <html>", async () => {
    globalThis.__setSystemColorScheme(false);
    renderToggle();
    const button = screen.getByRole("button");

    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-label", "Switch to light theme");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-label", "Switch to dark theme");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("persists the clicked choice to localStorage under the 'theme' key", async () => {
    globalThis.__setSystemColorScheme(false);
    renderToggle();
    await userEvent.click(screen.getByRole("button"));
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("activates on Enter when focused", async () => {
    globalThis.__setSystemColorScheme(false);
    renderToggle();
    const button = screen.getByRole("button");
    button.focus();
    await userEvent.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-label", "Switch to light theme");
  });

  it("activates on Space when focused", async () => {
    globalThis.__setSystemColorScheme(false);
    renderToggle();
    const button = screen.getByRole("button");
    button.focus();
    await userEvent.keyboard(" ");
    expect(button).toHaveAttribute("aria-label", "Switch to light theme");
  });

  it("suppresses the icon-swap transition under reduced motion", () => {
    globalThis.__setSystemColorScheme(false);
    renderToggle();
    const icons = document.querySelectorAll("svg");
    expect(icons.length).toBe(2);
    for (const icon of icons) {
      expect(icon.getAttribute("class")).toContain("motion-reduce:transition-none");
    }
  });

  // Positive control for the two "stored choice wins" cases below: proves the
  // OS-flip mechanism (mock -> next-themes listener -> re-render -> DOM) does
  // reach the label at all. Without this, those two negative assertions could
  // be green purely because nothing ever propagates.
  it("follows the OS when no explicit choice is stored", async () => {
    globalThis.__setSystemColorScheme(false);
    renderToggle();
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Switch to dark theme");

    await flipSystemColorScheme(true);
    expect(button).toHaveAttribute("aria-label", "Switch to light theme");
  });

  it("keeps an explicit stored 'light' choice even when the OS switches to dark", async () => {
    localStorage.setItem("theme", "light");
    globalThis.__setSystemColorScheme(false);
    renderToggle();
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Switch to dark theme");

    await flipSystemColorScheme(true);
    expect(button).toHaveAttribute("aria-label", "Switch to dark theme");
  });

  it("keeps an explicit stored 'dark' choice even when the OS switches to light", async () => {
    localStorage.setItem("theme", "dark");
    globalThis.__setSystemColorScheme(true);
    renderToggle();
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Switch to light theme");

    await flipSystemColorScheme(false);
    expect(button).toHaveAttribute("aria-label", "Switch to light theme");
  });

  it("does not throw when localStorage is unavailable, and the choice still applies for the session", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked");
    });
    globalThis.__setSystemColorScheme(false);
    renderToggle();
    const button = screen.getByRole("button");

    expect(() => fireEvent.click(button)).not.toThrow();
    expect(button).toHaveAttribute("aria-label", "Switch to light theme");
  });
});
