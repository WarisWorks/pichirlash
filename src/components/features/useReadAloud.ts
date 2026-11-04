import { useEffect, useRef, useState } from "react";
import { convertScript } from "@/lib/uyghur/script";

export type VoiceMode =
  | { kind: "uyghur"; voice: SpeechSynthesisVoice }
  | { kind: "approx"; voice: SpeechSynthesisVoice }
  | { kind: "none" };

/**
 * Pick the best voice: a real Uyghur voice if the device has one, otherwise a
 * Turkish voice reading the Latin-script text (close pronunciation), otherwise none.
 */
export function pickVoice(voices: SpeechSynthesisVoice[]): VoiceMode {
  const ug = voices.find((v) => v.lang.toLowerCase().startsWith("ug"));
  if (ug) return { kind: "uyghur", voice: ug };
  const approx =
    voices.find((v) => v.lang.toLowerCase().startsWith("tr")) ||
    voices.find((v) => v.lang.toLowerCase().startsWith("uz")) ||
    voices.find((v) => v.lang.toLowerCase().startsWith("az")) ||
    voices.find((v) => v.lang.toLowerCase().startsWith("kk"));
  return approx ? { kind: "approx", voice: approx } : { kind: "none" };
}

/** Words of a paragraph with their character offsets in the spoken text. */
function prepare(words: string[], mode: VoiceMode) {
  let offset = 0;
  const starts: number[] = [];
  const spoken = words
    .map((w) => {
      const text =
        mode.kind === "approx"
          ? convertScript(w, "uly").replace(/'/g, "").toLowerCase()
          : w;
      starts.push(offset);
      offset += text.length + 1;
      return text;
    })
    .join(" ");
  return { spoken, starts };
}

/**
 * Read paragraphs aloud one by one, reporting the word currently spoken
 * as [paragraph, wordIndex] so the page can highlight it.
 */
export function useReadAloud(paragraphs: string[][]) {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [mode, setMode] = useState<VoiceMode>({ kind: "none" }),
    [state, setState] = useState<"idle" | "playing" | "paused">("idle"),
    [current, setCurrent] = useState<[number, number] | null>(null),
    [rate, setRate] = useState(0.85);
  const run = useRef(0);
  useEffect(() => {
    if (!supported) return;
    const update = () => setMode(pickVoice(speechSynthesis.getVoices()));
    update();
    speechSynthesis.addEventListener("voiceschanged", update);
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", update);
      run.current++;
      speechSynthesis.cancel();
    };
  }, [supported]);
  const stop = () => {
    run.current++;
    if (supported) speechSynthesis.cancel();
    setState("idle");
    setCurrent(null);
  };
  const speakFrom = (index: number, token: number) => {
    if (mode.kind === "none" || index >= paragraphs.length) {
      setState("idle");
      setCurrent(null);
      return;
    }
    const words = paragraphs[index];
    const { spoken, starts } = prepare(words, mode);
    const utter = new SpeechSynthesisUtterance(spoken);
    utter.voice = mode.voice;
    utter.lang = mode.voice.lang;
    utter.rate = rate;
    utter.onboundary = (e) => {
      if (run.current !== token || e.name === "sentence") return;
      let word = 0;
      while (word + 1 < starts.length && starts[word + 1] <= e.charIndex) word++;
      setCurrent([index, word]);
    };
    utter.onend = () => {
      if (run.current === token) speakFrom(index + 1, token);
    };
    utter.onerror = () => {
      if (run.current === token) stop();
    };
    setCurrent([index, 0]);
    speechSynthesis.speak(utter);
  };
  const play = () => {
    if (!supported || mode.kind === "none") return;
    if (state === "paused") {
      speechSynthesis.resume();
      setState("playing");
      return;
    }
    stop();
    const token = run.current;
    setState("playing");
    speakFrom(0, token);
  };
  const pause = () => {
    if (!supported) return;
    speechSynthesis.pause();
    setState("paused");
  };
  return { supported, mode, state, current, rate, setRate, play, pause, stop };
}
