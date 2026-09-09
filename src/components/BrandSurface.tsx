import { useEffect } from "react";

import { CHEAPSCAPE_LOGO_URL } from "@/lib/cheapscape-logo";
import { STONE_BG_URL } from "@/lib/stone-bg";

export function BrandSurface() {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--stone-bg", `url("${STONE_BG_URL}")`);
    return () => {
      root.style.removeProperty("--stone-bg");
    };
  }, []);
  return null;
}

export function CheapscapeWordmark({
  className = "w-[min(94vw,30rem)]",
}: {
  className?: string;
}) {
  return (
    <img
      src={CHEAPSCAPE_LOGO_URL}
      alt="Cheapscape"
      width={640}
      height={224}
      className={`h-auto max-h-28 object-contain drop-shadow-[0_10px_24px_oklch(0_0_0/0.55)] sm:max-h-32 ${className}`}
    />
  );
}
