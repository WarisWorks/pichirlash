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
