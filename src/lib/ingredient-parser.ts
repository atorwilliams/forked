import { lookupUnit, type UnitDef } from "./units";

export type ParseStatus = "ok" | "unknown_ingredient" | "ambiguous" | "invalid";

export interface PackageInfo {
  count: number;
  size: number;
  sizeUnit: string;
  containerType: string;
}

export interface ParsedIngredientLine {
  status: ParseStatus;
  rawText: string;
  quantity: number | null;
  unit: string | null;       // canonical unit string
  unitDef: UnitDef | null;
  ingredientName: string;    // normalized (lowercase, singular best-guess)
  isToTaste: boolean;
  note?: string;             // content of parentheses, e.g. "batons" from "150 g carrots (batons)"
  packageInfo?: PackageInfo;
  errorHint?: string;
}

// Normalize ingredient name: lowercase, strip trailing punctuation
function normalizeIngredientName(raw: string): string {
  return raw.toLowerCase().trim().replace(/[.,;]+$/, "");
}

// Parse a numeric string that may be a fraction (e.g. "1/2", "1 1/2")
function parseNumber(raw: string): number | null {
  const trimmed = raw.trim();

  // Mixed number: "1 1/2"
  const mixed = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);

  // Fraction: "1/2"
  const frac = trimmed.match(/^(\d+)\/(\d+)$/);
  if (frac) return parseInt(frac[1]) / parseInt(frac[2]);

  // Decimal or integer
  const num = parseFloat(trimmed);
  return isNaN(num) ? null : num;
}

// Try to strip common English plurals to get a singular form for DB lookup
// We don't try to solve English morphology — just the most common patterns
export function singularize(word: string): string {
  const w = word.toLowerCase().trim();

  // Irregular
  const irregulars: Record<string, string> = {
    leaves: "leaf",
    knives: "knife",
    halves: "half",
    loaves: "loaf",
    shelves: "shelf",
    geese: "goose",
    teeth: "tooth",
    feet: "foot",
    mice: "mouse",
    children: "child",
  };
  if (irregulars[w]) return irregulars[w];

  if (w.endsWith("ies") && w.length > 4) return w.slice(0, -3) + "y";  // cherries → cherry
  if (w.endsWith("ves") && w.length > 4) return w.slice(0, -3) + "f";  // loaves → loaf (fallback)
  if (w.endsWith("ses") || w.endsWith("xes") || w.endsWith("zes") || w.endsWith("ches") || w.endsWith("shes"))
    return w.slice(0, -2); // buses → bus, boxes → box
  if (w.endsWith("s") && !w.endsWith("ss") && w.length > 2) return w.slice(0, -1); // eggs → egg

  return w;
}

// Attempt to parse a compound like "450g" into { value: 450, unitStr: "g" }
function parseInlineSize(s: string): { value: number; unitStr: string } | null {
  const m = s.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
  if (!m) return null;
  const value = parseFloat(m[1]);
  if (isNaN(value)) return null;
  return { value, unitStr: m[2] };
}

