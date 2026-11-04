import { createContext, useContext, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  Sun,
  CloudRain,
  LampDesk,
  Volume2,
  VolumeX,
  Settings2,
  Flower2,
  Wheat,
  Snowflake,
  Languages,
} from "lucide-react";
import type { UyghurScript } from "@/lib/uyghur/script";
import { convertScript, scriptDir, scriptNames } from "@/lib/uyghur/script";
import { useLocal } from "./useLocal";
import { isRecord } from "./model";
const themes = ["morning", "rain", "lamp", "nawruz", "harvest", "winter"] as const;
type Theme = (typeof themes)[number];
type Settings = { theme: Theme; sound: boolean; script?: UyghurScript };
const valid = (v: unknown): v is Settings =>
  isRecord(v) &&
  themes.includes(String(v.theme) as Theme) &&
  typeof v.sound === "boolean" &&
  (v.script === undefined || ["uey", "uly", "usy"].includes(String(v.script)));
/** Nawruz falls on 21 March; suggest the spring theme in the week around it. */
export function isNawruzWeek(date = new Date()) {
  return date.getMonth() === 2 && date.getDate() >= 18 && date.getDate() <= 24;
}
const ExperienceContext = createContext<{
  settings: Settings;
  change: (v: Settings) => void;
  play: (kind?: "paper" | "pencil") => void;
  error: boolean;
} | null>(null);
/** The reader's chosen script, with helpers to convert Arabic-script text. */
export function useScript() {
  const context = useContext(ExperienceContext);
  const script: UyghurScript = context?.settings.script ?? "uey";
  return {
    script,
    dir: scriptDir(script),
    lang: script === "uey" ? "ug-Arab" : script === "uly" ? "ug-Latn" : "ug-Cyrl",
    t: (text: string) => convertScript(text, script),
    setScript: (next: UyghurScript) =>
      context?.change({ ...context.settings, script: next }),
  };
}
export function ScriptSwitch({ compact = false }: { compact?: boolean }) {
  const { script, setScript } = useScript();
  return (
    <div
      className={`script-switch ${compact ? "compact" : ""}`}
      role="group"
      aria-label="يېزىق تاللاش"
    >
      <Languages size={16} aria-hidden="true" />
      {(Object.keys(scriptNames) as UyghurScript[]).map((id) => (
        <button
          key={id}
          type="button"
          lang={id === "uey" ? "ug" : id === "uly" ? "ug-Latn" : "ug-Cyrl"}
          aria-pressed={script === id}
          onClick={() => setScript(id)}
        >
          {compact ? { uey: "ئۇ", uly: "La", usy: "Ки" }[id] : scriptNames[id]}
        </button>
      ))}
    </div>
  );
}
export function ExperienceProvider({ children }: { children: ReactNode }) {
  const {
    value: settings,
    setValue: change,
    error,
  } = useLocal<Settings>(
    "pichirlash-settings-v1",
    { theme: "morning", sound: false },
    valid,
  );
  const audio = useRef<AudioContext | null>(null),
    last = useRef(0);
  const play = (kind: "paper" | "pencil" = "paper") => {
    if (!settings.sound || Date.now() - last.current < 85) return;
    last.current = Date.now();
    try {
      if (!window.AudioContext) return;
      audio.current ??= new AudioContext();
      const ctx = audio.current;
      void ctx.resume().catch(() => {});
      const source = ctx.createBufferSource(),
        gain = ctx.createGain();
      const length = Math.floor(
        ctx.sampleRate * (kind === "paper" ? 0.11 : 0.035),
      );
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const channel = buffer.getChannelData(0);
      for (let i = 0; i < length; i++)
        channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = kind === "paper" ? 1300 : 2400;
      gain.gain.value = 0.035;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      source.onended = () => {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
    } catch {
      /* Audio is an optional enhancement. */
    }
  };
  useEffect(
    () => () => {
      void audio.current?.close().catch(() => {});
    },
    [],
  );
  return (
    <ExperienceContext.Provider value={{ settings, change, play, error }}>
      <div
        className="experience-shell"
        data-desk-theme={settings.theme}
        onClick={(e) => {
          if ((e.target as Element).closest("button,a")) play();
        }}
        onKeyDown={(e) => {
          if (
            e.key.length === 1 &&
            (e.target instanceof HTMLInputElement ||
              e.target instanceof HTMLTextAreaElement)
          )
            play("pencil");
        }}
      >
        {children}
      </div>
    </ExperienceContext.Provider>
  );
}
export function DeskSettings() {
  const context = useContext(ExperienceContext);
  if (!context) return null;
  const { settings, change, error } = context;
  return (
    <details className="desk-settings">
      <summary>
        <Settings2 size={17} /> كەيپىيات
      </summary>
      <div className="settings-panel">
        <p>ئۈستەلنىڭ كەيپىياتى</p>
        <div className="theme-buttons">
          {(
            [
              { id: "morning", label: "ئەتىگەن", icon: Sun },
              { id: "rain", label: "يامغۇرلۇق كۈن", icon: CloudRain },
              { id: "lamp", label: "كەچلىك چىراغ", icon: LampDesk },
              { id: "nawruz", label: "نورۇز باھارى", icon: Flower2 },
              { id: "harvest", label: "ھوسۇل كۈزى", icon: Wheat },
              { id: "winter", label: "قىش كېچىسى", icon: Snowflake },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              aria-label={t.label}
              aria-pressed={settings.theme === t.id}
              onClick={() => change({ ...settings, theme: t.id })}
            >
              <t.icon size={18} />
              {t.label}
            </button>
          ))}
        </div>
        {isNawruzWeek() && settings.theme !== "nawruz" && (
          <p className="local-hint">نورۇز مۇبارەك! «نورۇز باھارى» كەيپىياتىنى سىناپ بېقىڭ.</p>
        )}
        <p>يېزىق</p>
        <ScriptSwitch />
        <button
          className="sound-toggle"
          aria-pressed={settings.sound}
          onClick={() => change({ ...settings, sound: !settings.sound })}
        >
          {settings.sound ? <Volume2 size={18} /> : <VolumeX size={18} />} قەغەز
          ۋە قەلەم ئاۋازى: {settings.sound ? "ئوچۇق" : "ئېتىق"}
        </button>
        <p className="local-hint">
          ئاۋاز ئىختىيارىي. تاللىشىڭىز مۇشۇ توركۆرگۈچتە ساقلىنىدۇ.
        </p>
        {error && <StorageNotice />}
      </div>
    </details>
  );
}
export function StorageNotice() {
  return (
    <p className="storage-warning" role="alert">
      ئۆزگەرتىشلەرنى ساقلىغىلى بولمىدى. يېزىقلىرىڭىزنى كۆچۈرۈپ ساقلىۋېلىڭ؛
      توركۆرگۈچ ساقلاش بوشلۇقىنى تەكشۈرۈڭ.
    </p>
  );
}
