/**
 * Shared cache for GE snapshot/trends across serverless invocations.
 * 1. In-memory (same isolate)
 * 2. /tmp (same instance after warm)
 * 3. Optional Upstash/Vercel KV REST if KV_REST_API_URL + KV_REST_API_TOKEN are set
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type CacheEnvelope<T> = { at: number; value: T };

const mem = new Map<string, CacheEnvelope<unknown>>();
const DIR = "/tmp/ge-watch-cache";

function kvUrl() {
  return process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
}
function kvToken() {
  return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
}

function filePath(key: string) {
  return join(DIR, `${key.replace(/[^a-zA-Z0-9._-]+/g, "_")}.json`);
}

export async function cacheGetEntry<T>(key: string, ttlMs: number): Promise<CacheEnvelope<T> | null> {
  const now = Date.now();
  const hit = mem.get(key) as CacheEnvelope<T> | undefined;
  if (hit && now - hit.at < ttlMs) return hit;

  try {
    const raw = readFileSync(filePath(key), "utf8");
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (parsed?.at && now - parsed.at < ttlMs) {
      mem.set(key, parsed);
      return parsed;
    }
  } catch {
    /* miss */
  }

  const url = kvUrl();
  const token = kvToken();
  if (url && token) {
    try {
      const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const body = (await res.json()) as { result?: string | null };
        if (body.result) {
          const parsed = JSON.parse(body.result) as CacheEnvelope<T>;
          if (parsed?.at && now - parsed.at < ttlMs) {
            mem.set(key, parsed);
            try {
              mkdirSync(DIR, { recursive: true });
              writeFileSync(filePath(key), JSON.stringify(parsed));
            } catch {
              /* ignore */
            }
            return parsed;
          }
        }
      }
    } catch {
      /* miss */
    }
  }

  return null;
}

export async function cacheGet<T>(key: string, ttlMs: number): Promise<T | null> {
  const entry = await cacheGetEntry<T>(key, ttlMs);
  return entry ? entry.value : null;
}

export async function cacheSet<T>(key: string, value: T, ttlMs: number): Promise<void> {
  const env: CacheEnvelope<T> = { at: Date.now(), value };
  mem.set(key, env);
  try {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(filePath(key), JSON.stringify(env));
  } catch {
    /* ignore */
  }

  const url = kvUrl();
  const token = kvToken();
  if (!url || !token) return;
  try {
    const ttlSec = Math.max(60, Math.ceil(ttlMs / 1000));
    await fetch(`${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(env))}?EX=${ttlSec}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    /* optional */
  }
}
