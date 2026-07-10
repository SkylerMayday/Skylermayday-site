"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import type { BinderSlot } from "@/lib/binders";
import CardZoomModal from "./CardZoomModal";

interface CardSlotProps {
  slot: BinderSlot;
}

/** Filled (cardId && imageUrl) -> card image, focusable/clickable to open a zoom lightbox. Empty -> greyed placeholder tile, inert. */
export default function CardSlot({ slot }: CardSlotProps) {
  const [imageError, setImageError] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isFilled = Boolean(slot.cardId && slot.imageUrl);
  const showImage = isFilled && !imageError;

  // Restores focus to the trigger button that opened the modal. Runs
  // synchronously in the same tick as the close event, so focus lands on
  // the button before React unmounts the modal — never lost to <body>. All
  // three close paths inside CardZoomModal call onClose -> this handler.
  function handleZoomClose() {
    setIsZoomOpen(false);
    triggerRef.current?.focus();
  }

  if (!showImage) {
    return (
      <div
        className="group relative flex aspect-[5/7] flex-col items-center justify-center overflow-hidden rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900"
        title={slot.slotName}
      >
        <div className="flex flex-col items-center justify-center gap-1 p-2 text-center text-neutral-400 dark:text-neutral-600">
          <span className="text-xs font-semibold">#{slot.dexNumber}</span>
          <span className="text-[10px] leading-tight">{slot.slotName}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsZoomOpen(true)}
        aria-label={`View ${slot.slotName} enlarged`}
        title={slot.slotName}
        className="group relative flex aspect-[5/7] w-full flex-col items-center justify-center overflow-hidden rounded border border-neutral-200 bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <Image
          src={slot.imageUrl as string}
          alt={slot.slotName}
          fill
          sizes="(max-width: 768px) 20vw, 10vw"
          className="object-contain"
          onError={() => setImageError(true)}
        />
      </button>

      {isZoomOpen && (
        <CardZoomModal
          imageUrl={slot.imageUrl as string}
          slotName={slot.slotName}
          onClose={handleZoomClose}
        />
      )}
    </>
  );
}
