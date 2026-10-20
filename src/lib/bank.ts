const BANK_KEY = "cheapscape-bank";

export type BankEntry = {
  name: string;
  quantity: number;
};

export function readBank(): BankEntry[] {
  try {
    const raw = localStorage.getItem(BANK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const name = String((row as { name?: unknown }).name ?? "").trim();
        const quantity = Number((row as { quantity?: unknown }).quantity);
        if (!name || !Number.isFinite(quantity) || quantity <= 0) return null;
        return { name, quantity: Math.floor(quantity) };
      })
      .filter((row): row is BankEntry => row != null);
  } catch {
    return [];
  }
}

export function writeBank(entries: BankEntry[]) {
  try {
    localStorage.setItem(BANK_KEY, JSON.stringify(entries));
  } catch {
    /* private mode / quota */
  }
}

/**
 * Parse a bank dump. Supports:
 * - "Item name\t123"
 * - "Item name x 123"
 * - "Item name 123"
 * - "123 Item name" (quantity first)
 * Skips empty lines and obvious headers.
 */
export function parseBankDump(text: string): BankEntry[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const out: BankEntry[] = [];
  const seen = new Map<string, number>();

  for (const line of lines) {
    if (/^(name|item|quantity|qty|count|bank)\b/i.test(line) && line.length < 40) continue;

    // quantity last: name [x] 123 or name\t123
    let match = line.match(/^(.*?)\s*(?:x\s*)?(\d[\d,]*)\s*$/i);
    let name = "";
    let qty = 0;

    if (match) {
      name = match[1].replace(/\t/g, " ").trim();
      qty = Number(match[2].replace(/,/g, ""));
    } else {
      // quantity first
      match = line.match(/^(\d[\d,]*)\s+(.+)$/);
      if (match) {
        qty = Number(match[1].replace(/,/g, ""));
        name = match[2].trim();
      }
    }

    if (!name || !Number.isFinite(qty) || qty <= 0) continue;
    name = name.replace(/\s+/g, " ").trim();
    if (name.length < 2) continue;

    const key = name.toLowerCase();
    seen.set(key, (seen.get(key) ?? 0) + Math.floor(qty));
    // keep original casing from first occurrence
    if (!out.some((e) => e.name.toLowerCase() === key)) {
      out.push({ name, quantity: 0 });
    }
  }

  return out.map((entry) => ({
    name: entry.name,
    quantity: seen.get(entry.name.toLowerCase()) ?? entry.quantity,
  }));
}
