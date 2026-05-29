export type UnitTier = "measured" | "container" | "special";

export interface UnitDef {
  canonical: string;   // stored form
  tier: UnitTier;
  aliases: string[];   // all input forms that map to this unit
  toGrams?: number;    // weight conversion (where applicable)
  toMl?: number;       // volume conversion (where applicable)
  display: string;     // display label
}

export const UNITS: UnitDef[] = [
  // ── Weight ───────────────────────────────────────────────────────────────
  { canonical: "g",    tier: "measured", display: "g",    toGrams: 1,        aliases: ["g", "gram", "grams", "gr"] },
  { canonical: "kg",   tier: "measured", display: "kg",   toGrams: 1000,     aliases: ["kg", "kilogram", "kilograms", "kilo", "kilos"] },
  { canonical: "mg",   tier: "measured", display: "mg",   toGrams: 0.001,    aliases: ["mg", "milligram", "milligrams"] },
  { canonical: "oz",   tier: "measured", display: "oz",   toGrams: 28.3495,  aliases: ["oz", "ounce", "ounces"] },
  { canonical: "lb",   tier: "measured", display: "lb",   toGrams: 453.592,  aliases: ["lb", "lbs", "pound", "pounds"] },

  // ── Volume ───────────────────────────────────────────────────────────────
  { canonical: "ml",   tier: "measured", display: "ml",   toMl: 1,           aliases: ["ml", "milliliter", "milliliters", "millilitre", "millilitres"] },
  { canonical: "cl",   tier: "measured", display: "cl",   toMl: 10,          aliases: ["cl", "centiliter", "centiliters", "centilitre", "centilitres"] },
  { canonical: "dl",   tier: "measured", display: "dl",   toMl: 100,         aliases: ["dl", "deciliter", "deciliters", "decilitre", "decilitres"] },
  { canonical: "l",    tier: "measured", display: "L",    toMl: 1000,        aliases: ["l", "L", "liter", "liters", "litre", "litres"] },
  { canonical: "tsp",  tier: "measured", display: "tsp",  toMl: 4.92892,     aliases: ["tsp", "teaspoon", "teaspoons", "t"] },
  { canonical: "tbsp", tier: "measured", display: "tbsp", toMl: 14.7868,     aliases: ["tbsp", "tablespoon", "tablespoons", "tbs", "T"] },
  { canonical: "floz", tier: "measured", display: "fl oz",toMl: 29.5735,     aliases: ["floz", "fl oz", "fluid ounce", "fluid ounces"] },
  { canonical: "cup",  tier: "measured", display: "cup",  toMl: 236.588,     aliases: ["cup", "cups", "c"] },
  { canonical: "pt",   tier: "measured", display: "pt",   toMl: 473.176,     aliases: ["pt", "pint", "pints"] },
  { canonical: "qt",   tier: "measured", display: "qt",   toMl: 946.353,     aliases: ["qt", "quart", "quarts"] },

  // ── Container / count ────────────────────────────────────────────────────
  { canonical: "whole",   tier: "container", display: "whole",   aliases: ["whole", "unit", "piece", "pieces", "item", "items"] },
  { canonical: "bunch",   tier: "container", display: "bunch",   aliases: ["bunch", "bunches"] },
  { canonical: "sprig",   tier: "container", display: "sprig",   aliases: ["sprig", "sprigs"] },
  { canonical: "stalk",   tier: "container", display: "stalk",   aliases: ["stalk", "stalks", "stem", "stems", "stick", "sticks"] },
  { canonical: "head",    tier: "container", display: "head",    aliases: ["head", "heads"] },
  { canonical: "clove",   tier: "container", display: "clove",   aliases: ["clove", "cloves"] },
  { canonical: "leaf",    tier: "container", display: "leaf",    aliases: ["leaf", "leaves"] },
  { canonical: "slice",   tier: "container", display: "slice",   aliases: ["slice", "slices"] },
  { canonical: "fillet",  tier: "container", display: "fillet",  aliases: ["fillet", "fillets"] },
  { canonical: "strip",   tier: "container", display: "strip",   aliases: ["strip", "strips"] },
  { canonical: "can",     tier: "container", display: "can",     aliases: ["can", "cans", "tin", "tins"] },
  { canonical: "jar",     tier: "container", display: "jar",     aliases: ["jar", "jars"] },
  { canonical: "package", tier: "container", display: "package", aliases: ["package", "packages", "pkg", "pack", "packs"] },
  { canonical: "box",     tier: "container", display: "box",     aliases: ["box", "boxes"] },
  { canonical: "bottle",  tier: "container", display: "bottle",  aliases: ["bottle", "bottles"] },
  { canonical: "bag",     tier: "container", display: "bag",     aliases: ["bag", "bags"] },
  { canonical: "sheet",   tier: "container", display: "sheet",   aliases: ["sheet", "sheets"] },
  { canonical: "knob",    tier: "container", display: "knob",    aliases: ["knob", "knobs", "nub"] },

  // ── Special (non-numeric) ─────────────────────────────────────────────────
  { canonical: "pinch",   tier: "special", display: "pinch",   aliases: ["pinch", "pinches"] },
  { canonical: "dash",    tier: "special", display: "dash",    aliases: ["dash", "dashes"] },
  { canonical: "splash",  tier: "special", display: "splash",  aliases: ["splash", "splashes"] },
  { canonical: "handful", tier: "special", display: "handful", aliases: ["handful", "handfuls"] },
];

// Build lookup map: alias → UnitDef
const UNIT_MAP = new Map<string, UnitDef>();
for (const u of UNITS) {
  for (const alias of u.aliases) {
    UNIT_MAP.set(alias.toLowerCase(), u);
  }
}

export function lookupUnit(raw: string): UnitDef | null {
  return UNIT_MAP.get(raw.toLowerCase().trim()) ?? null;
}

// Scale a quantity from one unit to another (same dimension only)
export function scaleToBase(quantity: number, unit: UnitDef): { value: number; base: "g" | "ml" } | null {
  if (unit.toGrams !== undefined) return { value: quantity * unit.toGrams, base: "g" };
  if (unit.toMl !== undefined) return { value: quantity * unit.toMl, base: "ml" };
  return null;
}

export function formatQuantity(n: number): string {
  if (Number.isInteger(n)) return String(n);
  // Round to 3 sig figs max
  return parseFloat(n.toPrecision(3)).toString();
}
