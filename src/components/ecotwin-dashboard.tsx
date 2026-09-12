import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CarFront,
  Check,
  CircleGauge,
  CloudOff,
  Gauge,
  Leaf,
  Minus,
  Pause,
  Play,
  Radio,
  RotateCcw,
  SlidersHorizontal,
  TimerReset,
  TrafficCone,
  TrendingDown,
  TrendingUp,
  Wind,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EcoTwinMap } from "@/components/ecotwin-map";
import { MetricCard } from "@/components/metric-card";
import { Button } from "@/components/ui/button";
import { addTimelinePoint, createMockSnapshot, getMockDecision, getMockHotspots, getPollutionBand } from "@/lib/mock-simulation";
import type { SignalPhase, SimulationSnapshot, SimulationStatus, TimelinePoint } from "@/lib/ecotwin-types";
import { getSimulationMode, createSimulationStream, type StreamConnection } from "@/lib/simulation-stream";
import { snapshotToState, stateToSnapshot, type SimulationState } from "@/lib/simulation-contract";

type SignalFilter = "all" | "high-co2" | "long-queue" | "rl";

const initialSnapshot = createMockSnapshot(120, true);
const initialTimeline = Array.from({ length: 18 }, (_, index) =>
  addTimelinePoint(createMockSnapshot(69 + index * 3, true)),
);

const phaseLabel: Record<SignalPhase, string> = {
  NS_GREEN: "N/S green",
  EW_GREEN: "E/W green",
  YELLOW: "Yellow",
  ALL_RED: "All red",
};

const phaseTone: Record<SignalPhase, string> = {
  NS_GREEN: "text-green",
  EW_GREEN: "text-green",
  YELLOW: "text-amber",
  ALL_RED: "text-red",
};

function statusLabel(status: SimulationStatus) {
  if (status === "running") return "RUNNING";
  if (status === "paused") return "PAUSED";
  return "STOPPED";
}

