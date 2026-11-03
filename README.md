# پىچىرلاش · Pichirlash

A small, warm Uyghur notebook: original poems, short stories, learning prompts, favorites, and private notes. Built with React 19, TypeScript, Vite, Tailwind CSS 4, and real Looseleaf registry components and illustration assets.

## Run

```sh
npm ci
npm run dev
```

```sh
npm run build
npm run preview
```

Deploy as a Vite static project: build command `npm run build`, output directory `dist`. No environment variables or backend are required. Fonts are bundled locally through Fontsource. The upstream drawing engine may load its optional Kevin Sans stylesheet; Uyghur text uses Noto Naskh Arabic.

## Features

- Uyghur Arabic script, right-to-left layout, responsive desktop and mobile design.
- Six original pieces organized by poetry, stories, and learning.
- Search, full reading dialogs, and persistent favorites.
- Create, edit, and delete private notes with five paper colors.
- Notes and favorites stay in this browser's localStorage; they do not sync across devices. Clearing browser data removes them.
- Icon-only Lucide footer links with accessible names for Instagram, X, YouTube, Idirak, and Ko-fi.
- Keyboard-friendly controls, native modal focus handling, and reduced-motion support.

## Looseleaf registry

`components.json` registers `@looseleaf`. The imported Button and Sticker components and InkProvider are used in the interface. Paper, tape, dialog, doodle and mascot components are also installed for future expansion, alongside the complete sticker, doodle, mascot, scene, prop, and icon collections supplied by their registry items.

The shadcn CLI could not reach the registry through this environment's Node proxy. `scripts/install-looseleaf.py` imports the published registry JSON files directly, recursively resolves their dependencies, maps aliases to `src/`, and materializes the registry CSS. `looseleaf-registry-manifest.json` records installed items. To install additional components in a normal environment:

```sh
npx shadcn@latest add @looseleaf/sticky-note
```

Looseleaf artwork and drawing components are by Kevin T. Ngo under the MIT license; see `LOOSELEAF-LICENSE`. Reference: https://kevintngo.github.io/looseleaf/.

## Content

Edit `src/data/content.ts` to change the original Uyghur poems, stories, and learning prompts. Edit footer links in `src/App.tsx`. No third-party literary works are included.

## Frontend demo studio

The top navigation switches between reading, a writing studio, and the art library. The studio supports creating and editing poetry, stories and learning posts, drafts, demo publication, deletion, paper colors and a live preview. Drafts are excluded from the reading feed. Changes stay in `pichirlash-library-v1` in localStorage; demo publication never sends content to a server.

The art library exposes all 333 installed assets: 96 stickers, 48 doodles, 15 mascot poses, 14 scenes and 160 icons. It has category filters and pagination; selecting artwork opens a decorated post in the studio. The icon-only social footer is preserved.

Validation: production TypeScript/build passed; browser checks covered gallery selection, creating a decorated post, editing it, and saving it as a draft. Accounts and shared database storage are intentionally deferred.

## Expanded notebook sections

The reading page includes a persistent mood picker, rotating writing prompts on Looseleaf Paper, an encouragement card, native Looseleaf bar/line charts with labeled demo data, a task table with persistent checkmarks and progress, and an interactive idea map. Hero paper, stickers and accents use gentle CSS motion; reduced-motion preferences disable it.

UKIJ Qolyazma Regular is self-hosted in WOFF2 format and used throughout the UI. Its family, Regular style, LGPL metadata and Uyghur glyph coverage were verified against the source TTF. Source and distribution notices are in `public/fonts/`.
