# پىچىرلاش · Pichirlash

A cozy Uyghur reading and creative playground. React 19, TypeScript, Vite, Tailwind CSS 4, Lucide, and real Looseleaf registry components and artwork. The entire experience is a frontend demo; no accounts, server, or environment variables are required.

## Typeface

Uyghur text uses the **Karton** typeface (`public/fonts/Karton-Regular.woff2`), with UKIJ Qolyazma and Noto Naskh Arabic as fallbacks. Postcards, letters, recipe cards and the family tree embed Karton in exported images. Calligraphy tracing keeps UKIJ Qolyazma as its handwriting model, and postcards can still choose UKIJ Qolyazma or Noto Naskh Arabic. Karton has no Cyrillic letters, so Cyrillic-script text falls back to another font.

## Run and verify

Use Node.js 24 and npm:

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Static deployment: build command `npm run build`, output directory `dist`.

## Explore

The main navigation opens reading, the creative playground, the writing studio, and the art library. The creative playground has six sections:

| Section           | Behavior                                                                                                                                                                                                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Creative desk     | Drag notes, quotes, and stickers; use arrow keys or position sliders instead of dragging. Edit text, resize paper, change colors, pin reading quotes, and undo a deletion.                                                                                                         |
| Poetry playground | Add Uyghur word tiles by clicking or dragging, reorder them with drag/drop or buttons, insert line breaks, save and reopen poems, and turn a poem into a postcard.                                                                                                                 |
| Story trail       | An original branching Uyghur story with three endings, backtracking, restart, and a saved reading path.                                                                                                                                                                            |
| Letter corner     | Choose four classic stationery designs and five original Uyghur wording templates; personalize, seal, reopen, save, export PNG pages, and prepare sharing or an email draft.                                                                                                                                             |
| Word garden       | Distinct completed activities add flowers. Repeating the same activity does not duplicate rewards. Watering is available once per local calendar day. The garden shows twelve flowers and continues counting later achievements.                                                   |
| Postcard maker    | Customize text, paper, handwriting, and a sticker; export a 1200 × 1500 PNG with embedded local fonts. A real exported-image preview and download link support mobile saving. Long text is fitted down to 18px; export is blocked with a helpful message if it still will not fit. |

Additional features:

- Morning, rainy afternoon, and evening lamplight desk themes.
- Optional synthesized paper and pencil sounds, off by default. Sound starts only after interaction and requires browser audio support.
- Surprise envelopes with original poems, prompts, and encouraging messages.
- A focused reading view with adjustable font size and line spacing, saved reading position, resume-reading shortcut, favorites, and a quote-pinning action.
- Create, edit, and delete posts and private notes. The studio supports drafts and demo publication; drafts stay out of the public-looking reading feed.
- Search and category filters, mood buttons, rotating prompts, bar/line chart demos, an interactive task table with progress, and an idea map.
- All 333 installed art assets are available in the art library: 96 stickers, 48 doodles, 15 mascot poses, 14 scenes, and 160 icons.
- Responsive RTL layouts, keyboard controls, and reduced-motion support.
- An icon-only footer for Instagram, X, YouTube, Idirak, and Ko-fi, with accessible link labels.

## Language, culture and family features

| Feature | Where | Behavior |
| --- | --- | --- |
| Script switcher | Mood menu, reading room | Shows stories, proverbs and shared items in Arabic script (UEY), Latin (ULY) or Cyrillic (USY). Conversion handles digraphs, hamza, `n'g` and я/ю, and is computed on the device. |
| Uyghur keyboard | Floating button, every page | On-screen letters for any text field, a Latin→Uyghur typing box, and an optional standard Uyghur layout for a physical keyboard (f = ا, j = ق, / = ئ…). |
| Tap-a-word dictionary | Reading room → «سۆز لۇغىتى» | Tap a word to see its root, each suffix (case, possessive, plural, tense…) and a Uyghur/English meaning; save it to a word notebook with flashcard review in the language desk. |
| Spelling practice | Playground | 43 questions on ې/ى, ۆ/ۈ, ۇ/و and hamza; rounds of 8 with explanations and a mistakes review. |
| Proverb of the day | Home page | A daily traditional proverb with its meaning and a reflection prompt; answers are saved. |
| Seasonal themes | Mood menu | Nawruz spring, harvest autumn and winter night desk themes; Nawruz is suggested in the week of 21 March. |
| Calligraphy tracing | Playground | Trace all 32 letters over the UKIJ Qolyazma guide, see positional forms, and get a coverage score. |
| Rhyme & meter helper | Poetry playground | Syllable count per line and coloured matching rhyme endings. |
| Fill-in stories | Playground | Five story templates with typed blanks and suggestion chips; finished stories are saved. |
| Family voice notes | Playground, reading room | Record elders with the microphone; recordings stay on the device in IndexedDB and can be attached to a reading page, renamed or downloaded. |
| Family recipe cards | Playground | Lagman, polo and samsa starters, saved cards, and 1200 × 1600 PNG export. |
| Share links | Poems, postcards, recipes | Content is encoded in the link's `#share=` fragment, so nothing is sent to a server; opening the link shows the item. |
| Reading streaks & tree | Word garden | Reading most of a page counts the day; shows current and longest streaks and a tree that grows with reading days this year. |
| Read aloud | Reading room | Uses a Uyghur system voice when available, otherwise reads the Latin-script text with a close (Turkish) voice, highlighting each word. |
| Offline & install | Whole app | The production build generates a service worker caching every file, plus a web manifest and icons; the browser's install button appears when supported. |

