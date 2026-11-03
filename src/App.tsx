import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  Check,
  Coffee,
  Feather,
  Globe,
  GraduationCap,
  Heart,
  Instagram,
  NotebookPen,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/ui/sticker";
import { InkProvider } from "@/lib/ink/react";
import { entries, labels } from "./data/content";
import type { Entry } from "./data/content";
import NotebookSections from "./components/demo/NotebookSections";
import Studio from "./components/demo/Studio";
import type { DemoEntry } from "./components/demo/Studio";
import ArtLibrary, { Art } from "./components/demo/ArtLibrary";
import type { Decoration } from "./components/demo/ArtLibrary";
import "./demo.css";
import "./App.css";
type Note = { id: string; title: string; body: string; color: string };
type Tab = "all" | "poem" | "story" | "school" | "notes" | "saved";
const tabs: { id: Tab; label: string; icon: typeof Heart }[] = [
  { id: "all", label: "ھەممىسى", icon: Sparkles },
  { id: "poem", label: "شېئىرلار", icon: Feather },
  { id: "story", label: "ھېكايىلەر", icon: BookOpen },
  { id: "school", label: "ئۆگىنىش", icon: GraduationCap },
  { id: "notes", label: "خاتىرىلىرىم", icon: NotebookPen },
  { id: "saved", label: "ساقلىغانلىرىم", icon: Bookmark },
];
function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function App() {
  const [view, setView] = useState<"read" | "studio" | "art">("read");
  const [decoration, setDecoration] = useState<Decoration>();
  const [library, setLibrary] = useState<DemoEntry[]>(() => {
    const stored = readStored<unknown>("pichirlash-library-v1", null);
    return Array.isArray(stored) &&
      stored.every(
        (x) =>
          x &&
          typeof x.id === "string" &&
          typeof x.title === "string" &&
          typeof x.body === "string" &&
          ["poem", "story", "school"].includes(x.type),
      )
      ? stored
      : entries;
  });
  const [libraryError, setLibraryError] = useState(false);
  const updateLibrary = (items: DemoEntry[]) => {
    setLibrary(items);
    try {
      localStorage.setItem("pichirlash-library-v1", JSON.stringify(items));
      setLibraryError(false);
    } catch {
      setLibraryError(true);
    }
  };

  const [tab, setTab] = useState<Tab>("all"),
    [query, setQuery] = useState(""),
    [active, setActive] = useState<Entry | null>(null);
  const [saved, setSaved] = useState<string[]>(() => {
    const v = readStored<unknown>("pichirlash-saved", []);
    return Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string")
      : [];
  });
  const [notes, setNotes] = useState<Note[]>(() => {
    const v = readStored<unknown>("pichirlash-notes", []);
    return Array.isArray(v)
      ? v.filter(
          (x): x is Note =>
            !!x &&
            typeof x === "object" &&
            ["id", "title", "body", "color"].every(
              (k) => typeof (x as Record<string, unknown>)[k] === "string",
            ),
        )
      : [];
  });
  const [editing, setEditing] = useState<Note | null>(null),
    [storageError, setStorageError] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    try {
      localStorage.setItem("pichirlash-saved", JSON.stringify(saved));
      localStorage.setItem("pichirlash-notes", JSON.stringify(notes));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [saved, notes]);
  useEffect(() => {
    if (active || editing) dialog.current?.showModal();
    else dialog.current?.close();
  }, [active, editing]);
  const toggleSave = (id: string) =>
    setSaved((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  const newNote = () =>
    setEditing({
      id:
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `note-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: "",
      body: "",
      color: "yellow",
    });
  const filtered = library
    .filter((e) => !e.draft)
    .filter(
      (e) =>
        (tab === "all" ||
          (tab === "saved" && saved.includes(e.id)) ||
          e.type === tab) &&
        `${e.title} ${e.body}`.includes(query.trim()),
    );
  const close = () => {
    setActive(null);
    setEditing(null);
  };
  const saveNote = () => {
    if (!editing || !editing.title.trim() || !editing.body.trim()) return;
    setNotes((v) => [
      { ...editing, title: editing.title.trim(), body: editing.body.trim() },
      ...v.filter((n) => n.id !== editing.id),
    ]);
    setTab("notes");
    setQuery("");
    close();
  };
  return (
    <InkProvider>
      <div className="site" dir="rtl">
        <header className="header">
          <a
            className="brand"
            href="#"
            aria-label="پىچىرلاش باش بەت"
            onClick={() => {
              setView("read");
              setTab("all");
              setQuery("");
            }}
          >
            <span className="brand-icon">
              <Feather size={25} />
            </span>
            <span>
              پىچىرلاش<span className="brand-dot">✳</span>
            </span>
          </a>
          <div className="header-note">كۆڭۈلدىن چىققان كىچىك سۆزلەر</div>
          <button
            className="header-heart"
            onClick={() => {
              setView("read");
              setTab("saved");
              document
                .getElementById("notebook")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            aria-label="ساقلىغانلىرىم"
          >
            <Heart size={20} />
            <span>{saved.length.toLocaleString("ar")}</span>
          </button>
        </header>
        <nav className="demo-nav" aria-label="باش يولباشچى">
          {(
            [
              { id: "read", label: "ئوقۇش", icon: BookOpen },
              { id: "studio", label: "يېزىقچىلىق بۇلۇڭى", icon: NotebookPen },
              { id: "art", label: "سەنئەت ساندۇقى", icon: Sparkles },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              aria-pressed={view === item.id}
              onClick={() => {
                setView(item.id);
                setDecoration(undefined);
              }}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
          <span>سىناق نۇسخىسى</span>
        </nav>
        <main>
          {libraryError && (
            <p role="alert" className="storage-warning">
              يازما ساقلانمىدى. توركۆرگۈچ ساقلاش بوشلۇقىنى تەكشۈرۈڭ.
            </p>
          )}
          {view === "studio" && (
            <Studio
              key={
                decoration ? `${decoration.kind}-${decoration.name}` : "studio"
              }
              items={library}
              onChange={updateLibrary}
              onRead={setActive}
              decoration={decoration}
              onDone={() => setDecoration(undefined)}
            />
          )}
          {view === "art" && (
            <ArtLibrary
              onChoose={(art) => {
                setDecoration(art);
                setView("studio");
              }}
            />
          )}
          <div hidden={view !== "read"}>
            <section className="hero">
              <div className="hero-copy">
                <span className="eyebrow">
                  <span /> سۆزلەرگە تولغان كىچىك دۇنيا
                </span>
                <h1>
                  بەزى سۆزلەرنى
                  <br />
                  <span className="highlight">ئاستا</span> ئېيتقۇڭ كېلىدۇ
                  <span className="period">.</span>
                </h1>
                <p>
                  بىر پارچە شېئىر، بىر تاتلىق ھېكايە، بىر كىچىك ئوي…
                  <br />
                  بۇ يەردە ھەر بىر سۆزگە، ھەر بىر ئارزۇغا ئورۇن بار.
                </p>
                <div className="hero-actions">
                  <Button
                    onClick={() =>
                      document
                        .getElementById("notebook")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    ۋاراقلاپ باقايلى <ArrowLeft size={18} />
                  </Button>
                  <button className="text-button" onClick={newNote}>
                    <Plus size={18} /> بىر خاتىرە يازاي
                  </button>
                </div>
                <div className="little-note">
                  <Heart size={14} /> ئازراق ئوقۇش، ئازراق يېزىش، كۆپرەك ھېس
                  قىلىش.
                </div>
              </div>
              <div className="hero-art" aria-label="رەڭلىك قەغەزلەر ۋە گۈللەر">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />
                <div className="art-spark">✧</div>
                <div className="back-sheet" />
                <div className="hero-sheet">
                  <span className="washi" />
                  <span className="sheet-date">بۈگۈنكى كىچىك ئەسلىمە</span>
                  <Heart className="sheet-heart" size={30} />
                  <blockquote>
                    «ئارزۇلىرىڭىز كىچىك
                    <br />
                    بولسىمۇ، ئۇلارنى
                    <br />
                    <em>مېھىر بىلەن</em> ئاسراڭ.»
                  </blockquote>
                  <span className="sheet-sign">— پىچىرلاشتىن سىزگە</span>
                  <span className="sheet-lines" />
                </div>
                <div className="sticker-flower">
                  <Sticker name="sunflower" size={108} />
                </div>
                <div className="sticker-star">
                  <Sticker name="comet" size={64} />
                </div>
                <div className="tiny-card">
                  <span>بىر كۈن، بىر يېڭى بەت</span>
                  <Feather size={21} />
                </div>
                <span className="art-dots">···</span>
              </div>
            </section>
            <section id="notebook" className="notebook">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">كۆڭۈل دەپتىرى</span>
                  <h2>
                    قايسى بەتنى ئاچىمىز؟ <span>✿</span>
                  </h2>
                </div>
                <label className="search">
                  <Search size={18} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="بىر سۆز ئىزدەڭ…"
                    aria-label="مەزمۇن ئىزدەش"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      aria-label="ئىزدەشنى تازىلاش"
                    >
                      <X size={16} />
                    </button>
                  )}
                </label>
              </div>
              <div className="tabs" role="group" aria-label="مەزمۇن تۈرلىرى">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    className={tab === t.id ? "tab selected" : "tab"}
                    aria-pressed={tab === t.id}
                    onClick={() => setTab(t.id)}
                  >
                    <t.icon size={17} />
                    {t.label}
                    {t.id === "notes" && notes.length > 0 && (
                      <small>{notes.length}</small>
                    )}
                  </button>
                ))}
              </div>
              {storageError && (
                <p role="alert" className="storage-warning">
                  خاتىرىلەرنى بۇ توركۆرگۈچتە ساقلىغىلى بولمىدى. يېزىقلىرىڭىزنى
                  كۆچۈرۈپ ساقلىۋېلىڭ.
                </p>
              )}
              {tab === "notes" ? (
                <>
                  <div className="notes-intro">
                    <p>
                      بۇ بەت پەقەت سىزنىڭ. خاتىرىلىرىڭىز مۇشۇ توركۆرگۈچتە
                      ساقلىنىدۇ.
                    </p>
                    <Button onClick={newNote}>
                      <Plus size={18} /> يېڭى خاتىرە
                    </Button>
                  </div>
                  <div className="cards">
                    {notes
                      .filter((n) =>
                        `${n.title} ${n.body}`.includes(query.trim()),
                      )
                      .map((n) => (
                        <article className={`note-card ${n.color}`} key={n.id}>
                          <span className="card-tape" />
                          <NotebookPen size={23} />
                          <button
                            className="card-open"
                            onClick={() => setEditing(n)}
                          >
                            <h3>{n.title}</h3>
                            <p>{n.body.slice(0, 125)}</p>
                          </button>
                          <div className="card-bottom">
                            <span>شەخسىي خاتىرە</span>
                            <button
                              aria-label={`${n.title} — ئۆچۈرۈش`}
                              onClick={() => {
                                if (confirm("بۇ خاتىرىنى ئۆچۈرەمسىز؟"))
                                  setNotes((v) =>
                                    v.filter((x) => x.id !== n.id),
                                  );
                              }}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </article>
                      ))}
                    {!notes.length && (
                      <button className="add-card" onClick={newNote}>
                        <Plus size={30} />
                        <h3>تۇنجى بېتىڭىزنى ئېچىڭ</h3>
                        <p>بۈگۈنكى ئويلىرىڭىزنى يېزىپ قويۇڭ.</p>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="cards">
                  {filtered.map((e, i) => (
                    <article className={`note-card ${e.color}`} key={e.id}>
                      <span className="card-tape" />
                      <div className="card-top">
                        <span className="category">
                          {e.type === "poem" ? (
                            <Feather size={16} />
                          ) : e.type === "story" ? (
                            <BookOpen size={16} />
                          ) : (
                            <GraduationCap size={16} />
                          )}{" "}
                          {labels[e.type]}
                        </span>
                        <span className="entry-number">
                          {(i + 1).toLocaleString("ar")}
                        </span>
                      </div>
                      <button
                        className="card-open"
                        onClick={() => setActive(e)}
                      >
                        {e.art && <Art art={e.art} size={54} />}
                        <h3>{e.title}</h3>
                        <p>{e.excerpt}</p>
                      </button>
                      <div className="card-bottom">
                        <button
                          className="read-link"
                          onClick={() => setActive(e)}
                        >
                          داۋامىنى ئوقۇش <ArrowLeft size={16} />
                        </button>
                        <button
                          aria-label={`${e.title} — ساقلاش`}
                          aria-pressed={saved.includes(e.id)}
                          onClick={() => toggleSave(e.id)}
                        >
                          <Heart
                            size={19}
                            fill={
                              saved.includes(e.id) ? "currentColor" : "none"
                            }
                          />
                        </button>
                      </div>
                    </article>
                  ))}
                  {!filtered.length && (
                    <div className="empty">
                      <Bookmark size={30} />
                      <h3>
                        {tab === "saved"
                          ? "ساقلىغان بەتلىرىڭىز مۇشۇ يەردە كۆرۈنىدۇ"
                          : "ماس كېلىدىغان مەزمۇن تېپىلمىدى"}
                      </h3>
                      <p>
                        {tab === "saved"
                          ? "ياقتۇرغان يازمىڭىزنىڭ يۈرەك بەلگىسىنى بېسىڭ."
                          : "باشقا بىر سۆز بىلەن ئىزدەپ بېقىڭ."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
            <NotebookSections
              onWrite={() => {
                setDecoration({ kind: "sticker", name: "notebook" });
                setView("studio");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onBrowse={() =>
                document
                  .getElementById("notebook")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            />
            <aside className="closing">
              <span className="closing-star">✳</span>
              <p>
                ھەر بىر ئادەمنىڭ كۆڭلىدە بىر كىتاب بار.
                <br />
                <strong>سىزنىڭكى قايسى سۆز بىلەن باشلىنىدۇ؟</strong>
              </p>
              <button onClick={newNote} aria-label="خاتىرە يېزىش">
                <NotebookPen size={26} />
              </button>
            </aside>
          </div>
        </main>
        <footer aria-label="ئىجتىمائىي ئۇلىنىشلار">
          {[
            {
              href: "https://www.instagram.com/uyghurai/",
              label: "Instagram @uyghurai",
              icon: Instagram,
            },
            { href: "https://x.com/uyghurai", label: "X @uyghurai", icon: X },
            {
              href: "https://www.youtube.com/@UyghurAI",
              label: "YouTube UyghurAI",
              icon: Youtube,
            },
            { href: "https://idirak.com", label: "Idirak", icon: Globe },
            {
              href: "https://ko-fi.com/uyghurAI",
              label: "Ko-fi UyghurAI",
              icon: Coffee,
            },
          ].map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              title={s.label}
            >
              <s.icon size={21} />
            </a>
          ))}
        </footer>
        <dialog
          aria-label={editing ? "خاتىرە تەھرىرلەش" : "يازما ئوقۇش"}
          ref={dialog}
          onCancel={close}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          dir="rtl"
        >
          <div className="dialog-content">
            <button className="dialog-close" onClick={close} aria-label="تاقاش">
              <X size={23} />
            </button>
            {active && (
              <>
                <span className="eyebrow">
                  {labels[active.type]} · {active.time}
                </span>
                {(active as DemoEntry).art && (
                  <Art art={(active as DemoEntry).art!} size={90} />
                )}
                <h2>{active.title}</h2>
                <div className="reading-body">{active.body}</div>
                <Button variant="outline" onClick={() => toggleSave(active.id)}>
                  <Heart
                    size={18}
                    fill={saved.includes(active.id) ? "currentColor" : "none"}
                  />
                  {saved.includes(active.id) ? "ساقلاندى" : "ساقلاپ قوياي"}
                </Button>
              </>
            )}
            {editing && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveNote();
                }}
              >
                <span className="eyebrow">كۆڭلۈمدىكى سۆزلەر</span>
                <h2>بىر كىچىك خاتىرە</h2>
                <label className="field">
                  ماۋزۇ
                  <input
                    autoFocus
                    required
                    maxLength={100}
                    value={editing.title}
                    onChange={(e) =>
                      setEditing({ ...editing, title: e.target.value })
                    }
                    placeholder="بۈگۈنكى ئويلىرىم…"
                  />
                </label>
                <label className="field">
                  خاتىرە
                  <textarea
                    required
                    maxLength={10000}
                    rows={7}
                    value={editing.body}
                    onChange={(e) =>
                      setEditing({ ...editing, body: e.target.value })
                    }
                    placeholder="بۇ يەرگە كۆڭلىڭىزدىكىنى يېزىڭ…"
                  />
                </label>
                <fieldset className="color-picker">
                  <legend>قەغەز رەڭگى</legend>
                  {["yellow", "pink", "green", "blue", "lavender"].map(
                    (c, i) => (
                      <button
                        type="button"
                        key={c}
                        className={c}
                        onClick={() => setEditing({ ...editing, color: c })}
                        aria-label={
                          ["سېرىق", "ھالرەڭ", "يېشىل", "كۆك", "بىنەپشە"][i]
                        }
                        aria-pressed={editing.color === c}
                      >
                        {editing.color === c && <Check size={17} />}
                      </button>
                    ),
                  )}
                </fieldset>
                <Button type="submit">
                  <Check size={18} /> خاتىرىنى ساقلاش
                </Button>
                <p className="privacy-note">
                  خاتىرىڭىز پەقەت مۇشۇ ئۈسكۈنىنىڭ توركۆرگۈچىدە ساقلىنىدۇ.
                </p>
              </form>
            )}
          </div>
        </dialog>
      </div>
    </InkProvider>
  );
}
export default App;