export function parseIngredientLine(rawInput: string): ParsedIngredientLine {
  // Extract parenthetical note before any other parsing
  let note: string | undefined;
  const withoutNote = rawInput.replace(/\(([^)]*)\)/, (_, inner) => {
    note = inner.trim() || undefined;
    return "";
  }).trim();

  const raw = withoutNote.replace(/[.]+$/, "").trim();

  if (!raw) {
    return { status: "invalid", rawText: rawInput, quantity: null, unit: null, unitDef: null, ingredientName: "", isToTaste: false, errorHint: "Empty line" };
  }

  // ── 1. "to taste" prefix ──────────────────────────────────────────────────
  const toTasteMatch = raw.match(/^to\s+taste\s+(.+)$/i);
  if (toTasteMatch) {
    return { status: "ok", rawText: rawInput, quantity: null, unit: null, unitDef: null, ingredientName: normalizeIngredientName(toTasteMatch[1]), isToTaste: true, note };
  }

  // ── 2. "pinch/dash/splash/handful" prefix (special units without number) ─
  const specialNoNum = raw.match(/^(pinch|dash|splash|handful)\s+(?:of\s+)?(.+)$/i);
  if (specialNoNum) {
    const unitDef = lookupUnit(specialNoNum[1]);
    return { status: "ok", rawText: rawInput, quantity: 1, unit: unitDef?.canonical ?? specialNoNum[1].toLowerCase(), unitDef, ingredientName: normalizeIngredientName(specialNoNum[2]), isToTaste: false, note };
  }

  // Tokenize: split on whitespace, keeping track of positions
  const tokens = raw.split(/\s+/);

  // ── 3. Package format: "{number} {inlineSize} {containerWord} {ingredient}" ─
  // e.g. "1 450g package ground beef"
  if (tokens.length >= 4) {
    const count = parseNumber(tokens[0]);
    const inlineSize = tokens[1] ? parseInlineSize(tokens[1]) : null;
    if (count !== null && inlineSize !== null) {
      const sizeUnitDef = lookupUnit(inlineSize.unitStr);
      const containerWord = tokens[2];
      const containerDef = lookupUnit(containerWord);
      if (containerDef && containerDef.tier === "container") {
        const ingredientName = normalizeIngredientName(tokens.slice(3).join(" "));
        if (ingredientName) {
          return { status: "ok", rawText: rawInput, quantity: inlineSize.value, unit: sizeUnitDef?.canonical ?? inlineSize.unitStr.toLowerCase(), unitDef: sizeUnitDef, ingredientName, isToTaste: false, note, packageInfo: { count, size: inlineSize.value, sizeUnit: sizeUnitDef?.canonical ?? inlineSize.unitStr.toLowerCase(), containerType: containerDef.canonical } };
        }
      }
    }
  }

  // ── 4. Standard: "{number} {unit} {ingredient}" ────────────────────────────
  if (tokens.length >= 3) {
    const qty = parseNumber(tokens[0]);
    if (qty !== null) {
      const unitDef = lookupUnit(tokens[1]);
      if (unitDef) {
        const ingredientName = normalizeIngredientName(tokens.slice(2).join(" "));
        if (ingredientName) {
          return { status: "ok", rawText: rawInput, quantity: qty, unit: unitDef.canonical, unitDef, ingredientName, isToTaste: false, note };
        }
      }
    }
  }

  // ── 5. Mixed number + unit: "1 1/2 kg butter" ────────────────────────────
  if (tokens.length >= 4) {
    const mixedQty = parseNumber(`${tokens[0]} ${tokens[1]}`);
    if (mixedQty !== null) {
      const unitDef = lookupUnit(tokens[2]);
      if (unitDef) {
        const ingredientName = normalizeIngredientName(tokens.slice(3).join(" "));
        if (ingredientName) {
          return { status: "ok", rawText: rawInput, quantity: mixedQty, unit: unitDef.canonical, unitDef, ingredientName, isToTaste: false, note };
        }
      }
    }
  }

  // ── 6. Implicit count: "{number} {ingredient}" — e.g. "3 eggs", "2 bay leaves" ─
  if (tokens.length >= 2) {
    const qty = parseNumber(tokens[0]);
    if (qty !== null) {
      const ingredientName = normalizeIngredientName(tokens.slice(1).join(" "));
      if (ingredientName) {
        return { status: "ok", rawText: rawInput, quantity: qty, unit: "whole", unitDef: null, ingredientName, isToTaste: false, note };
      }
    }
  }

  // ── 7. No digits — bare ingredient name, treat as implicit "to taste" ─────
  if (!/\d/.test(raw)) {
    return { status: "ok", rawText: rawInput, quantity: null, unit: null, unitDef: null, ingredientName: normalizeIngredientName(raw), isToTaste: true, note };
  }

  // ── 8. Ambiguous / unrecognized ────────────────────────────────────────────
  return { status: "ambiguous", rawText: rawInput, quantity: null, unit: null, unitDef: null, ingredientName: normalizeIngredientName(raw), isToTaste: false, errorHint: "Could not determine quantity or unit. Expected format: 450 g Pork Belly" };
}

// Fuzzy match candidate ingredient name against a list of known names+aliases
// Returns sorted matches by score (lower = better)
export interface FuzzyMatch {
  id: string;
  name: string;
  displayName: string;
  score: number;
}

export function fuzzyMatch(
  input: string,
  candidates: Array<{ id: string; nameNormalized: string; displayName: string; aliases: string }>,
): FuzzyMatch[] {
  const norm = input.toLowerCase().trim();
  const singular = singularize(norm);

  const scored = candidates.map((c) => {
    const aliases: string[] = JSON.parse(c.aliases || "[]");
    const allNames = [c.nameNormalized, ...aliases.map((a) => a.toLowerCase())];

    // Exact match
    if (allNames.includes(norm) || allNames.includes(singular)) return { ...c, score: 0 };

    // Starts-with match
    if (allNames.some((n) => n.startsWith(norm) || n.startsWith(singular))) return { ...c, score: 1 };

    // Contains match
    if (allNames.some((n) => n.includes(norm) || n.includes(singular))) return { ...c, score: 2 };

    // Levenshtein distance (simple edit distance for close misses)
    const minDist = Math.min(...allNames.map((n) => levenshtein(norm, n)));
    if (minDist <= 2) return { ...c, score: 3 + minDist };

    return { ...c, score: 999 };
  });

  return scored
    .filter((m) => m.score < 10)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map(({ id, nameNormalized, displayName, score }) => ({
      id,
      name: nameNormalized,
      displayName,
      score,
    }));
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}
