import { useEffect, useState } from "react";

import { CHEAPSCAPE_LOGO_FALLBACK_URL, CHEAPSCAPE_LOGO_URL } from "@/lib/cheapscape-logo";
import { STONE_BG_FALLBACK_URL, STONE_BG_URL } from "@/lib/stone-bg";

const STONE_WASH =
  "linear-gradient(rgba(16,13,8,0.42), rgba(12,10,6,0.55))";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load ${src}`));
    img.src = src;
  });
}

async function firstAvailable(urls: string[]): Promise<string> {
  for (const url of urls) {
    try {
      await loadImage(url);
      return url;
    } catch {
      // try the next candidate
    }
  }
  return urls[0];
}

function applyStoneBackground(url: string) {
  const body = document.body;
  body.style.setProperty("--stone-bg", `url("${url}")`);
  body.style.backgroundImage = `${STONE_WASH}, url("${url}")`;
  body.style.backgroundSize = "cover";
  body.style.backgroundPosition = "center";
  body.style.backgroundRepeat = "no-repeat";
  body.style.backgroundAttachment = "fixed";
}

export function BrandSurface() {
  useEffect(() => {
    const body = document.body;
    const previousImage = body.style.backgroundImage;
    const previousVar = body.style.getPropertyValue("--stone-bg");

    applyStoneBackground(STONE_BG_URL);
    void firstAvailable([STONE_BG_URL, STONE_BG_FALLBACK_URL]).then((url) => {
      applyStoneBackground(url);
    });

    return () => {
      body.style.backgroundImage = previousImage;
      if (previousVar) body.style.setProperty("--stone-bg", previousVar);
      else body.style.removeProperty("--stone-bg");
    };
  }, []);
  return null;
}

function cutoutWordmark(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
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

      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = 0;
      let maxY = 0;

      for (let i = 0; i < px.length; i += 4) {
        const r = px[i];
        const g = px[i + 1];
        const b = px[i + 2];
        const a = px[i + 3];
        const nearBlack = r < 28 && g < 28 && b < 28;
        const nearWhite = r > 232 && g > 232 && b > 232;
        if (a < 12 || nearBlack || nearWhite) {
          px[i + 3] = 0;
          continue;
        }
        const x = (i / 4) % canvas.width;
        const y = Math.floor(i / 4 / canvas.width);
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }

      ctx.putImageData(frame, 0, 0);

      if (maxX <= minX || maxY <= minY) {
        resolve(canvas.toDataURL("image/png"));
        return;
      }

      const pad = 8;
      const sx = Math.max(0, minX - pad);
      const sy = Math.max(0, minY - pad);
      const sw = Math.min(canvas.width - sx, maxX - minX + 1 + pad * 2);
      const sh = Math.min(canvas.height - sy, maxY - minY + 1 + pad * 2);
      const cropped = document.createElement("canvas");
      cropped.width = sw;
      cropped.height = sh;
      const cut = cropped.getContext("2d");
      if (!cut) {
        resolve(canvas.toDataURL("image/png"));
        return;
      }
      cut.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
      resolve(cropped.toDataURL("image/png"));
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
    void firstAvailable([CHEAPSCAPE_LOGO_URL, CHEAPSCAPE_LOGO_FALLBACK_URL])
      .then((url) => cutoutWordmark(url))
      .then((url) => {
        if (live) setSrc(url);
      })
      .catch(async () => {
        const url = await firstAvailable([CHEAPSCAPE_LOGO_URL, CHEAPSCAPE_LOGO_FALLBACK_URL]);
        if (live) setSrc(url);
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
