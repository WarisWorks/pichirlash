import { colors, isRecord } from "./model.ts";

export type Recipe = {
  id: string;
  title: string;
  from: string;
  ingredients: string;
  steps: string;
  memory: string;
  color: string;
  art: string;
  updated: number;
};
export type RecipeText = Pick<
  Recipe,
  "title" | "from" | "ingredients" | "steps" | "memory"
>;

export const recipeLimits = {
  title: 60,
  from: 40,
  ingredients: 600,
  steps: 1200,
  memory: 300,
} as const;
export const MAX_RECIPES = 30;
export const recipeArt = [
  "teacup",
  "cupcake",
  "cherries",
  "sunflower",
  "bee",
  "bunny",
  "owl",
] as const;

const textKeys = ["title", "from", "ingredients", "steps", "memory"] as const;

/** Lines the person typed, trimmed, without empty lines or typed bullets/numbers. */
export function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) =>
      line
        .trim()
        .replace(/^(?:[-–—•*·]+|[0-9٠-٩۰-۹]+\s*[.)،:])\s*/, "")
        .trim(),
    )
    .filter(Boolean);
}

/** Steps numbered with Western digits, as Uyghur writing uses them. */
export function numberSteps(text: string): { n: string; text: string }[] {
  return splitLines(text).map((line, i) => ({ n: `${i + 1}.`, text: line }));
}

/** The plain-text version of a recipe, e.g. for copying. */
export function recipeAsText(recipe: RecipeText): string {
  const parts = [recipe.title.trim()];
  if (recipe.from.trim()) parts.push(recipe.from.trim());
  const ingredients = splitLines(recipe.ingredients);
  if (ingredients.length)
    parts.push(["كېرەكلىك ماتېرىياللار:", ...ingredients.map((x) => `• ${x}`)].join("\n"));
  const steps = numberSteps(recipe.steps);
  if (steps.length)
    parts.push(["تەييارلاش تەرتىپى:", ...steps.map((x) => `${x.n} ${x.text}`)].join("\n"));
  if (recipe.memory.trim()) parts.push(recipe.memory.trim());
  return parts.filter(Boolean).join("\n\n");
}

export function hasRecipeText(recipe: RecipeText): boolean {
  return textKeys.some((k) => recipe[k].trim() !== "");
}

export function sameRecipeText(a: Recipe, b: Recipe): boolean {
  return (
    textKeys.every((k) => a[k] === b[k]) && a.color === b.color && a.art === b.art
  );
}

export function validRecipe(value: unknown): value is Recipe {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    value.id.length <= 80 &&
    textKeys.every(
      (k) =>
        typeof value[k] === "string" &&
        (value[k] as string).length <= recipeLimits[k],
    ) &&
    (colors as readonly string[]).includes(String(value.color)) &&
    (recipeArt as readonly string[]).includes(String(value.art)) &&
    typeof value.updated === "number" &&
    Number.isFinite(value.updated) &&
    value.updated >= 0
  );
}

export function validRecipes(value: unknown): value is Recipe[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_RECIPES &&
    value.every(validRecipe) &&
    new Set(value.map((r) => r.id)).size === value.length
  );
}

/** Saves or replaces a recipe (newest first). Returns null when the box is full. */
export function upsertRecipe(list: Recipe[], recipe: Recipe): Recipe[] | null {
  const rest = list.filter((r) => r.id !== recipe.id);
  if (rest.length === list.length && list.length >= MAX_RECIPES) return null;
  return [recipe, ...rest];
}

export function removeRecipe(list: Recipe[], id: string): Recipe[] {
  return list.filter((r) => r.id !== id);
}

export function blankRecipe(id: string, updated = 0): Recipe {
  return {
    id,
    title: "",
    from: "",
    ingredients: "",
    steps: "",
    memory: "",
    color: "yellow",
    art: "teacup",
    updated,
  };
}

export type RecipePreset = {
  key: "lagman" | "polo" | "samsa";
  label: string;
  art: (typeof recipeArt)[number];
  color: (typeof colors)[number];
  title: string;
  ingredients: string;
  steps: string;
};

