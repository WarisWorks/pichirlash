import ShareLinkButton from "@/components/features/ShareLinkButton";
import { useEffect, useRef, useState } from "react";
import { toBlob } from "html-to-image";
import {
  BookHeart,
  Download,
  FilePlus2,
  FolderOpen,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/sticker";
import { exportFontCSS, forgetFontCSS } from "./imageExport";
import { colors, localDay, uid } from "./model";
import { useLocal } from "./useLocal";
import { StorageNotice } from "./Experience";
import {
  MAX_RECIPES,
  applyPreset,
  blankRecipe,
  hasRecipeText,
  numberSteps,
  presetWouldReplace,
  recipeArt,
  recipeLimits,
  recipePresets,
  removeRecipe,
  sameRecipeText,
  splitLines,
  upsertRecipe,
  validRecipe,
  validRecipes,
  type Recipe,
} from "./recipeModel";
import "./recipeCards.css";

export type RecipeSharePayload = {
  kind: "recipe";
  title: string;
  from: string;
  ingredients: string;
  steps: string;
  memory: string;
  color: string;
  art: string;
};

const colorNames = ["سېرىق", "ھالرەڭ", "يېشىل", "كۆك", "بىنەپشە"];
const artNames: Record<(typeof recipeArt)[number], string> = {
  teacup: "چاي",
  cupcake: "تورت",
  cherries: "گىلاس",
  sunflower: "گۈل",
  bee: "ھەسەل ھەرىسى",
  bunny: "توشقان",
  owl: "قۇش",
};
const CARD_W = 600,
  CARD_H = 800,
  BASE_SIZE = 21,
  MIN_SIZE = 13;
const dayOf = (time: number) => (time ? localDay(new Date(time)) : "");

export default function RecipeCards({
  onReward,
}: {
  onReward: (id: string, label: string) => void;
}) {
  const draftStore = useLocal<Recipe>(
    "pichirlash-recipe-draft-v1",
    blankRecipe("first-recipe"),
    validRecipe,
  );
  const listStore = useLocal<Recipe[]>(
    "pichirlash-recipes-v1",
    [],
    validRecipes,
  );
  const recipe = draftStore.value,
    setRecipe = draftStore.setValue,
    saved = listStore.value,
    setSaved = listStore.setValue;
  const [scale, setScale] = useState(0.6),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [fitSize, setFitSize] = useState(BASE_SIZE),
    [overflow, setOverflow] = useState(false),
    [exportedURL, setExportedURL] = useState("");
  const viewport = useRef<HTMLDivElement>(null),
    design = useRef<HTMLDivElement>(null),
    body = useRef<HTMLDivElement>(null),
    downloadURL = useRef("");

  const savedVersion = saved.find((r) => r.id === recipe.id);
  const dirty = savedVersion
    ? !sameRecipeText(savedVersion, recipe)
    : hasRecipeText(recipe);
  const ingredients = splitLines(recipe.ingredients),
    steps = numberSteps(recipe.steps),
    empty = !recipe.title.trim() || (!ingredients.length && !steps.length);

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const resize = () => setScale(Math.min(1, el.clientWidth / CARD_W));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(
    () => () => {
      if (downloadURL.current) URL.revokeObjectURL(downloadURL.current);
    },
    [],
  );
  useEffect(() => {
    let cancelled = false;
    void document.fonts.ready.then(() => {
      const el = body.current;
      if (cancelled || !el) return;
      let size = BASE_SIZE;
      el.style.fontSize = `${size}px`;
      while (el.scrollHeight > el.clientHeight + 2 && size > MIN_SIZE) {
        size--;
        el.style.fontSize = `${size}px`;
      }
      setFitSize(size);
      setOverflow(el.scrollHeight > el.clientHeight + 2);
    });
    return () => {
      cancelled = true;
    };
  }, [recipe]);

  const edit = <K extends keyof Recipe>(key: K, value: Recipe[K]) =>
    setRecipe((r) => ({ ...r, [key]: value }));

  const confirmLeave = () =>
    !dirty ||
    window.confirm(
      "بۇ كارتىدىكى ساقلانمىغان ئۆزگەرتىشلەر يوقىلىدۇ. داۋاملاشتۇرامسىز؟",
    );

  const applyStarter = (key: string) => {
    const preset = recipePresets.find((p) => p.key === key);
    if (!preset) return;
    if (
      presetWouldReplace(recipe) &&
      !window.confirm(
        `«${preset.label}» نۇسخىسى ماۋزۇ، ماتېرىيال ۋە تەرتىپ ئورنىغا يېزىلىدۇ. يازغانلىرىڭىزنى ئالماشتۇرامسىز؟`,
      )
    )
      return;
    setRecipe((r) => applyPreset(r, preset));
    setStatus(
      `«${preset.label}» نۇسخىسى قويۇلدى. بۇ پەقەت باشلىنىش؛ ئۆيىڭىزدىكى ئۇسۇلغا ئاساسەن ئۆزگەرتىڭ.`,
    );
  };

  const save = () => {
    if (empty) {
      setStatus("ئالدى بىلەن ماۋزۇ ۋە ماتېرىيال ياكى تەرتىپ يېزىڭ.");
      return;
    }
    const next = upsertRecipe(saved, { ...recipe, updated: Date.now() });
    if (!next) {
      setStatus(
        `ئەڭ كۆپ بولغاندا ${MAX_RECIPES.toLocaleString("en-US")} كارتا ساقلىغىلى بولىدۇ. كونا بىرىنى ئۆچۈرۈپ قايتا سىناڭ.`,
      );
      return;
    }
    setSaved(next);
    setRecipe(next[0]);
    onReward(`recipe:${recipe.id}`, "ئائىلە تائام كارتىسى");
    setStatus("كارتا بۇ ئۈسكۈنىدە ساقلاندى.");
  };

  const startNew = () => {
    if (!confirmLeave()) return;
    setRecipe(blankRecipe(uid()));
    setStatus("يېڭى بوش كارتا ئېچىلدى.");
  };
  const open = (item: Recipe) => {
    if (item.id === recipe.id || !confirmLeave()) return;
    setRecipe(item);
    setStatus(`«${item.title}» ئېچىلدى.`);
  };
  const remove = (item: Recipe) => {
    if (
      !window.confirm(
        `«${item.title}» كارتىسىنى ئۆچۈرەمسىز؟ ئۇنى قايتۇرغىلى بولمايدۇ.`,
      )
    )
      return;
    setSaved(removeRecipe(saved, item.id));
    if (item.id === recipe.id) setRecipe(blankRecipe(uid()));
    setStatus(`«${item.title}» ئۆچۈرۈلدى.`);
  };

  const download = async () => {
    if (!design.current || busy) return;
    if (empty) {
      setStatus("ئالدى بىلەن ماۋزۇ ۋە ماتېرىيال ياكى تەرتىپ يېزىڭ.");
      return;
    }
    if (overflow) {
      setStatus(
        "رېتسېپ كارتىغا سىغمىدى. ماتېرىيال، تەرتىپ ياكى ئەسلىمىنى بىر ئاز قىسقارتىپ قايتا سىناڭ.",
      );
      return;
    }
    setBusy(true);
    setStatus("رەسىم تەييارلىنىۋاتىدۇ…");
    try {
      await Promise.all([
        document.fonts.load(`40px "UKIJ Qolyazma"`),
        document.fonts.load(`${fitSize}px "Noto Naskh Arabic"`),
      ]);
      const css =
        (await exportFontCSS("UKIJ Qolyazma")) +
        (await exportFontCSS("Noto Naskh Arabic"));
      const blob = await toBlob(design.current, {
        width: CARD_W,
        height: CARD_H,
        pixelRatio: 2,
        fontEmbedCSS: css,
        style: {
          transform: "none",
          width: `${CARD_W}px`,
          height: `${CARD_H}px`,
        },
      });
      if (!blob) throw Error("image");
      if (downloadURL.current) URL.revokeObjectURL(downloadURL.current);
      downloadURL.current = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadURL.current;
      link.download = "pichirlash-recipe.png";
      link.click();
      setExportedURL(downloadURL.current);
      onReward(`recipe:${recipe.id}`, "ئائىلە تائام كارتىسى");
      setStatus("رەسىم تەييار بولدى. چۈشۈرۈش باشلاندى.");
    } catch {
      setStatus(
        "رەسىم تەييارلاش مۇۋەپپەقىيەتلىك بولمىدى. قايتا سىناڭ؛ يېزىقلىرىڭىز يوقالمىدى.",
      );
      forgetFontCSS("UKIJ Qolyazma");
      forgetFontCSS("Noto Naskh Arabic");
    } finally {
      setBusy(false);
    }
  };

  const counter = (value: string, max: number) =>
    `${value.length.toLocaleString("en-US")} / ${max.toLocaleString("en-US")}`;

  return (
    <section className="play-panel recipe-maker">
      <div className="play-heading">
        <div>
          <span className="eyebrow">ئۆيدىكى تەملەر، ئائىلىدىكى ئەسلىمىلەر</span>
          <h2>ئائىلە تائام كارتىسى</h2>
          <p>
            مومىڭىز، ئاپىڭىز ياكى دادىڭىزنىڭ تائام ئۇسۇلىنى يېزىپ، چىرايلىق بىر
            كارتا قىلىڭ.
          </p>
        </div>
        <BookHeart size={35} aria-hidden="true" />
      </div>

      <div className="recipe-presets" role="group" aria-labelledby="recipe-presets-title">
        <p id="recipe-presets-title">
          باشلىنىش نۇسخىسى تاللاڭ — ئاندىن ئۆيىڭىزدىكى ئۇسۇلغا ئاساسەن
          ئۆزگەرتىڭ:
        </p>
        <div className="recipe-preset-buttons">
          {recipePresets.map((p) => (
            <Button
              key={p.key}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyStarter(p.key)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="recipe-layout">
        <form
          className="recipe-controls"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <label className="field">
            تائامنىڭ نامى
            <input
              maxLength={recipeLimits.title}
              value={recipe.title}
              placeholder="مەسىلەن: لەغمەن"
              onChange={(e) => edit("title", e.target.value)}
            />
          </label>
          <label className="field">
            كىمنىڭ رېتسېپى
            <input
              maxLength={recipeLimits.from}
              value={recipe.from}
              placeholder="مەسىلەن: مومام"
              onChange={(e) => edit("from", e.target.value)}
            />
          </label>
          <label className="field">
            كېرەكلىك ماتېرىياللار (ھەر قۇرغا بىرى)
            <textarea
              rows={6}
              maxLength={recipeLimits.ingredients}
              value={recipe.ingredients}
              onChange={(e) => edit("ingredients", e.target.value)}
            />
          </label>
          <p className="local-hint recipe-count">
            {counter(recipe.ingredients, recipeLimits.ingredients)}
          </p>
          <label className="field">
            تەييارلاش تەرتىپى (ھەر قۇرغا بىر قەدەم؛ نومۇر ئۆزى قويۇلىدۇ)
            <textarea
              rows={7}
              maxLength={recipeLimits.steps}
              value={recipe.steps}
              onChange={(e) => edit("steps", e.target.value)}
            />
          </label>
          <p className="local-hint recipe-count">
            {counter(recipe.steps, recipeLimits.steps)}
          </p>
          <label className="field">
            ئائىلە ئەسلىمىسى
            <textarea
              rows={3}
              maxLength={recipeLimits.memory}
              value={recipe.memory}
              placeholder="بۇ تائامنى قاچان، كىم بىلەن يېگەنلىكىڭىزنى يېزىڭ…"
              onChange={(e) => edit("memory", e.target.value)}
            />
          </label>
          <p className="local-hint recipe-count">
            {counter(recipe.memory, recipeLimits.memory)}
          </p>
          <div className="recipe-selects">
            <label className="field">
              قەغەز
              <select
                value={recipe.color}
                onChange={(e) => edit("color", e.target.value)}
              >
                {colors.map((c, i) => (
                  <option value={c} key={c}>
                    {colorNames[i]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              چاپلاق
              <select
                value={recipe.art}
                onChange={(e) => edit("art", e.target.value)}
              >
                {recipeArt.map((name) => (
                  <option value={name} key={name}>
                    {artNames[name]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="editor-actions recipe-actions">
            <Button type="submit" disabled={empty}>
              <Save size={17} aria-hidden="true" />
              ساقلاش
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy || empty || overflow}
              onClick={() => void download()}
            >
              <Download size={17} aria-hidden="true" />
              {busy ? "تەييارلىنىۋاتىدۇ…" : "PNG رەسىم چۈشۈرۈش"}
            </Button>
            <Button type="button" variant="ghost" onClick={startNew}>
              <FilePlus2 size={17} aria-hidden="true" />
              يېڭى كارتا
            </Button>
          </div>
          <ShareLinkButton
            disabled={empty}
            item={() => ({
              kind: "recipe",
              title: recipe.title,
              from: recipe.from,
              ingredients: recipe.ingredients,
              steps: recipe.steps,
              memory: recipe.memory,
              color: recipe.color,
              art: recipe.art,
            })}
          />
          <p role="status" className="local-hint">
            {overflow
              ? "رېتسېپ كارتىغا سىغمىدى؛ بىر ئاز قىسقارتىڭ."
              : status}
          </p>
          <p className="local-hint">
            {dirty ? "ساقلانمىغان ئۆزگەرتىش بار. " : ""}
            كارتىلار پەقەت مۇشۇ ئۈسكۈنىدە ساقلىنىدۇ؛ تورغا يوللانمايدۇ.
          </p>
        </form>

        <div
          ref={viewport}
          className="recipe-viewport"
          style={{ height: CARD_H * scale }}
        >
          <div
            ref={design}
            className={`recipe-design ${recipe.color}`}
            style={{ transform: `scale(${scale})` }}
          >
            <header className="recipe-card-head">
              <Sticker name={recipe.art} size={84} />
              <div>
                <span className="recipe-card-kicker">ئائىلە رېتسېپى</span>
                <h3
                  className={
                    recipe.title.length > 28 ? "recipe-card-title long" : "recipe-card-title"
                  }
                >
                  {recipe.title || "تائامنىڭ نامى"}
                </h3>
                {recipe.from.trim() && (
                  <p className="recipe-card-from">
                    كىمنىڭ رېتسېپى: {recipe.from}
                  </p>
                )}
              </div>
            </header>
            <div
              className="recipe-card-body"
              ref={body}
              style={{ fontSize: fitSize }}
            >
              {ingredients.length > 0 && (
                <section>
                  <h4>كېرەكلىك ماتېرىياللار</h4>
                  <ul>
                    {ingredients.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </section>
              )}
              {steps.length > 0 && (
                <section>
                  <h4>تەييارلاش تەرتىپى</h4>
                  <ol>
                    {steps.map((s) => (
                      <li key={s.n}>
                        <span className="recipe-step-n">{s.n}</span>
                        <span>{s.text}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
              {recipe.memory.trim() && (
                <p className="recipe-card-memory">
                  {recipe.memory.trim()}
                </p>
              )}
            </div>
            <footer className="recipe-card-foot">
              پىچىرلاش · مېھىر بىلەن پىشۇرۇلغان
            </footer>
          </div>
        </div>
      </div>

      <div className="recipe-saved">
        <h3>
          ساقلانغان كارتىلار ({saved.length.toLocaleString("en-US")} /{" "}
          {MAX_RECIPES.toLocaleString("en-US")})
        </h3>
        {saved.length === 0 ? (
          <p className="local-hint">
            تېخى ساقلانغان كارتا يوق. تۇنجى رېتسېپىڭىزنى يېزىپ «ساقلاش»نى
            بېسىڭ.
          </p>
        ) : (
          <ul className="recipe-saved-list">
            {saved.map((item) => (
              <li
                key={item.id}
                className={item.id === recipe.id ? "current" : undefined}
              >
                <span className={`recipe-saved-swatch ${item.color}`} aria-hidden="true" />
                <span className="recipe-saved-name">
                  <strong>{item.title}</strong>
                  <small>
                    {item.from && <>{item.from} · </>}
                    <bdi dir="ltr">{dayOf(item.updated)}</bdi>
                  </small>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={item.id === recipe.id}
                  aria-label={`«${item.title}» كارتىسىنى ئېچىش`}
                  onClick={() => open(item)}
                >
                  <FolderOpen size={16} aria-hidden="true" />
                  {item.id === recipe.id ? "ئوچۇق" : "ئېچىش"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`«${item.title}» كارتىسىنى ئۆچۈرۈش`}
                  onClick={() => remove(item)}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  ئۆچۈرۈش
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {exportedURL && (
        <details className="export-preview" open>
          <summary>ئاخىرقى تەييارلانغان رەسىم</summary>
          <p>تېلېفوندا رەسىمنى ئۇزۇن بېسىپمۇ ساقلىيالايسىز.</p>
          <a href={exportedURL} download="pichirlash-recipe.png">
            رەسىمنى قايتا چۈشۈرۈش
          </a>
          <img src={exportedURL} alt="تەييارلانغان ئائىلە تائام كارتىسى" />
        </details>
      )}
      {(draftStore.error || listStore.error) && <StorageNotice />}
    </section>
  );
}
