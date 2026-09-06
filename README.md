# Cheapscape

Live site: [osrs-item-tracker.vercel.app](https://osrs-item-tracker.vercel.app)

A mobile-first OSRS tool for regular players — not flippers. It tracks **live Grand Exchange prices** on the gear and supplies you actually buy, and ranks **wiki-style training methods** by XP/hour, GP/hour, and what that training costs *you* given how much GP you make per hour.

If a weapon dumped 50% off its 6-month high, you should see it. If air battlestaves are cheaper XP than cutting rubies at your money-making rate, you should see that too.

Not affiliated with Jagex.

## What it does

### Prices (`/`)

A curated catalog of combat gear, skilling items, and supplies — not the entire GE.

- Live buy-side prices from the [OSRS Wiki real-time GE API](https://oldschool.runescape.wiki/w/RuneScape:Real-time_Prices)
- Sparkline + 6-month high/low on every card
- % change badge so dumps and spikes are obvious
- Search by item name or common alias
- Filters: All / Gear / Skilling items / Supplies
- Gear sub-filters: combat style, equipment slot (paper doll), tier, set
- Sort: losers (default), gainers, expensive, cheap, best value (GP per combat bonus)
- Trend windows: 24h, 1w, 1m, 3m, 6m, 1y
- Untradeable upgrades (crystal armour, scorching bow, blood fury, …) show an **implied GE price** from their materials

### Item page (`/item/$id`)

Tap any card.

- Current price, high alch, buy limit, members flag
- Equipment bonuses and requirements when the item is wearable
- Price chart with high/low dots on the actual extrema
- 180-day percentile (“where is today vs the last half year?”)
- Link through to the OSRS Wiki

### Methods (`/methods`)

Training methods for:

Agility, Construction, Cooking, Crafting, Farming, Firemaking, Fishing, Fletching, Herblore, Hunter, Magic, Mining, Prayer, Runecraft, Sailing, Smithing, Thieving, Woodcutting.

Includes production methods (input → output) and activities / minigames (Wintertodt, Tempoross, GOTR, Giants’ Foundry, Motherlode, Volcanic Mine, Blast Mine, Infernal shale, Sepulchre, Pyramid Plunder, …).

Each row shows:

- Level requirement and intensity (low / medium / high)
- Input → output chips with live GE prices
- XP/h, GP/h, net per action
- **Your cost** in GP/XP, using the money-making rate slider

Load an **RSN** to pull official hiscores. Locked methods (level too low) sink to the bottom. Switch **XP/h** vs **Train to N** to rank by rate or by hours / total GP to a target level.

Activity-type chips narrow a skill (Battlestaves, Blast Furnace, Cannonballs, Herb cleaning, …).

### Watchlist (`/watchlist`)

Star items from the catalog. Set a target GP price or a % drop from the 6-month high. Hits highlight as alerts.

Saved in **this browser only** (`localStorage`). Clearing site data or switching devices resets it. Cloud accounts are off.

## How method cost works

The slider labeled **Your rate** is “GP you’d make if you weren’t training” (default 2m/h).

```
yourCostGpPerXp = (yourRate − methodGpPerHour) / methodXpPerHour
```

A method that loses 1.42m/h and gives 337k XP/h, while you could be making 2m/h, costs about **10 gp/xp**. That is opportunity cost, not just the raw GE loss.

There is also a net-value ranking used when sorting by value:

- If the method pays **at or above** your rate, score is GP from one hour of it, plus leftover time valued at your rate after matching the fastest method’s XP.
- If it pays **below** your rate, score is the gold needed to match the fastest method’s XP in an hour, with leftover time at your rate.

Rates come from wiki-audited method tables in `src/lib/*-methods.ts` and `src/lib/*-activities.ts`, priced against the live snapshot.

## Stack

| Piece | Choice |
| --- | --- |
| UI | React 19, Tailwind 4, Radix / shadcn-style components |
| Routing + SSR | TanStack Start + TanStack Router |
| Data | TanStack Query (snapshot refetch every 2 minutes) |
| Charts | Recharts |
| Build | Vite 8, TypeScript |
| Deploy | Vercel ([osrs-item-tracker.vercel.app](https://osrs-item-tracker.vercel.app)) |
| Accounts | Off — no Supabase required |

### Data sources

- Prices, mapping, volume, timeseries: `https://prices.runescape.wiki/api/v1/osrs`
- Icons: OSRS Wiki image files
- Equipment JSON: [osrsreboxed-db](https://github.com/0xNeffarion/osrsreboxed-db)
- Hiscores: `https://secure.runescape.com/m=hiscore_oldschool/index_lite.json`
- Method XP/h and inputs: curated from [oldschool.runescape.wiki](https://oldschool.runescape.wiki) training guides

Server-side fetch + short TTL caches live in `src/lib/osrs.server.ts` and are exposed to the client as `fetchSnapshot`, `fetchTrends`, `fetchItemDetail`, `fetchPlayerStats`.

## Local development

Need Node.js 22+ and npm.

```sh
git clone https://github.com/Brandon1212b/osrs-item-tracker.git
cd osrs-item-tracker
npm i
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:8080`).

```sh
npm run build     # production build
npm run preview   # serve that build
npm run lint
npm run format
```

No environment variables are required for prices or methods.

## Routes

| Path | Page |
| --- | --- |
| `/` | Price catalog |
| `/item/$id` | Item detail + chart |
| `/methods` | Skilling methods |
| `/watchlist` | Local price alerts |
| `/auth` | Accounts disabled |

Bottom tab bar: **Prices** and **Methods**, plus a global search control. Filter / sort / selected skill persist in the URL (and last skill is remembered).

## Repo map

```
src/
  routes/           pages (home, item, methods, watchlist, auth)
  components/       cards, method rows, filters, nav, charts
  lib/
    osrs.server.ts          Wiki GE + hiscores + caches
    osrs-catalog.ts         Curated item list
    composite-items.ts      Implied prices for untradeables
    *-methods.ts            Production training methods
    *-activities.ts         Minigame / activity methods
    method-rank.ts          Cost and net-value ranking
    watchlist.ts            localStorage watchlist
  hooks/            market data, hiscores, mobile
```

## Product intent

This is not a merchanting dashboard. No margin scanners, no tax calculators, no “buy 8k limit and flip” workflow. The catalog is the items from popular gear upgrades and efficient skilling guides. The methods list is the popular / efficient recipes, priced live, ranked for *your* GP/hour.

## License / affiliation

Personal project. Old School RuneScape is a trademark of Jagex Ltd. Price data is from the community Wiki API. This site is unofficial.
