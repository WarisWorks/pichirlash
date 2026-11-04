import * as React from "react"

import { inkViewBox } from "@/lib/ink/builder"
import type { Frame } from "@/lib/ink/react/cache"
import { localizeGrainMasks, stableId } from "@/lib/ink/local-grain"

export function InkSvg({ kind, frame, still, ref }: { kind: string; frame: Frame | null; still?: boolean; ref?: React.Ref<SVGSVGElement> }) {
  const pad = frame?.pad ?? 0
  // Grain masks sized to this drawing's box (plus its overflow pad and a margin),
  // not the shared 8192 px region (see local-grain.ts). The id prefix comes from
  // the frame's cache key (not useId, which would shift other components' seeds);
  // identical frames produce identical masks, so a shared id is harmless.
  const parts = React.useMemo(() => {
    if (!frame) return null
    const prefix = `ll-i${stableId(frame.key)}`
    const m = frame.pad + 24
    const region = { x: -m, y: -m, width: frame.w + 2 * m, height: frame.h + 2 * m }
    const out: Partial<Record<string, string>> = {}
    for (const name of frame.layers) out[name] = localizeGrainMasks(frame.parts[name] ?? "", region, `${prefix}-${name}`)
    return out
  }, [frame])
  return (
    <svg
      ref={ref}
      data-ink={kind}
      data-still={still ? "" : undefined}
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute"
      viewBox={frame ? inkViewBox(frame) : undefined}
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        pointerEvents: "none",
        left: -pad,
        top: -pad,
        width: `calc(100% + ${2 * pad}px)`,
        height: `calc(100% + ${2 * pad}px)`,
        overflow: "visible",
        zIndex: -1,
      }}
    >
      {frame?.layers.map((name) => (
        <g key={name} data-layer={name} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: parts?.[name] ?? "" }} />
      ))}
    </svg>
  )
}
