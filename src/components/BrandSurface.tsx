import { useEffect, useState } from "react";

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

function knockoutBlack(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(src);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = frame.data;
      for (let i = 0; i < px.length; i += 4) {
        const r = px[i];
        const g = px[i + 1];
        const b = px[i + 2];
        if (r < 18 && g < 18 && b < 18) {
          px[i + 3] = 0;
        }
      }
      ctx.putImageData(frame, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("logo failed"));
    img.src = src;
  });
}

export function CheapscapeWordmark({
  className = "w-[min(94vw,30rem)]",
}: {
  className?: string;
}) {
  const [src, setSrc] = useState(CHEAPSCAPE_LOGO_URL);

  useEffect(() => {
    let live = true;
    void knockoutBlack(CHEAPSCAPE_LOGO_URL)
      .then((url) => {
        if (live) setSrc(url);
      })
      .catch(() => {
        if (live) setSrc(CHEAPSCAPE_LOGO_URL);
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <img
      src={src}
      alt="Cheapscape"
      width={520}
      height={175}
      className={`h-auto max-h-32 border-0 bg-transparent object-contain sm:max-h-36 ${className}`}
    />
  );
}
