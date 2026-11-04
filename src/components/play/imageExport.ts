import notoFontURL from "@fontsource/noto-naskh-arabic/files/noto-naskh-arabic-arabic-400-normal.woff2?url";
export type LocalFont = "Karton" | "UKIJ Qolyazma" | "Noto Naskh Arabic";
const fontFiles: Record<Exclude<LocalFont, "Noto Naskh Arabic">, string> = {
  Karton: "/fonts/Karton-Regular.woff2",
  "UKIJ Qolyazma": "/fonts/UKIJQolyazma-Regular.woff2",
};
const cache = new Map<LocalFont, Promise<string>>();
export function forgetFontCSS(font: LocalFont) {
  cache.delete(font);
}
export function exportFontCSS(font: LocalFont = "Karton") {
  let result = cache.get(font);
  if (!result) {
    result = fetch(
      font === "Noto Naskh Arabic" ? notoFontURL : fontFiles[font],
    )
      .then((response) => {
        if (!response.ok) throw Error("font-download");
        return response.blob();
      })
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve(
                `@font-face{font-family:'${font}';src:url('${reader.result}') format('woff2');font-weight:400;font-style:normal}`,
              );
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          }),
      );
    cache.set(font, result);
  }
  return result;
}
export async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      /* A selectable fallback also works on preview HTTP origins. */
    }
  }
  const previous = document.activeElement,
    area = document.createElement("textarea");
  area.value = text;
  area.readOnly = true;
  area.style.cssText = "position:fixed;top:0;left:-9999px";
  document.body.append(area);
  area.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } finally {
    area.remove();
    if (previous instanceof HTMLElement) previous.focus();
  }
  if (!copied) throw Error("clipboard-unavailable");
}
