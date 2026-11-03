# پىچىرلاش · Pichirlash

A cozy Uyghur reading and creative playground. React 19, TypeScript, Vite, Tailwind CSS 4, Lucide, and real Looseleaf registry components and artwork. The entire experience is a frontend demo; no accounts, server, or environment variables are required.

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
| Letter corner     | Write drafts, choose stationery and a stamp, seal a letter, animate its opening, reread it, and edit it again. Letters are never sent.                                                                                                                                             |
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

## Browser storage

Saved work and preferences live in versioned localStorage keys (`pichirlash-…-v1`); older notes and favorites retain their existing keys for compatibility. There is no cross-device synchronization. Clearing browser data removes saved creations. Storage errors are shown in the affected feature. The garden records activity labels and local dates only inside this browser.

## Content and fonts

Edit `src/data/content.ts` for the original poems, stories, and learning prompts. The branching story and data validators are in `src/components/play/model.ts`. No third-party literary works are included.

UKIJ Qolyazma Regular is self-hosted in WOFF2 format and used throughout the UI. Noto Naskh Arabic is bundled through Fontsource as a fallback and an optional postcard font. The postcard exporter embeds the chosen local font; it does not depend on a remote font service. Font notices are in `public/fonts/`.

## Looseleaf registry

`components.json` registers `@looseleaf`. The interface uses the imported drawing engine, buttons, paper, stickers, mascots, badges, charts, tables, and progress components.

The original shadcn CLI request could not reach the registry through this environment's Node proxy. `scripts/install-looseleaf.py` is the reproducible fallback: it imports published registry JSON directly, resolves dependencies, maps aliases to `src/`, and materializes registry CSS. `looseleaf-registry-manifest.json` records installed items. In a normal environment, add more components with:

```sh
npx shadcn@latest add @looseleaf/sticky-note
```

Looseleaf artwork and drawing components are by Kevin T. Ngo and contributors under MIT; see `LOOSELEAF-LICENSE`. Reference: https://kevintngo.github.io/looseleaf/.

## Verification

`npm test` checks reward idempotency, calendar-day watering, desk geometry, word reordering, storage validation, and every reachable story ending. The production build also runs TypeScript checks.

Browser QA covered desk dragging and keyboard movement, poetry saving/reordering and postcard handoff, real PNG downloads and exported-image rendering, sealing/opening letters, story completion, garden rewards/watering, focused reading and quote pinning, theme switching, optional sounds, reload persistence, and phone-width desk/garden layouts. The registry's embedded textures and full artwork collections still create large shared JavaScript chunks; the six creative feature screens are loaded on demand.
