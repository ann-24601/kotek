"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";

/**
 * Globalny floating „+ Dodaj wpis". Przechodzi na pełnoekranowy formularz /dodaj-wpis.
 */
export function AddEntryButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/dodaj-wpis")}
      aria-label="Dodaj wpis"
      className="fixed bottom-[calc(96px+env(safe-area-inset-bottom,0px))] right-4 z-40 inline-flex items-center gap-2 rounded-[12px] bg-ink px-5 py-3.5 font-hand text-base font-semibold text-paper shadow-[0_4px_16px_rgba(27,26,26,0.22)] active:translate-y-[1px] active:shadow-[0_2px_8px_rgba(27,26,26,0.22)] lg:bottom-8 lg:right-8"
    >
      <Icon name="plus" size={22} />
      <span>Dodaj wpis</span>
    </button>
  );
}
