import { Flame, Trophy, TreePine } from "lucide-react";
import {
  currentStreak,
  daysInYear,
  longestStreak,
  treeStage,
  treeStages,
} from "@/lib/uyghur/streak";
import { localDay } from "@/components/play/model";

const stageNames = ["ئۇرۇق", "بىخ", "كۆچەت", "دەرەخ", "چېچەكلىگەن دەرەخ", "مېۋىلىك دەرەخ"];

/** An SVG tree that grows with the number of days read this year. */
export default function ReadingTree({ days }: { days: string[] }) {
  const today = localDay();
  const year = Number(today.slice(0, 4));
  const yearDays = daysInYear(days, year);
  const stage = treeStage(yearDays);
  const next = treeStages[stage + 1];
  const streak = currentStreak(days, today);
  const leaves = Math.min(40, yearDays);
  return (
    <section className="reading-tree" aria-label="ئوقۇش دەرىخى">
      <div className="tree-stats">
        <span>
          <Flame size={18} /> <strong>{streak}</strong> كۈن ئۇدا ئوقۇش
        </span>
        <span>
          <Trophy size={18} /> ئەڭ ئۇزۇن: <strong>{longestStreak(days)}</strong> كۈن
        </span>
        <span>
          <TreePine size={18} /> {year}-يىلى <strong>{yearDays}</strong> كۈن ئوقۇدىڭىز
        </span>
      </div>
      <svg
        viewBox="0 0 200 180"
        role="img"
        aria-label={`ئوقۇش دەرىخى: ${stageNames[stage]}`}
        className={`tree-svg stage-${stage}`}
      >
        <ellipse cx="100" cy="168" rx="70" ry="9" fill="#cbbf98" opacity=".55" />
        {stage === 0 && <ellipse cx="100" cy="160" rx="8" ry="5" fill="#8a6a43" />}
        {stage >= 1 && (
          <path
            d={`M100 166 C ${stage > 2 ? "96 120, 104 100" : "99 150, 101 145"}, 100 ${[0, 140, 110, 80, 70, 66][stage]}`}
            stroke="#7a5a37"
            strokeWidth={[0, 3, 6, 10, 12, 13][stage]}
            fill="none"
            strokeLinecap="round"
          />
        )}
        {stage >= 3 && (
          <g stroke="#7a5a37" strokeWidth="5" strokeLinecap="round" fill="none">
            <path d="M100 110 L70 88" />
            <path d="M100 100 L132 80" />
          </g>
        )}
        {stage >= 1 && (
          <g className="tree-leaves">
            {Array.from({ length: Math.max(2, leaves) }, (_, i) => {
              const angle = i * 2.399;
              const r = stage < 3 ? 6 + (i % 3) * 3 : 10 + ((i * 7) % 42);
              const cy = stage < 3 ? [0, 136, 104][stage] : 66;
              return (
                <ellipse
                  key={i}
                  cx={100 + Math.cos(angle) * r * (stage < 3 ? 1 : 1.25)}
                  cy={cy + Math.sin(angle) * r * 0.75}
                  rx={stage < 3 ? 5 : 8}
                  ry={stage < 3 ? 3 : 5}
                  fill={["#8fb46a", "#6f9c58", "#a8c77b"][i % 3]}
                  transform={`rotate(${(i * 37) % 180} ${100 + Math.cos(angle) * r} ${cy + Math.sin(angle) * r * 0.75})`}
                />
              );
            })}
          </g>
        )}
        {stage >= 4 &&
          Array.from({ length: 9 }, (_, i) => (
            <circle
              key={`b${i}`}
              cx={100 + Math.cos(i * 1.9) * (14 + ((i * 11) % 34))}
              cy={66 + Math.sin(i * 1.9) * 26}
              r="3.2"
              fill={stage >= 5 ? "#d9534f" : "#f3c1cf"}
            />
          ))}
      </svg>
      <p className="local-hint">
        {stageNames[stage]}.{" "}
        {next !== undefined
          ? `يەنە ${next - yearDays} كۈن ئوقۇسىڭىز «${stageNames[stage + 1]}» بولىدۇ.`
          : "ئەڭ يۇقىرى باسقۇچ — ئاپىرىن!"}{" "}
        بىر يازمىنىڭ كۆپ قىسمىنى ئوقۇسىڭىز، ئۇ كۈن ھېسابلىنىدۇ.
      </p>
    </section>
  );
}
