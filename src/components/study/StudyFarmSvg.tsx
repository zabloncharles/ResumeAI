import { useEffect, useId, useMemo, useRef } from "react";
import farmSvg from "../../assets/study-farmland.svg?raw";

export type FarmLayerId =
  | "layerSubsurface"
  | "layerSurface"
  | "layerGrid"
  | "layerWater"
  | "layerCrops"
  | "layerStructures"
  | "layerFarmhouse"
  | "layerLivestock"
  | "layerTrees";

export type FarmStageId =
  | "empty"
  | "seeds"
  | "sprouts"
  | "pasture"
  | "homestead"
  | "harvest";

const STAGE_LAYERS: Record<FarmStageId, FarmLayerId[]> = {
  empty: ["layerSubsurface", "layerSurface"],
  seeds: ["layerSubsurface", "layerSurface", "layerGrid", "layerWater"],
  sprouts: [
    "layerSubsurface",
    "layerSurface",
    "layerGrid",
    "layerWater",
    "layerCrops",
  ],
  pasture: [
    "layerSubsurface",
    "layerSurface",
    "layerWater",
    "layerCrops",
    "layerLivestock",
  ],
  homestead: [
    "layerSubsurface",
    "layerSurface",
    "layerWater",
    "layerCrops",
    "layerLivestock",
    "layerStructures",
    "layerFarmhouse",
  ],
  harvest: [
    "layerSubsurface",
    "layerSurface",
    "layerWater",
    "layerCrops",
    "layerLivestock",
    "layerStructures",
    "layerFarmhouse",
    "layerTrees",
  ],
};

const ALL_TOGGLE_LAYERS: FarmLayerId[] = [
  "layerSubsurface",
  "layerSurface",
  "layerGrid",
  "layerWater",
  "layerCrops",
  "layerStructures",
  "layerFarmhouse",
  "layerLivestock",
  "layerTrees",
];

type StudyFarmSvgProps = {
  stageId: FarmStageId;
  className?: string;
};

function scopeSvgIds(markup: string, prefix: string) {
  const idAttrs = Array.from(
    markup.matchAll(/\bid="([^"]+)"/g),
    (m) => m[1]
  );
  const unique = [...new Set(idAttrs)].sort((a, b) => b.length - a.length);
  let next = markup;
  for (const id of unique) {
    const scoped = `${prefix}${id}`;
    next = next.split(`id="${id}"`).join(`id="${scoped}"`);
    next = next.split(`url(#${id})`).join(`url(#${scoped})`);
  }
  return next;
}

export default function StudyFarmSvg({
  stageId,
  className = "",
}: StudyFarmSvgProps) {
  const reactId = useId().replace(/:/g, "");
  const prefix = `farm-${reactId}-`;
  const hostRef = useRef<HTMLDivElement | null>(null);
  const markup = useMemo(() => scopeSvgIds(farmSvg, prefix), [prefix]);
  const visible = STAGE_LAYERS[stageId];

  useEffect(() => {
    const root = hostRef.current;
    if (!root) return;
    for (const layerId of ALL_TOGGLE_LAYERS) {
      const el = root.querySelector<SVGGElement>(`#${prefix}${layerId}`);
      if (!el) continue;
      const on = visible.includes(layerId);
      el.style.transition = "opacity 0.55s ease";
      el.style.opacity = on ? "1" : "0";
      el.style.pointerEvents = on ? "auto" : "none";
    }
  }, [prefix, visible]);

  return (
    <div
      ref={hostRef}
      className={`study-farmland-host bg-[#09090b] ${className}`}
      dangerouslySetInnerHTML={{ __html: markup }}
      aria-hidden
    />
  );
}
