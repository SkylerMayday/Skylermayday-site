"use client";

import { useState } from "react";
import Image from "next/image";
import type { BinderSlot } from "@/lib/binders";

interface CardSlotProps {
  slot: BinderSlot;
}

/** Filled (cardId && imageUrl) -> card image. Empty -> greyed placeholder tile. */
export default function CardSlot({ slot }: CardSlotProps) {
  const [imageError, setImageError] = useState(false);
  const isFilled = Boolean(slot.cardId && slot.imageUrl);
  const showImage = isFilled && !imageError;

  return (
    <div
      className="group relative flex aspect-[5/7] flex-col items-center justify-center overflow-hidden rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900"
      title={slot.slotName}
    >
      {showImage ? (
        <Image
          src={slot.imageUrl as string}
          alt={slot.slotName}
          fill
          sizes="(max-width: 768px) 20vw, 10vw"
          className="object-contain"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-1 p-2 text-center text-neutral-400 dark:text-neutral-600">
          <span className="text-xs font-semibold">#{slot.dexNumber}</span>
          <span className="text-[10px] leading-tight">{slot.slotName}</span>
        </div>
      )}
    </div>
  );
}
