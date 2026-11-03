import { useState } from "react";
import {
  Heart,
  Feather,
  BookOpen,
  Sparkles,
  Check,
  ArrowLeft,
  Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Paper } from "@/components/ui/paper";
import { Sticker } from "@/components/ui/sticker";
import { Mascot } from "@/components/ui/mascot";
import { Doodle } from "@/components/ui/doodle";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, LineChart } from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
const moods = [
  {
    name: "خۇشال",
    art: "smiley",
    hint: "بۈگۈنكى خۇشاللىقىڭىزدىن بىر جۈملە يېزىڭ.",
  },
  {
    name: "خاتىرجەم",
    art: "teacup",
    hint: "سىزگە خاتىرجەملىك بېرىدىغان بىر جاينى تەسۋىرلەڭ.",
  },
  {
    name: "ئويچان",
    art: "owl",
    hint: "كۆڭلىڭىزدىكى بىر سوئالنى قەغەزگە چۈشۈرۈڭ.",
  },
  { name: "ھارغىن", art: "sleepy", hint: "ئۆزىڭىزگە بىر ئىللىق سۆز ئېيتىڭ." },
  {
    name: "ئۈمىدۋار",
    art: "sunflower",
    hint: "ئەتە ئۈچۈن كىچىك بىر ئارزۇ يېزىڭ.",
  },
];
const days = [
  "دۈشەنبە",
  "سەيشەنبە",
  "چارشەنبە",
  "پەيشەنبە",
  "جۈمە",
  "شەنبە",
  "يەكشەنبە",
];
const weekly = days.map((day, i) => ({
  day,
  reading: [10, 20, 15, 25, 12, 30, 18][i],
  writing: [5, 8, 6, 15, 10, 18, 12][i],
}));
const challenges = [
  {
    name: "بىر پارچە شېئىر ئوقۇش",
    time: "٥ مىنۇت",
    type: "ئوقۇش",
    icon: BookOpen,
  },
  {
    name: "كۆڭۈلدىكى ئۈچ سۆزنى يېزىش",
    time: "٣ مىنۇت",
    type: "يېزىش",
    icon: Feather,
  },
  {
    name: "بىر يېڭى سۆز ئۆگىنىش",
    time: "٢ مىنۇت",
    type: "ئۆگىنىش",
    icon: Sparkles,
  },
  {
    name: "بىر كىشىگە رەھمەت ئېيتىش",
    time: "١ مىنۇت",
    type: "مېھىر",
    icon: Heart,
  },
];
const prompts = [
  "بالىلىقىڭىزدىكى ئەڭ ئىللىق بىر ئەسلىمىنى يېزىڭ.",
  "ئەگەر بىر دەرەخ سۆزلىيەلىسە، سىزگە نېمە دەيتتى؟",
  "دېرىزىڭىزدىن كۆرۈنگەن دۇنيانى ئۈچ جۈملە بىلەن تەسۋىرلەڭ.",
  "يىراقتىكى بىر دوستىڭىزغا قىسقا خەت يېزىڭ.",
];
function stored<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
export default function NotebookSections({
  onWrite,
  onBrowse,
}: {
  onWrite: () => void;
  onBrowse: () => void;
}) {
  const [mood, setMood] = useState<number>(() => {
      const v = stored("pichirlash-mood-v1", 0);
      return typeof v === "number" && v >= 0 && v < 5 ? v : 0;
    }),
    [done, setDone] = useState<number[]>(() => {
      const v = stored<unknown>("pichirlash-challenges-v1", []);
      return Array.isArray(v) ? v.filter((x) => typeof x === "number") : [];
    }),
    [chart, setChart] = useState<"bar" | "line">("bar"),
    [prompt, setPrompt] = useState(0),
    [error, setError] = useState(false);
  const save = (key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setError(false);
    } catch {
      setError(true);
    }
  };
  const toggle = (index: number) => {
    const next = done.includes(index)
      ? done.filter((x) => x !== index)
      : [...done, index];
    setDone(next);
    save("pichirlash-challenges-v1", next);
  };
  const chartProps = {
    data: weekly,
    xKey: "day",
    series: ["reading", "writing"],
    config: {
      reading: { label: "ئوقۇش", color: "#839e79" },
      writing: { label: "يېزىش", color: "#c49379" },
    },
    xLabel: "كۈن",
    label: "بىر ھەپتىلىك ئوقۇش ۋە يېزىش — ئۈلگە سانلىق مەلۇمات",
    yFormatter: (v: number) => v.toLocaleString("ar"),
    valueFormatter: (v: number) => `${v.toLocaleString("ar")} مىنۇت`,
    animate: true,
  };
  return (
    <div className="extra-sections">
      <section className="mood-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ئالدى بىلەن، ئۆزىڭىزدىن سوراڭ</span>
            <h2>بۈگۈن كۆڭلىڭىز قانداق؟</h2>
          </div>
          <Doodle name="heart" size={56} />
        </div>
        <div className="mood-buttons">
          {moods.map((item, i) => (
            <button
              key={item.name}
              aria-pressed={mood === i}
              onClick={() => {
                setMood(i);
                save("pichirlash-mood-v1", i);
              }}
            >
              <Sticker name={item.art} size={60} />
              <span>{item.name}</span>
              {mood === i && <Check size={15} />}
            </button>
          ))}
        </div>
        <div className="mood-response" role="status">
          <Heart size={18} />
          <p>{moods[mood].hint}</p>
          <Button variant="outline" onClick={onWrite}>
            يېزىپ باقاي <ArrowLeft size={16} />
          </Button>
        </div>
        {error && <p role="alert">تاللىشىڭىزنى ساقلىغىلى بولمىدى.</p>}
      </section>
      <section className="inspiration-grid">
        <Paper
          className="prompt-paper"
          tape="top"
          stock="paper"
          tilt={-1}
          rules="ruled"
        >
          <Badge>بۈگۈنكى ئىلھام</Badge>
          <h2>بىر ئوي، مىڭ ھېكايە.</h2>
          <p aria-live="polite">{prompts[prompt]}</p>
          <div className="prompt-actions">
            <Button onClick={onWrite}>
              <Feather size={17} /> يېزىشنى باشلاش
            </Button>
            <Button
              variant="ghost"
              onClick={() => setPrompt((v) => (v + 1) % prompts.length)}
            >
              <Shuffle size={17} /> باشقا ئوي
            </Button>
          </div>
        </Paper>
        <Paper className="kindness-paper" stock="slip" tilt={2}>
          <Sticker name="teacup" size={86} />
          <h3>ئۆزىڭىزگە ئازراق ۋاقىت بېرىڭ.</h3>
          <p>
            بىر ئىستاكان چاي، بىر پارچە قەغەز، بىر تىنىچ دەقىقە. ياخشى سۆزلەر
            ئالدىرىماي كېلىدۇ.
          </p>
          <Button variant="link" onClick={onBrowse}>
            بىر نەرسە ئوقۇي <ArrowLeft size={16} />
          </Button>
        </Paper>
      </section>
      <section className="activity-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">كىچىك قەدەملەرنىڭ ئىزى</span>
            <h2>ئوقۇش ۋە يېزىش رېتىمى</h2>
          </div>
          <div className="chart-switch">
            <Button
              variant={chart === "bar" ? "secondary" : "ghost"}
              aria-pressed={chart === "bar"}
              onClick={() => setChart("bar")}
            >
              تۈۋرۈك
            </Button>
            <Button
              variant={chart === "line" ? "secondary" : "ghost"}
              aria-pressed={chart === "line"}
              onClick={() => setChart("line")}
            >
              سىزىق
            </Button>
          </div>
        </div>
        <p className="demo-explanation">
          بۇ دىئاگراممىدىكى سانلار پەقەت كۆرۈنۈشنى سىناش ئۈچۈن بېرىلگەن ئۈلگە.
        </p>
        <div className="chart-sheet">
          {chart === "bar" ? (
            <BarChart {...chartProps} />
          ) : (
            <LineChart {...chartProps} />
          )}
        </div>
      </section>
      <section className="challenge-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">بۈگۈن ئۆزۈم ئۈچۈن</span>
            <h2>تۆت كىچىك ياخشى ئىش</h2>
          </div>
          <span className="challenge-count">
            {done.filter((x) => x >= 0 && x < 4).length.toLocaleString("ar")} /
            ٤
          </span>
        </div>
        <Progress
          value={done.filter((x) => x >= 0 && x < 4).length * 25}
          aria-label="ۋەزىپە تاماملىنىش نىسبىتى"
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>تامام</TableHead>
              <TableHead>كىچىك ۋەزىپە</TableHead>
              <TableHead>ۋاقىت</TableHead>
              <TableHead>تۈرى</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {challenges.map((item, i) => (
              <TableRow key={item.name}>
                <TableCell>
                  <button
                    className="task-check"
                    aria-label={`${item.name} — تاماملاش`}
                    aria-pressed={done.includes(i)}
                    onClick={() => toggle(i)}
                  >
                    {done.includes(i) && <Check size={18} />}
                  </button>
                </TableCell>
                <TableCell>
                  <span
                    className={
                      done.includes(i) ? "task-label complete" : "task-label"
                    }
                  >
                    <item.icon size={17} />
                    {item.name}
                  </span>
                </TableCell>
                <TableCell>{item.time}</TableCell>
                <TableCell>
                  <Badge variant="outline">{item.type}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="privacy-note">
          تاماملىغان ئىشلىرىڭىز مۇشۇ توركۆرگۈچتە ساقلىنىدۇ.
        </p>
      </section>
      <section className="idea-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ئويىڭىزنى ئەركىن قويۇڭ</span>
            <h2>بىر ئويدىن نەگە بارالايمىز؟</h2>
          </div>
          <Mascot pose="idle" size={78} />
        </div>
        <p>
          ئوتتۇرىدىكى كىچىك ئويىڭىز شېئىر، ھېكايە ياكى خەتكە ئايلىنالايدۇ. بىر
          يولنى تاللاڭ.
        </p>
        <div className="idea-map">
          <svg viewBox="0 0 800 300" aria-hidden="true">
            <path
              d="M400 145 C300 145 310 65 200 65 M400 145 C500 145 490 65 600 65 M400 145 C290 145 320 240 200 240 M400 145 C510 145 480 240 600 240"
              fill="none"
              stroke="#b0b69a"
              strokeWidth="2"
              strokeDasharray="7 5"
            />
          </svg>
          <span className="idea-center">
            <Sparkles size={23} /> بىر كىچىك ئوي
          </span>
          {[
            { label: "شېئىر", art: "sunflower" },
            { label: "ھېكايە", art: "owl" },
            { label: "خەت", art: "notebook" },
            { label: "ئەسلىمە", art: "teacup" },
          ].map((item, i) => (
            <button
              key={item.label}
              className={`idea-node node-${i}`}
              onClick={onWrite}
            >
              <Sticker name={item.art} size={43} />
              {item.label}
              <ArrowLeft size={15} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
