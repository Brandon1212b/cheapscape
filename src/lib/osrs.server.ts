import { COMPOSITE_BY_ID, COMPOSITE_ITEMS, type CompositeItem } from "./composite-items";
import { geLookupName } from "./ge-name-aliases";
import { cacheGetEntry, cacheSet } from "./durable-cache";
import { namesScope } from "./tracked-item-names";

const BASE = "https://prices.runescape.wiki/api/v1/osrs";
const UA = "OSRS Gear & Skilling Price Tracker - lovable.app";
const ITEM_META_URL = (id: number) =>
  `https://raw.githubusercontent.com/0xNeffarion/osrsreboxed-db/master/docs/items-json/${id}.json`;

const HISCORES_URL = "https://secure.runescape.com/m=hiscore_oldschool/index_lite.json";