function MetricDelta({ value, positive }: { value: string; positive?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] ${positive ? "text-green" : "text-steel"}`}>
      {positive ? <ArrowDownRight className="size-3" /> : <Minus className="size-3" />}
      {value}
    </span>
  );
}

function PanelHeading({ eyebrow, title, icon: Icon, action }: { eyebrow: string; title: string; icon: typeof Activity; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line/70 px-4 py-3">
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 size-4 text-mint" />
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-steel">{eyebrow}</p>
          <h2 className="mt-1 text-sm font-semibold tracking-tight text-foreground">{title}</h2>
        </div>
      </div>
      {action}
    </div>
  );
}

function EcoTwinDashboard() {
  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(initialSnapshot);
  const [simulationState, setSimulationState] = useState<SimulationState>(() => snapshotToState(initialSnapshot, true));
  const [timeline, setTimeline] = useState<TimelinePoint[]>(initialTimeline);
  const [status, setStatus] = useState<SimulationStatus>("running");
  const [rlControl, setRlControl] = useState(true);
  const [connection, setConnection] = useState<StreamConnection>(getSimulationMode() === "mock" ? "mock" : "connecting");
  const [heatmap, setHeatmap] = useState(true);
  const [vehiclesVisible, setVehiclesVisible] = useState(true);
  const [selectedId, setSelectedId] = useState("INT-05");
  const [signalFilter, setSignalFilter] = useState<SignalFilter>("all");
  const stream = useMemo(() => createSimulationStream(), []);
  const lastTimestampRef = useRef(initialSnapshot.timestamp);

  useEffect(() => {
    const unsubscribeState = stream.subscribe((nextState) => {
      const nextSnapshot = stateToSnapshot(nextState);
      setSimulationState(nextState);
      setSnapshot(nextSnapshot);
      setStatus(nextSnapshot.simulationStatus);
      setRlControl(nextState.rl.enabled);
      if (nextState.timestamp !== lastTimestampRef.current) {
        lastTimestampRef.current = nextState.timestamp;
        setTimeline((points) => [...points.slice(-23), addTimelinePoint(nextSnapshot)]);
      }
    });
    const unsubscribeConnection = stream.subscribeConnection(setConnection);
    stream.start();
    return () => {
      unsubscribeState();
      unsubscribeConnection();
      stream.stop();
    };
  }, [stream]);

  const hotspots = useMemo(() => getMockHotspots(snapshot), [snapshot]);
  const decision = useMemo(() => {
    if (getSimulationMode() === "mock") return getMockDecision(snapshot, rlControl);
    return {
      agent: simulationState.rl.algorithm,
      status: simulationState.rl.status === "DEMO" ? "ACTIVE" as const : simulationState.rl.status,
      objective: "Traffic efficiency + carbon reduction",
      action: simulationState.rl.current_action ?? "Awaiting policy telemetry",
      reason: simulationState.rl.reason ?? "No policy explanation is available yet",
      source: simulationState.rl.source,
    };
  }, [rlControl, simulationState, snapshot]);
  const filteredSignals = useMemo(() => snapshot.signals.filter((signal) => {
    const intersection = snapshot.intersections.find((item) => item.id === signal.id);
    if (!intersection) return false;
    if (signalFilter === "high-co2") return intersection.co2 >= 70;
    if (signalFilter === "long-queue") return intersection.queueLength >= 15;
    if (signalFilter === "rl") return signal.rlControlled;
    return true;
  }), [signalFilter, snapshot]);

  const runCommand = async (command: () => Promise<void>) => {
    try {
      await command();
    } catch {
      setConnection("error");
    }
  };

  const resetSimulation = () => runCommand(async () => {
    await stream.resetSimulation();
    setTimeline(initialTimeline);
    lastTimestampRef.current = 120;
  });

  const toggleRl = () => runCommand(async () => {
    await stream.toggleRl(!rlControl);
  });

  const connectionLabel = connection === "mock" ? "Mock simulation" : connection === "connected" ? "Backend connected" : connection === "connecting" ? "Connecting backend" : "Backend offline";
  const connectionIsHealthy = connection === "mock" || connection === "connected";

  return (
    <main className="min-h-screen bg-ink text-foreground">
      <header className="border-b border-line/80 bg-ink/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg border border-mint/30 bg-mint/10 text-mint"><TrafficCone className="size-5" /></div>
            <div>
              <div className="flex items-center gap-2"><h1 className="text-base font-semibold tracking-tight">EcoTwin</h1><span className="rounded border border-mint/30 bg-mint/10 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.16em] text-mint">COMMAND CENTER</span></div>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-steel">Urban traffic & carbon optimization</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.14em]">
            <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 ${connection === "mock" ? "border-amber/30 bg-amber/10 text-amber" : connectionIsHealthy ? "border-green/30 bg-green/10 text-green" : "border-line bg-ink2/70 text-steel-light"}`}>
              {connection === "mock" ? <Radio className="size-3" /> : connectionIsHealthy ? <Activity className="size-3" /> : <CloudOff className="size-3" />} {connectionLabel}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 ${status === "running" ? "border-green/30 bg-green/10 text-green" : "border-line bg-ink2/70 text-steel-light"}`}><span className={`size-1.5 rounded-full ${status === "running" ? "bg-green" : "bg-steel"}`} />{statusLabel(status)}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1800px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mint">Sector 07 / simulation data</p><p className="mt-1 text-xs text-steel-light">Adaptive signal timing with a replaceable SUMO + PPO data contract.</p></div>
          <div className="flex flex-wrap gap-2">
             <Button variant={status === "running" ? "primary" : "default"} size="sm" onClick={() => runCommand(() => stream.startSimulation())}><Play className="size-3.5" /> Start</Button>
             <Button variant={status === "paused" ? "warning" : "default"} size="sm" onClick={() => runCommand(() => stream.pauseSimulation())}><Pause className="size-3.5" /> Pause</Button>
            <Button variant="default" size="sm" onClick={resetSimulation}><RotateCcw className="size-3.5" /> Reset</Button>
            <Button variant={rlControl ? "active" : "default"} size="sm" aria-pressed={rlControl} onClick={toggleRl}><Bot className="size-3.5" /> RL control {rlControl ? "on" : "off"}</Button>
          </div>

         {(connection === "error" || connection === "disconnected") && (
           <div className="mb-4 flex items-start gap-2.5 border border-amber/30 bg-amber/10 px-3 py-2.5 text-xs text-amber" role="status">
             <AlertTriangle className="mt-0.5 size-4 shrink-0" />
             <span>{connection === "error" ? "Telemetry payload unavailable. Showing the last known state while the connection recovers." : "Backend connection lost. Showing the last known state and retrying automatically."}</span>
           </div>
         )}
        </div>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" aria-label="Live simulation metrics">
          <MetricCard label="Vehicles" value={String(snapshot.metrics.vehicleCount)} unit="veh" note="Simulation Data" icon={CarFront} />
          <MetricCard label="Avg waiting" value={snapshot.metrics.avgWaitingTime.toFixed(1)} unit="sec" note="vs. prior cycle  ↓ 8.4%" icon={TimerReset} tone="mint" />
          <MetricCard label="Network queue" value={String(snapshot.metrics.queueLength)} unit="veh" note="12 intersections" icon={Gauge} tone={snapshot.metrics.queueLength > 125 ? "amber" : "default"} />
          <MetricCard label="CO₂ load" value={snapshot.metrics.totalCo2.toFixed(0)} unit="ppm" note="Simulation Data" icon={Wind} tone={snapshot.metrics.totalCo2 > 600 ? "red" : "amber"} />
          <MetricCard label="RL reward" value={snapshot.metrics.rlReward.toFixed(2)} unit="score" note={rlControl ? "PPO policy active" : "Control standby"} icon={Zap} tone={rlControl ? "mint" : "default"} />
        </section>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.8fr)]">
          <EcoTwinMap snapshot={{ ...snapshot, simulationStatus: status }} selectedId={selectedId} heatmap={heatmap} vehiclesVisible={vehiclesVisible} onSelect={setSelectedId} />
          <section className="glass-panel overflow-hidden rounded-2xl border border-line/80">
            <PanelHeading eyebrow="Environmental intelligence" title="Pollution hotspots" icon={Leaf} action={<span className="font-mono text-[10px] text-steel">TOP 04</span>} />
            <div className="divide-y divide-line/60">
              {hotspots.map((hotspot) => {
                const tone = hotspot.band === "CRITICAL" ? "text-red" : hotspot.band === "HIGH" ? "text-amber" : hotspot.band === "LOW" ? "text-mint" : "text-cyan";
                const TrendIcon = hotspot.trend === "rising" ? TrendingUp : hotspot.trend === "falling" ? TrendingDown : Minus;
                return <div key={hotspot.intersectionId} className="flex items-center gap-3 px-4 py-3">
                  <span className="font-mono text-xs text-steel">0{hotspot.rank}</span>
                  <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="font-mono text-xs font-semibold text-foreground">{hotspot.intersectionId}</span><span className={`font-mono text-[9px] uppercase tracking-wider ${tone}`}>{hotspot.band}</span></div><div className="mt-1 font-mono text-[10px] text-steel">Queue {hotspot.queueLength} veh · wait {hotspot.waitingTime.toFixed(1)}s</div></div>
                  <div className="text-right"><div className={`font-mono text-sm font-semibold ${tone}`}>{hotspot.co2}<span className="ml-1 text-[9px] font-normal text-steel">ppm</span></div><div className={`mt-1 flex items-center justify-end gap-1 font-mono text-[9px] uppercase ${tone}`}><TrendIcon className="size-3" />{hotspot.trend}</div></div>
                  <Button variant="ghost" size="icon" aria-label={`Focus ${hotspot.intersectionId}`} onClick={() => setSelectedId(hotspot.intersectionId)}><ArrowUpRight className="size-3.5" /></Button>
                </div>;
              })}
            </div>
          </section>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
          <section className="glass-panel overflow-hidden rounded-2xl border border-line/80">
            <PanelHeading eyebrow="Intersection control" title="Traffic signals" icon={Activity} action={<span className="font-mono text-[10px] text-steel">{filteredSignals.length} / {snapshot.signals.length}</span>} />
            <div className="flex flex-wrap gap-1.5 border-b border-line/60 px-4 py-3">
              {(["all", "high-co2", "long-queue", "rl"] as const).map((filter) => <Button key={filter} size="sm" variant={signalFilter === filter ? "active" : "ghost"} onClick={() => setSignalFilter(filter)}>{filter === "all" ? "All signals" : filter === "high-co2" ? "High CO₂" : filter === "long-queue" ? "Long queue" : "RL controlled"}</Button>)}
            </div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[680px] text-left font-mono text-[10px]">
                <thead className="border-b border-line/60 bg-ink2/40 text-[9px] uppercase tracking-[0.16em] text-steel"><tr><th className="px-4 py-2.5 font-medium">Intersection</th><th className="px-3 py-2.5 font-medium">N/S</th><th className="px-3 py-2.5 font-medium">E/W</th><th className="px-3 py-2.5 font-medium">Phase</th><th className="px-3 py-2.5 font-medium">Remaining</th><th className="px-3 py-2.5 font-medium">Queue</th><th className="px-3 py-2.5 font-medium">CO₂</th><th className="px-4 py-2.5 font-medium">Mode</th></tr></thead>
                <tbody className="divide-y divide-line/50">{filteredSignals.map((signal) => { const intersection = snapshot.intersections.find((item) => item.id === signal.id); if (!intersection) return null; return <tr key={signal.id} className="transition-colors hover:bg-frost/30"><td className="px-4 py-3 font-semibold text-foreground">{signal.id}</td><td className={signal.ns === "GREEN" ? "px-3 py-3 text-green" : signal.ns === "YELLOW" ? "px-3 py-3 text-amber" : "px-3 py-3 text-steel"}>{signal.ns}</td><td className={signal.ew === "GREEN" ? "px-3 py-3 text-green" : signal.ew === "YELLOW" ? "px-3 py-3 text-amber" : "px-3 py-3 text-steel"}>{signal.ew}</td><td className={`px-3 py-3 ${phaseTone[signal.phase]}`}>{phaseLabel[signal.phase]}</td><td className="px-3 py-3 text-steel-light">{signal.remaining}s</td><td className="px-3 py-3 text-steel-light">{intersection.queueLength}</td><td className={getPollutionBand(intersection.co2) === "CRITICAL" ? "px-3 py-3 text-red" : "px-3 py-3 text-amber"}>{intersection.co2}</td><td className="px-4 py-3">{signal.rlControlled ? <span className="inline-flex items-center gap-1 text-mint"><Check className="size-3" /> RL</span> : <span className="text-steel">Fixed</span>}</td></tr>; })}</tbody>
              </table>
            </div>
          </section>

          <section className="glass-panel overflow-hidden rounded-2xl border border-line/80">
            <PanelHeading eyebrow="Policy telemetry" title="RL intelligence" icon={Bot} action={<span className={`rounded px-1.5 py-1 font-mono text-[9px] uppercase tracking-wider ${decision.status === "ACTIVE" ? "bg-mint/10 text-mint" : "bg-line/50 text-steel"}`}>{decision.status}</span>} />
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between border-b border-line/60 pb-3"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-steel">Agent</p><p className="mt-1 text-sm font-semibold">{decision.agent} policy</p></div><span className="flex size-9 items-center justify-center rounded-lg border border-mint/25 bg-mint/10 text-mint"><Bot className="size-4" /></span></div>
              <div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-steel">Objective</p><p className="mt-1 text-xs text-steel-light">{decision.objective}</p></div>
              <div className="rounded-lg border border-mint/20 bg-mint/5 p-3"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-mint">Current action</p><p className="mt-1 text-sm font-medium text-foreground">{decision.action}</p></div>
              <div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-steel">Demo explanation</p><p className="mt-1 text-xs leading-5 text-steel-light">{decision.reason}</p></div>
               <div className="flex items-center justify-between border-t border-line/60 pt-3 font-mono text-[10px]"><span className="text-steel">Source</span><span className={decision.source === "mock" ? "text-amber" : "text-mint"}>{decision.source === "mock" ? "MOCK POLICY OUTPUT" : "BACKEND POLICY OUTPUT"}</span></div>
            </div>
          </section>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.6fr)]">
          <section className="glass-panel overflow-hidden rounded-2xl border border-line/80">
            <PanelHeading eyebrow="Historical stream" title="Simulation timeline" icon={CircleGauge} action={<span className="font-mono text-[10px] text-steel">{timeline.length} points</span>} />
            <div className="h-[250px] p-3 sm:h-[290px] sm:p-4"><ResponsiveContainer width="100%" height="100%"><LineChart data={timeline} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}><CartesianGrid stroke="var(--color-line)" strokeDasharray="3 4" vertical={false} /><XAxis dataKey="time" tick={{ fill: "var(--color-steel)", fontSize: 9, fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} tickFormatter={(value: number) => `${value}s`} /><YAxis tick={{ fill: "var(--color-steel)", fontSize: 9, fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: "var(--color-ink2)", border: "1px solid var(--color-line)", borderRadius: "8px", fontFamily: "var(--font-mono)", fontSize: "10px" }} labelFormatter={(value) => `Simulation ${value}s`} /><Line type="monotone" dataKey="vehicles" name="Vehicles" stroke="var(--color-cyan)" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="co2" name="CO₂" stroke="var(--color-amber)" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="wait" name="Avg wait" stroke="var(--color-mint)" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>
            <div className="flex flex-wrap gap-4 border-t border-line/60 px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider text-steel"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-cyan" /> Vehicles</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber" /> CO₂ load</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-mint" /> Avg wait</span></div>
          </section>

          <section className="glass-panel overflow-hidden rounded-2xl border border-line/80">
            <PanelHeading eyebrow="Evaluation status" title="Baseline vs PPO" icon={SlidersHorizontal} action={<span className="font-mono text-[9px] uppercase tracking-wider text-steel">Not evaluated</span>} />
            <div className="p-4"><div className="rounded-lg border border-line bg-ink2/50 p-4"><div className="flex items-start gap-3"><div className="grid size-8 place-items-center rounded-md border border-line bg-ink text-steel"><Activity className="size-4" /></div><div><p className="text-sm font-medium">No evaluation yet</p><p className="mt-1 text-xs leading-5 text-steel-light">A baseline run and PPO run are required before comparative performance metrics can be shown.</p></div></div></div><div className="mt-4 grid grid-cols-2 gap-2">{["Waiting time", "Total CO₂", "Queue length", "Throughput"].map((label) => <div key={label} className="border-t border-line/60 pt-2"><p className="font-mono text-[9px] uppercase tracking-wider text-steel">{label}</p><p className="mt-1 font-mono text-sm text-steel">—</p></div>)}</div><p className="mt-4 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-amber"><TimerReset className="size-3" /> Awaiting controlled experiment</p></div>
          </section>
        </div>

        <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 py-4 font-mono text-[9px] uppercase tracking-[0.16em] text-steel">
          <div className="flex items-center gap-3"><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-mint" /> Data stream nominal</span><span>Tick {snapshot.timestamp}s</span><span>Grid 7 / 12 nodes</span></div>
          <div className="flex items-center gap-1.5"><Zap className="size-3 text-amber" /> Replaceable backend contract</div>
        </footer>
      </div>
    </main>
  );
}

export { EcoTwinDashboard };