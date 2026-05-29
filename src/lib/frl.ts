// Fork Recipe Language (FRL) parser
// @-directive syntax for structured recipes. Falls back to freetext when no directives present.

export interface ParsedRecipe {
  mode: "frl" | "freetext";
  title?: string;
  description?: string;
  yield?: string;
  prepTime?: string;
  cookTime?: string;
  tags?: string[];
  ingredients?: string[];
  materials?: string[];
  procedure?: string;
  notes?: string;
  raw: string;
}

const DIRECTIVES = ["title", "description", "yield", "prep", "cook", "tags", "ingredients", "materials", "procedure", "notes"] as const;

export function parseFRL(raw: string): ParsedRecipe {
  const trimmed = raw.trim();

  // Detect if this is FRL (has @directive lines)
  const hasFRL = DIRECTIVES.some((d) => new RegExp(`^@${d}\\b`, "m").test(trimmed));

  if (!hasFRL) {
    return { mode: "freetext", raw };
  }

  const result: ParsedRecipe = { mode: "frl", raw };

  // Split into blocks by @directive
  const blockRegex = /^@(\w+)\s*\n?([\s\S]*?)(?=^@\w|\Z)/gm;
  // Use line-by-line approach for reliability
  const lines = trimmed.split("\n");
  let currentDirective: string | null = null;
  const blocks: Record<string, string[]> = {};

  for (const line of lines) {
    const directiveMatch = line.match(/^@(\w+)\s*(.*)$/);
    if (directiveMatch) {
      currentDirective = directiveMatch[1].toLowerCase();
      blocks[currentDirective] = [];
      const rest = directiveMatch[2].trim();
      if (rest) blocks[currentDirective].push(rest);
    } else if (currentDirective) {
      blocks[currentDirective].push(line);
    }
  }

  void blockRegex;

  const getText = (key: string) =>
    blocks[key]?.join("\n").trim() || undefined;

  const getLines = (key: string) =>
    blocks[key]
      ?.map((l) => l.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean) || undefined;

  result.title = getText("title");
  result.description = getText("description");
  result.yield = getText("yield");
  result.prepTime = getText("prep");
  result.cookTime = getText("cook");
  result.procedure = getText("procedure");
  result.notes = getText("notes");
  result.ingredients = getLines("ingredients");
  result.materials = getLines("materials");

  const tagsRaw = getText("tags");
  if (tagsRaw) {
    result.tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
  }

  return result;
}

export function serializeParsed(parsed: ParsedRecipe): string {
  if (parsed.mode === "freetext") return parsed.raw;

  const lines: string[] = [];

  if (parsed.title) lines.push(`@title ${parsed.title}`);
  if (parsed.description) lines.push(`@description ${parsed.description}`);
  if (parsed.yield) lines.push(`@yield ${parsed.yield}`);
  if (parsed.prepTime) lines.push(`@prep ${parsed.prepTime}`);
  if (parsed.cookTime) lines.push(`@cook ${parsed.cookTime}`);
  if (parsed.tags?.length) lines.push(`@tags ${parsed.tags.join(", ")}`);

  if (parsed.ingredients?.length) {
    lines.push("@ingredients");
    parsed.ingredients.forEach((i) => lines.push(`- ${i}`));
  }

  if (parsed.materials?.length) {
    lines.push("@materials");
    parsed.materials.forEach((m) => lines.push(`- ${m}`));
  }

  if (parsed.procedure) {
    lines.push("@procedure");
    lines.push(parsed.procedure);
  }

  if (parsed.notes) {
    lines.push("@notes");
    lines.push(parsed.notes);
  }

  return lines.join("\n");
}
