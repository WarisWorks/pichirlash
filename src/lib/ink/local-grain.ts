import { MASK_IDS } from '@/lib/ink/builder'

/**
 * The shared grain masks (`#ll-felt-0` …) use a fixed 8192 × 8192 user-space
 * region so they work for any drawing. Chrome sizes the visual bounds of every
 * masked group by that region, so each sticker, button outline or underline
 * painted — and, when animated, composited — as an 8192 px surface. That made
 * rasterisation (and the sticker drop-shadow filters on top) extremely
 * expensive: seconds of raster work per interaction and constant re-raster
 * while the hero animations ran.
 *
 * When the drawing's box is known we point each grain reference at a local mask
 * whose region is that box. The mask still fills from the same shared pattern,
 * in the same user space, so the grain texture is unchanged.
 */
const GRAIN_REF = new RegExp(`mask="url\\(#(${MASK_IDS.join('|')})\\)"`, 'g')

export interface MaskRegion {
  x: number
  y: number
  width: number
  height: number
}

/** Rewrite grain mask references in `svg` to local masks clipped to `region`. */
export function localizeGrainMasks(svg: string, region: MaskRegion, prefix: string): string {
  const used = new Set<string>()
  const body = svg.replace(GRAIN_REF, (_, id: string) => {
    used.add(id)
    return `mask="url(#${prefix}-${id})"`
  })
  if (!used.size) return svg
  const x = Math.floor(region.x),
    y = Math.floor(region.y),
    width = Math.ceil(region.width),
    height = Math.ceil(region.height)
  let defs = ''
  for (const id of used) {
    const pattern = id.replace(/-(\d+)$/, '-pat-$1')
    defs += `<mask id="${prefix}-${id}" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${width}" height="${height}"><rect x="${x}" y="${y}" width="${width}" height="${height}" fill="url(#${pattern})"/></mask>`
  }
  return `<defs>${defs}</defs>${body}`
}

/** Region for self-contained art drawn on a `w × h` canvas, padded by the canvas size for peel and overflow. */
export function artRegion(w: number, h: number): MaskRegion {
  const pad = Math.max(w, h)
  return { x: -pad, y: -pad, width: w + 2 * pad, height: h + 2 * pad }
}

/** A short, stable id fragment for memoised art shared between instances. */
export function stableId(key: string): string {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619)
  return (h >>> 0).toString(36)
}
