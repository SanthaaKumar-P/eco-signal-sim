import type {
  Hotspot,
  Intersection,
  RlDecision,
  Signal,
  SimulationSnapshot,
  TimelinePoint,
  Vehicle,
} from "@/lib/ecotwin-types";

const intersectionLayout = [
  [18, 28], [50, 28], [82, 28],
  [18, 58], [50, 58], [82, 58],
  [18, 82], [50, 82], [82, 82],
] as const;

const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

export const getPollutionBand = (co2: number): Hotspot["band"] => {
  if (co2 >= 90) return "CRITICAL";
  if (co2 >= 70) return "HIGH";
  if (co2 >= 40) return "MODERATE";
  return "LOW";
};

export function createMockSnapshot(timestamp = 120, rlControl = true): SimulationSnapshot {
  const intersections: Intersection[] = intersectionLayout.map(([x, y], index) => {
    const wave = Math.sin(timestamp / 18 + index * 0.82);
    const queueLength = Math.max(3, Math.round(10 + wave * 7 + (index === 4 ? 9 : 0)));
    const co2 = Math.max(26, Math.round(42 + queueLength * 2.3 + Math.sin(timestamp / 13 + index) * 8));
    return {
      id: `INT-${String(index + 1).padStart(2, "0")}`,
      x,
      y,
      queueLength,
      waitingTime: Number((queueLength * 1.55 + 6 + Math.abs(wave) * 5).toFixed(1)),
      co2,
      rlAction: rlControl && queueLength > 14 ? "Extend EW green phase" : "Maintain cycle",
    };
  });

  const vehicles: Vehicle[] = Array.from({ length: 34 }, (_, index) => {
    const horizontal = index % 2 === 0;
    const lane = horizontal ? (index % 3 === 0 ? 28 : index % 3 === 1 ? 58 : 82) : (index % 3 === 0 ? 18 : index % 3 === 1 ? 50 : 82);
    const drift = (timestamp * (0.8 + (index % 4) * 0.12) + seeded(index) * 100) % 100;
    return {
      id: `veh_${String(index + 1).padStart(3, "0")}`,
      x: horizontal ? drift : lane,
      y: horizontal ? lane : (100 - drift),
      speed: Number((8 + (index % 6) * 1.4).toFixed(1)),
      heading: horizontal ? "horizontal" : "vertical",
    };
  });

  const signals: Signal[] = intersections.map((intersection, index) => {
    const phaseIndex = Math.floor(timestamp / 12 + index) % 4;
    const phase = (["NS_GREEN", "EW_GREEN", "YELLOW", "ALL_RED"] as const)[phaseIndex] ?? "NS_GREEN";
    return {
      id: intersection.id,
      phase,
      remaining: 12 - (timestamp % 12),
      ns: phase === "NS_GREEN" ? "GREEN" : phase === "YELLOW" ? "YELLOW" : "RED",
      ew: phase === "EW_GREEN" ? "GREEN" : phase === "YELLOW" ? "YELLOW" : "RED",
      rlControlled: rlControl && index % 3 !== 2,
    };
  });

  const queueLength = intersections.reduce((sum, item) => sum + item.queueLength, 0);
  const totalCo2 = intersections.reduce((sum, item) => sum + item.co2, 0);
  return {
    timestamp,
    simulationStatus: "running",
    vehicles,
    signals,
    intersections,
    metrics: {
      vehicleCount: vehicles.length + Math.round(84 + Math.sin(timestamp / 20) * 8),
      avgWaitingTime: Number((intersections.reduce((sum, item) => sum + item.waitingTime, 0) / intersections.length).toFixed(1)),
      queueLength,
      totalCo2: Number((totalCo2 * 0.72).toFixed(1)),
      rlReward: Number((0.58 + Math.sin(timestamp / 28) * 0.12 + (rlControl ? 0.08 : 0)).toFixed(2)),
    },
  };
}

export function getMockHotspots(snapshot: SimulationSnapshot): Hotspot[] {
  return snapshot.intersections
    .map((intersection) => ({
      intersectionId: intersection.id,
      co2: intersection.co2,
      queueLength: intersection.queueLength,
      waitingTime: intersection.waitingTime,
      trend: intersection.co2 > 76 ? "rising" : intersection.co2 < 48 ? "falling" : "stable",
      band: getPollutionBand(intersection.co2),
      rank: 0,
    } as Hotspot))
    .sort((a, b) => b.co2 - a.co2)
    .slice(0, 4)
    .map((hotspot, index) => ({ ...hotspot, rank: index + 1 }));
}

export function getMockDecision(snapshot: SimulationSnapshot, enabled: boolean): RlDecision {
  const focus = [...snapshot.intersections].sort((a, b) => b.co2 - a.co2)[0];
  if (!focus) {
    return {
      agent: "PPO",
      status: enabled ? "ACTIVE" : "STANDBY",
      objective: "Traffic efficiency + carbon reduction",
      action: "Awaiting intersection telemetry",
      reason: "No intersection data is available yet",
      source: "mock",
    };
  }
  const action = enabled && focus.queueLength > 14 ? "Extend East–West green phase" : "Monitor current cycle";
  return {
    agent: "PPO",
    status: enabled ? "ACTIVE" : "STANDBY",
    objective: "Traffic efficiency + carbon reduction",
    action,
    reason: enabled && focus.queueLength > 14 ? `High queue and elevated CO₂ detected at ${focus.id}` : "RL control is waiting for an active control signal",
    source: "mock",
  };
}

export function addTimelinePoint(snapshot: SimulationSnapshot): TimelinePoint {
  return {
    time: snapshot.timestamp,
    vehicles: snapshot.metrics.vehicleCount,
    co2: snapshot.metrics.totalCo2,
    wait: snapshot.metrics.avgWaitingTime,
    reward: snapshot.metrics.rlReward,
  };
}