All numbers use Western digits (0–9), as in everyday Uyghur writing.

## More learning, games and everyday features

The playground is grouped into four sections: creativity, language learning, games, and family & daily life.

| Feature | Behavior |
| --- | --- |
| Numbers & clock | Digits → Uyghur words (1234 → بىر مىڭ ئىككى يۈز ئوتتۇز تۆت) with Latin script and listening, number quizzes, and an adjustable clock that tells the time in words. |
| Alphabet book | A picture page for each of the 32 letters: forms, example words, transliteration and listening; mark letters as learned. |
| Word search | Seeded puzzles in three sizes from themed dictionary words or your saved words; drag, tap or keyboard selection, hints and best times. |
| Memory match | Flip-card pairs: picture ↔ word, Arabic ↔ Latin script, Uyghur ↔ English. |
| Family tree | Add relatives and see them by generation with Uyghur kinship terms, a "what do I call…?" helper, regional variants, and PNG export. |
| Mood diary | One entry per day with a mood and tags, a Monday-first month calendar with Uyghur month and weekday names, and a monthly summary. |
| Writing sprint | Timed free writing with prompts, a word goal, a progress ring and an optional no-deleting mode. |
| Word of the day | A daily dictionary word on the home page, in all three scripts. |
| Backup & restore | In the mood menu: save everything to a JSON file and restore it (merge or replace) on any device. Voice recordings are downloaded separately. |

## Classic letters

The letter corner offers ivory, botanical, midnight-gold, and Silk Road stationery, with decorative borders, handwritten UKIJ Qolyazma text, a signature, date, and wax seal. Wording templates cover gratitude, friendship, family, a future self, and formal thanks. Applying a template asks before replacing existing text.

The live preview and image export use the same paper layout. Each page exports at 1200 × 1698 pixels with the local font embedded. Long letters keep every character and paragraph break across up to twelve pages. Excessive blank lines or oversized headings/signatures show a clear error instead of silently losing text. The editor accepts up to 5,000 characters. Download the selected page, save each prepared image from its link, or prepare a ZIP with all pages and click its download link. Phones can also save images from the rendered gallery.

Image sharing uses the device share sheet when the browser supports file sharing on a secure origin. Images are prepared first, then a second user action opens sharing. Otherwise, download the images and attach them in the chosen app. The email action opens a `mailto:` draft with an optional recipient, subject, and the full letter text. Images must be attached manually to email, and the user confirms sending in the mail app. Copying the letter also has a selectable-text fallback. There is no email server or automatic sending. Existing saved letters remain compatible and use ivory stationery when no design was previously saved.

## Browser storage

Saved work and preferences live in versioned localStorage keys (`pichirlash-…-v1`); older notes and favorites retain their existing keys for compatibility. There is no cross-device synchronization. Clearing browser data removes saved creations. Storage errors are shown in the affected feature. The garden records activity labels and local dates only inside this browser.

## Content and fonts

Edit `src/data/content.ts` for the original poems, stories, and learning prompts. The branching story and data validators are in `src/components/play/model.ts`. No third-party literary works are included.

UKIJ Qolyazma Regular is self-hosted in WOFF2 format and used throughout the UI. Noto Naskh Arabic is bundled through Fontsource as a fallback and an optional postcard font. The postcard and letter exporters embed the chosen local font; it does not depend on a remote font service. Font notices are in `public/fonts/`.

## Looseleaf registry

`components.json` registers `@looseleaf`. The interface uses the imported drawing engine, buttons, paper, stickers, mascots, badges, charts, tables, and progress components.

The original shadcn CLI request could not reach the registry through this environment's Node proxy. `scripts/install-looseleaf.py` is the reproducible fallback: it imports published registry JSON directly, resolves dependencies, maps aliases to `src/`, and materializes registry CSS. `looseleaf-registry-manifest.json` records installed items. In a normal environment, add more components with:

```sh
npx shadcn@latest add @looseleaf/sticky-note
```

Looseleaf artwork and drawing components are by Kevin T. Ngo and contributors under MIT; see `LOOSELEAF-LICENSE`. Reference: https://kevintngo.github.io/looseleaf/.

## Verification

`npm test` checks reward idempotency, calendar-day watering, desk geometry, word reordering, storage validation, every reachable story ending, backward-compatible letter storage, Unicode-preserving letter pagination, and encoded email-draft content. The production build also runs TypeScript checks.

Browser QA covered desk dragging and keyboard movement, poetry saving/reordering and postcard handoff, real PNG downloads and exported-image rendering, sealing/opening letters, story completion, garden rewards/watering, focused reading and quote pinning, theme switching, optional sounds, reload persistence, and phone-width desk/garden layouts. The registry's embedded textures and full artwork collections still create large shared JavaScript chunks; the six creative feature screens are loaded on demand.
