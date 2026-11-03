import { createContext, useContext, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  Sun,
  CloudRain,
  LampDesk,
  Volume2,
  VolumeX,
  Settings2,
} from "lucide-react";
import { useLocal } from "./useLocal";
import { isRecord } from "./model";
type Settings = { theme: "morning" | "rain" | "lamp"; sound: boolean };
const valid = (v: unknown): v is Settings =>
  isRecord(v) &&
  ["morning", "rain", "lamp"].includes(String(v.theme)) &&
  typeof v.sound === "boolean";
const ExperienceContext = createContext<{
  settings: Settings;
  change: (v: Settings) => void;
  play: (kind?: "paper" | "pencil") => void;
  error: boolean;
} | null>(null);
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
