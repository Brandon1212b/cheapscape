import { useEffect } from "react";

import { CHEAPSCAPE_LOGO_URL } from "@/lib/cheapscape-logo";
import { STONE_BG_URL } from "@/lib/stone-bg";

export function BrandSurface() {
  useEffect(() => {
    const body = document.body;
    const previous = body.style.backgroundImage;
    body.style.backgroundImage = `linear-gradient(rgba(16,13,8,0.42), rgba(12,10,6,0.55)), url(${STONE_BG_URL})`;
    body.style.backgroundSize = "cover";
    body.style.backgroundPosition = "center";
    body.style.backgroundRepeat = "no-repeat";
    return () => {
      body.style.backgroundImage = previous;
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
      width={520}
      height={177}
      className={`h-auto max-h-32 border-0 bg-transparent object-contain sm:max-h-36 ${className}`}
    />
  );
}