/** Home-style starting points: every family makes these a little differently. */
export const recipePresets: RecipePreset[] = [
  {
    key: "lagman",
    label: "لەغمەن",
    art: "teacup",
    color: "yellow",
    title: "لەغمەن",
    ingredients: [
      "ئۇن — 500 گرام",
      "سۇ ۋە بىر چىمدىم تۇز",
      "كالا ياكى قوي گۆشى — 300 گرام",
      "پىياز — 1 دانە",
      "پەمىدۇر — 2 دانە",
      "يېشىل لازا — 2 دانە",
      "سامساق — بىر قانچە تال",
      "ياغ، تۇز، زىرە",
    ].join("\n"),
    steps: [
      "ئۇنغا تۇزلۇق سۇ قوشۇپ يۇمشاق خېمىر يۇغۇرۇڭ، يېپىپ 30 مىنۇت ئارام بېرىڭ.",
      "خېمىرنى بارماقتەك ئۇزۇن قىلىپ ئېشىپ، ياغلاپ، يەنە بىر دەم قويۇڭ.",
      "گۆشنى ئۇششاق توغراپ، قىزىق ياغدا قورۇڭ.",
      "پىياز، لازا، پەمىدۇر ۋە سامساقنى قوشۇپ، سەينى پىشۇرۇڭ.",
      "خېمىرنى ئىنچىكە قىلىپ سوزۇپ، قايناق سۇدا پىشۇرۇڭ ۋە سوغۇق سۇدا چايقاڭ.",
      "لەغمەننى تەخسىگە ئېلىپ، ئۈستىگە سەي قۇيۇڭ.",
    ].join("\n"),
  },
  {
    key: "polo",
    label: "پولۇ",
    art: "sunflower",
    color: "green",
    title: "پولۇ",
    ingredients: [
      "گۈرۈچ — 500 گرام",
      "قوي گۆشى — 500 گرام",
      "سەۋزە — 3 ياكى 4 دانە",
      "پىياز — 1 دانە",
      "ياغ، تۇز، زىرە",
      "ئىسسىق سۇ",
    ].join("\n"),
    steps: [
      "گۈرۈچنى بىر قانچە قېتىم يۇيۇپ، سۇغا چىلاپ قويۇڭ.",
      "سەۋزىنى ئۇزۇنچاق ئىنچىكە توغراڭ.",
      "قازاندا ياغنى قىزىتىپ، گۆشنى قىزارغۇچە قورۇڭ.",
      "پىياز بىلەن سەۋزىنى قوشۇپ يۇمشىغۇچە قورۇڭ، تۇز ۋە زىرە سېلىڭ.",
      "سۇ قۇيۇپ قاينىتىڭ، ئاندىن گۈرۈچنى تەكشى يېيىپ سېلىڭ.",
      "سۇ سىڭگەندە قازاننىڭ ئاغزىنى يېپىپ، ئاستا ئوتتا 30–40 مىنۇت دەملەڭ.",
    ].join("\n"),
  },
  {
    key: "samsa",
    label: "سامسا",
    art: "cupcake",
    color: "pink",
    title: "سامسا",
    ingredients: [
      "ئۇن — 500 گرام",
      "سۇ ۋە بىر چىمدىم تۇز",
      "قوي گۆشى — 400 گرام",
      "پىياز — 3 دانە",
      "قوي يېغى — ئازراق",
      "تۇز، مۇچ، زىرە",
    ].join("\n"),
    steps: [
      "ئۇنغا سۇ ۋە تۇز قوشۇپ قاتتىقراق خېمىر يۇغۇرۇڭ، ئارام بېرىڭ.",
      "گۆش، پىياز ۋە ياغنى ئۇششاق توغراپ، تۇز، مۇچ، زىرە سېلىپ ئارىلاشتۇرۇڭ.",
      "خېمىرنى كىچىك پارچىلارغا بۆلۈپ، نېپىز قىلىپ يېيىڭ.",
      "ھەر بىرىگە قىيما سېلىپ، تۆت چاسا قىلىپ قاتلاڭ.",
      "تونۇردا ياكى قىزىتىلغان ئوچاقتا (200°C) 25–30 مىنۇت پىشۇرۇڭ.",
    ].join("\n"),
  },
];

/** Applies a preset's text but keeps the person's own name, memory and id. */
export function applyPreset(recipe: Recipe, preset: RecipePreset): Recipe {
  return {
    ...recipe,
    title: preset.title,
    ingredients: preset.ingredients,
    steps: preset.steps,
    color: preset.color,
    art: preset.art,
  };
}

/** Whether applying a preset would overwrite something the person wrote. */
export function presetWouldReplace(recipe: RecipeText): boolean {
  return [recipe.title, recipe.ingredients, recipe.steps].some(
    (x) => x.trim() !== "",
  );
}
