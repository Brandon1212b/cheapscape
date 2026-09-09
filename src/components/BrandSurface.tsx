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
      height={238}
      className={`h-auto max-h-32 border-0 bg-transparent object-contain sm:max-h-36 ${className}`}
    />
  );
}
