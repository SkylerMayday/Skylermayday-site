"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Badge from "@/components/ui/Badge";

interface CardZoomModalProps {
  imageUrl: string; // non-null; CardSlot only mounts this when the slot is filled
  slotName: string; // used for the accessible label + image alt + error fallback text
  language: string; // slot.language; badge shown only when !== "EN"
  remarks: string | null; // slot.remarks; block shown only when non-empty after trim
  onClose: () => void; // called by ALL three close paths; CardSlot's handler restores focus
}

/**
 * Full-screen lightbox for a filled binder card slot. Mounted only while its
 * parent CardSlot's `isZoomOpen` is true (mounting IS "open"), so at most one
 * instance exists at a time and its effects (Esc/focus-trap listener) run
 * only while actually shown.
 */
export default function CardZoomModal({
  imageUrl,
  slotName,
  language,
  remarks,
  onClose,
}: CardZoomModalProps) {
  const [imageError, setImageError] = useState(false); // mirrors CardSlot's onError pattern
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null); // the backdrop element; focus-trap scope

  // Esc to close, Tab focus-trap, and arrow-key swallow — one listener,
  // capture phase (see comment below for why capture is load-bearing).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        // Focus trap — keep Tab / Shift+Tab within the modal.
        const focusable = rootRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        // Prevent BinderPageViewer's window-level page-flip listener from
        // flipping the grid page BEHIND the open modal. Capture phase +
        // stopPropagation preempts that bubble-phase window listener, so the
        // page underneath cannot change while zoomed (PRD Req 2: closing must
        // not change the page position underneath).
        e.stopPropagation();
      }
    }
    document.addEventListener("keydown", onKeyDown, true); // capture = true (required)
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  // Scroll inertness: while this modal is mounted, the page behind it must
  // be fully inert. Three parts, one lifecycle (mount → unmount):
  //   1. Lock BOTH <html> and <body> overflow (overflow:hidden). Standards-mode
  //      documents scroll via `document.documentElement` (<html>), not <body> —
  //      locking body alone leaves <html> scrollable, so a real scroll gesture,
  //      keyboard Page Down/Space, or a focus-triggered scrollIntoView still
  //      moves the page behind the modal (confirmed live: window.scrollTo still
  //      moved documentElement.scrollTop with only body locked). The permanent
  //      `scrollbar-gutter: stable` on <html> (app/globals.css) keeps the
  //      scrollbar gutter reserved at all times, so toggling overflow here
  //      never shifts layout width. Capture and restore both elements' PREVIOUS
  //      overflow value on cleanup (restores "" if it was unset — correct).
  //   2. Block touch scroll-chaining that can leak through a fixed overlay on
  //      iOS Safari even with overflow:hidden — preventDefault touchmove that
  //      originates on the backdrop itself (mirrors handleBackdropClick's
  //      `e.target === e.currentTarget` check, so touches on the image/dialog
  //      descendants are unaffected). The listener MUST be registered with
  //      `{ passive: false }` — a passive touchmove listener silently ignores
  //      preventDefault(), which would look like the fix "didn't work".
  useEffect(() => {
    const backdrop = rootRef.current;
    const htmlEl = document.documentElement;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = htmlEl.style.overflow;
    document.body.style.overflow = "hidden";
    htmlEl.style.overflow = "hidden";

    function onTouchMove(e: TouchEvent) {
      if (e.target === e.currentTarget) e.preventDefault();
    }
    backdrop?.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      htmlEl.style.overflow = prevHtmlOverflow;
      backdrop?.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  // Initial focus on mount.
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    // True only when the click landed on the backdrop itself, not on the
    // image, the dialog div, or the close button (those are descendants ->
    // target is the descendant). This is what makes "click the image ->
    // stays open, click outside -> closes" work without stopPropagation on
    // the image.
    if (e.target === e.currentTarget) onClose();
  }

  // The modal only ever mounts as the result of a user click in the
  // browser, so `document` exists; this guard is defensive only.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={rootRef}
      className="card-zoom-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={handleBackdropClick}
    >
      <button
        ref={closeButtonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close enlarged card"
        className="fixed right-4 top-4 z-[60] flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded border border-white/40 bg-black/60 text-2xl leading-none text-white"
      >
        &times;
      </button>

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${slotName} — enlarged card image`}
        className="card-zoom-figure relative flex max-h-[92vh] flex-col items-center justify-center gap-3 overflow-y-auto"
      >
        {language !== "EN" && (
          <span className="pointer-events-none absolute left-2 top-2 z-[55]">
            <Badge variant="info">{language}</Badge>
          </span>
        )}

        {imageError ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded bg-neutral-900 p-8 text-center text-neutral-300">
            <span className="text-sm font-semibold">{slotName}</span>
            <span className="text-xs">Image unavailable</span>
          </div>
        ) : (
          <Image
            src={imageUrl}
            alt={slotName}
            width={500}
            height={700}
            sizes="(max-width: 768px) 92vw, 500px"
            className="h-auto max-h-[90vh] w-auto max-w-[92vw] object-contain"
            onError={() => setImageError(true)}
            priority
          />
        )}

        {remarks !== null && remarks.trim().length > 0 && (
          <p className="max-w-[92vw] whitespace-pre-line rounded bg-neutral-900/90 px-4 py-3 text-left text-sm text-neutral-200">
            {remarks.trim()}
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}
