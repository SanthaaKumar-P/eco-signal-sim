import { Crosshair, Minus, Plus, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Intersection, SimulationSnapshot } from "@/lib/ecotwin-types";

interface EcoTwinMapProps {
  snapshot: SimulationSnapshot;
  selectedId: string;
  heatmap: boolean;
  vehiclesVisible: boolean;
  onSelect: (id: string) => void;
}

const signalTone = (intersection: Intersection, snapshot: SimulationSnapshot) => {
  const signal = snapshot.signals.find((item) => item.id === intersection.id);
  if (signal?.phase === "YELLOW") return "border-amber bg-amber";
  if (signal?.phase === "EW_GREEN" || signal?.phase === "NS_GREEN") return "border-green bg-green";
  return "border-red bg-red";
};

export function EcoTwinMap({ snapshot, selectedId, heatmap, vehiclesVisible, onSelect }: EcoTwinMapProps) {
  const [zoom, setZoom] = useState(1);
  const selected = snapshot.intersections.find((item) => item.id === selectedId) ?? snapshot.intersections[0];

  return (
    <section className="glass-panel flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-line/80 xl:min-h-[650px]" aria-label="Live city simulation map">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Live City Simulation</h2>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-steel">
            Grid sector 7 · 12 intersections · Simulation Data
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] text-steel-light" aria-label="Signal legend">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-green" />Green</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber" />Yellow</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-red" />Red</span>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden bg-ink2/60">
        <div className="map-grid absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: "center" }} />
        {heatmap && <>
          <div className="absolute left-[62%] top-[34%] size-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red/20 blur-3xl" />
          <div className="absolute left-[50%] top-[58%] size-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber/18 blur-3xl" />
          <div className="absolute left-[18%] top-[28%] size-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint/12 blur-3xl" />
        </>}

        <div className="absolute left-[10%] right-[10%] top-[28%] h-2 rounded bg-line/90" />
        <div className="absolute left-[10%] right-[10%] top-[58%] h-2 rounded bg-line/90" />
        <div className="absolute left-[10%] right-[10%] top-[82%] h-1.5 rounded bg-line/70" />
        <div className="absolute bottom-[14%] left-[18%] top-[12%] w-2 rounded bg-line/90" />
        <div className="absolute bottom-[14%] left-[50%] top-[12%] w-2 rounded bg-line/90" />
        <div className="absolute bottom-[14%] left-[82%] top-[12%] w-2 rounded bg-line/90" />

        {vehiclesVisible && snapshot.vehicles.map((vehicle) => (
          <span
            key={vehicle.id}
            className={`vehicle-drift absolute size-2 rounded-full ${vehicle.speed > 12 ? "bg-cyan" : "bg-mint"}`}
            style={{ left: `${vehicle.x}%`, top: `${vehicle.y}%`, animationDelay: `${Number(vehicle.id.slice(-2)) * -80}ms` }}
            title={`${vehicle.id} · ${vehicle.speed} m/s`}
          />
        ))}

        {snapshot.intersections.map((intersection) => {
          const selectedState = selected?.id === intersection.id;
          return (
            <button
              key={intersection.id}
              type="button"
              aria-label={`Select ${intersection.id}`}
              onClick={() => onSelect(intersection.id)}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-1 outline-none focus-visible:ring-2 focus-visible:ring-mint"
              style={{ left: `${intersection.x}%`, top: `${intersection.y}%` }}
            >
              <span className={`grid size-8 place-items-center rounded-full border-2 bg-ink ${signalTone(intersection, snapshot)} ${selectedState ? "pulse-ring size-11" : ""}`}>
                <span className={`size-2.5 rounded-full ${signalTone(intersection, snapshot).split(" ")[1]}`} />
              </span>
            </button>
          );
        })}

        {selected && <div className="absolute bottom-4 right-4 w-[min(300px,calc(100%-2rem))] rounded-xl border border-mint/30 bg-frost/90 p-4 shadow-2xl" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-sm font-bold text-foreground">{selected.id}</span>
            <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider ${selected.co2 >= 90 ? "bg-red/15 text-red" : selected.co2 >= 70 ? "bg-amber/15 text-amber" : "bg-mint/15 text-mint"}`}>
              {selected.co2 >= 90 ? "Critical" : selected.co2 >= 70 ? "High" : "Moderate"}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-[11px]">
            <div><div className="text-[9px] uppercase tracking-wider text-steel">Phase</div><div className="text-steel-light">{snapshot.signals.find((signal) => signal.id === selected.id)?.phase ?? "—"}</div></div>
            <div><div className="text-[9px] uppercase tracking-wider text-steel">Waiting</div><div className="text-steel-light">{selected.queueLength} veh</div></div>
            <div><div className="text-[9px] uppercase tracking-wider text-steel">Queue</div><div className="text-steel-light">{selected.queueLength * 2} m</div></div>
            <div><div className="text-[9px] uppercase tracking-wider text-steel">Avg Wait</div><div className="text-steel-light">{selected.waitingTime.toFixed(1)} s</div></div>
            <div><div className="text-[9px] uppercase tracking-wider text-steel">CO₂</div><div className="text-red">{selected.co2.toFixed(1)} ppm</div></div>
            <div><div className="text-[9px] uppercase tracking-wider text-steel">RL Action</div><div className="text-mint">{selected.rlAction === "Maintain cycle" ? "Maintain" : "Extend EW"}</div></div>
          </div>
        </div>}

        <div className="absolute bottom-4 left-4 rounded-lg border border-line bg-ink/90 px-3 py-2 backdrop-blur-md">
          <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-steel">CO₂ Concentration</div>
          <div className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-mint" /><span className="size-3 rounded-sm bg-cyan" /><span className="size-3 rounded-sm bg-amber" /><span className="size-3 rounded-sm bg-red" /><span className="ml-1 font-mono text-[9px] text-steel-light">Low → Critical</span></div>
        </div>

        <div className="absolute right-4 top-4 flex flex-col gap-1 rounded-lg border border-line bg-ink/80 p-1 backdrop-blur-md">
          <Button type="button" variant="ghost" size="icon" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(1.35, value + 0.1))}><Plus className="size-4" /></Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Reset map view" onClick={() => setZoom(1)}><RotateCcw className="size-3.5" /></Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(0.85, value - 0.1))}><Minus className="size-4" /></Button>
        </div>
        <div className="absolute left-4 top-4 rounded-lg border border-line bg-ink/80 px-2.5 py-1.5 font-mono text-[10px] text-steel-light backdrop-blur-md">
          sim {snapshot.timestamp}s · {Math.round(zoom * 100)}% view
        </div>
      </div>
    </section>
  );
}
