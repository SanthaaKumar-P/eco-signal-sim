import { z } from "zod";

import type {
  Intersection,
  Metrics,
  Signal,
  SimulationSnapshot,
  Vehicle,
} from "@/lib/ecotwin-types";

export type SimulationStatus = "running" | "paused" | "stopped" | "error";

export interface VehicleState {
  id: string;
  x: number;
  y: number;
  speed: number;
  waiting_time: number;
  heading: "horizontal" | "vertical";
}

export interface TrafficSignalState {
  id: string;
  phase: string;
  state: string;
  remaining_seconds: number;
  ns: "GREEN" | "YELLOW" | "RED";
  ew: "GREEN" | "YELLOW" | "RED";
  rl_controlled: boolean;
}

export interface IntersectionState {
  id: string;
  x: number;
  y: number;
  queue_length: number;
  waiting_time: number;
  co2: number;
  pollution_level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  rl_action: string;
}

export interface PollutionCell {
  id: string;
  x: number;
  y: number;
  co2: number;
  pollution_level: IntersectionState["pollution_level"];
}

export interface SimulationMetrics {
  vehicle_count: number;
  avg_waiting_time: number;
  total_co2: number;
  avg_queue_length: number;
  throughput: number;
  rl_reward: number;
}

export interface RLAction {
  enabled: boolean;
  algorithm: "PPO";
  framework: "RLlib";
  current_action: string | null;
  reason: string | null;
  status: "ACTIVE" | "STANDBY" | "DEMO";
  source: "mock" | "backend";
}

export interface SimulationState {
  timestamp: number;
  simulation_status: SimulationStatus;
  vehicles: VehicleState[];
  signals: TrafficSignalState[];
  intersections: IntersectionState[];
  pollution_cells: PollutionCell[];
  metrics: SimulationMetrics;
  rl: RLAction;
}

const numberValue = z.number().finite();
const pollutionLevel = z.enum(["LOW", "MODERATE", "HIGH", "CRITICAL"]);

export const simulationStateSchema = z.object({
  timestamp: numberValue,
  simulation_status: z.enum(["running", "paused", "stopped", "error"]),
  vehicles: z.array(z.object({
    id: z.string(), x: numberValue, y: numberValue, speed: numberValue,
    waiting_time: numberValue, heading: z.enum(["horizontal", "vertical"]),
  })),
  signals: z.array(z.object({
    id: z.string(), phase: z.string(), state: z.string(), remaining_seconds: numberValue,
    ns: z.enum(["GREEN", "YELLOW", "RED"]), ew: z.enum(["GREEN", "YELLOW", "RED"]),
    rl_controlled: z.boolean(),
  })),
  intersections: z.array(z.object({
    id: z.string(), x: numberValue, y: numberValue, queue_length: numberValue,
    waiting_time: numberValue, co2: numberValue, pollution_level: pollutionLevel, rl_action: z.string(),
  })),
  pollution_cells: z.array(z.object({
    id: z.string(), x: numberValue, y: numberValue, co2: numberValue, pollution_level: pollutionLevel,
  })),
  metrics: z.object({
    vehicle_count: numberValue, avg_waiting_time: numberValue, total_co2: numberValue,
    avg_queue_length: numberValue, throughput: numberValue, rl_reward: numberValue,
  }),
  rl: z.object({
    enabled: z.boolean(), algorithm: z.literal("PPO"), framework: z.literal("RLlib"),
    current_action: z.string().nullable(), reason: z.string().nullable(),
    status: z.enum(["ACTIVE", "STANDBY", "DEMO"]), source: z.enum(["mock", "backend"]),
  }),
});

const bandFor = (co2: number): IntersectionState["pollution_level"] => {
  if (co2 >= 90) return "CRITICAL";
  if (co2 >= 70) return "HIGH";
  if (co2 >= 40) return "MODERATE";
  return "LOW";
};

export function snapshotToState(snapshot: SimulationSnapshot, rlEnabled: boolean): SimulationState {
  const intersections = snapshot.intersections.map((item) => ({
    id: item.id, x: item.x, y: item.y, queue_length: item.queueLength,
    waiting_time: item.waitingTime, co2: item.co2, pollution_level: bandFor(item.co2), rl_action: item.rlAction,
  }));
  const focus = [...intersections].sort((a, b) => b.co2 - a.co2)[0];
  const signalById = new Map(snapshot.signals.map((signal) => [signal.id, signal]));

  return simulationStateSchema.parse({
    timestamp: snapshot.timestamp,
    simulation_status: snapshot.simulationStatus,
    vehicles: snapshot.vehicles.map((vehicle) => ({ ...vehicle, waiting_time: 0 })),
    signals: snapshot.signals.map((signal) => ({
      id: signal.id, phase: signal.phase, state: signal.phase, remaining_seconds: signal.remaining,
      ns: signal.ns, ew: signal.ew, rl_controlled: signal.rlControlled,
    })),
    intersections,
    pollution_cells: intersections.map(({ id, x, y, co2, pollution_level }) => ({ id, x, y, co2, pollution_level })),
    metrics: {
      vehicle_count: snapshot.metrics.vehicleCount,
      avg_waiting_time: snapshot.metrics.avgWaitingTime,
      total_co2: snapshot.metrics.totalCo2,
      avg_queue_length: snapshot.metrics.queueLength / Math.max(intersections.length, 1),
      throughput: snapshot.metrics.vehicleCount,
      rl_reward: snapshot.metrics.rlReward,
    },
    rl: {
      enabled: rlEnabled, algorithm: "PPO", framework: "RLlib",
      current_action: focus?.rl_action ?? null,
      reason: focus ? `Demo telemetry focus: ${focus.id}` : null,
      status: rlEnabled ? "DEMO" : "STANDBY", source: "mock",
    },
  });
}

export function payloadToState(payload: unknown): SimulationState {
  const value = payload as Record<string, unknown>;
  const metrics = (value["metrics"] ?? {}) as Record<string, unknown>;
  const rawVehicles = Array.isArray(value["vehicles"]) ? value["vehicles"] : [];
  const rawSignals = Array.isArray(value["signals"]) ? value["signals"] : [];
  const rawIntersections = Array.isArray(value["intersections"]) ? value["intersections"] : [];
  const state = {
    timestamp: value["timestamp"],
    simulation_status: value["simulation_status"] ?? value["simulationStatus"],
    vehicles: rawVehicles.map((item) => {
      const vehicle = item as Record<string, unknown>;
      return { ...vehicle, waiting_time: vehicle["waiting_time"] ?? vehicle["waitingTime"] ?? 0 };
    }),
    signals: rawSignals.map((item) => {
      const signal = item as Record<string, unknown>;
      return {
        ...signal,
        remaining_seconds: signal["remaining_seconds"] ?? signal["remaining"] ?? 0,
        rl_controlled: signal["rl_controlled"] ?? signal["rlControlled"] ?? false,
        state: signal["state"] ?? signal["phase"],
      };
    }),
    intersections: rawIntersections.map((item) => {
      const intersection = item as Record<string, unknown>;
      const co2 = Number(intersection["co2"] ?? 0);
      return {
        ...intersection, queue_length: intersection["queue_length"] ?? intersection["queueLength"] ?? 0,
        waiting_time: intersection["waiting_time"] ?? intersection["waitingTime"] ?? 0,
        pollution_level: intersection["pollution_level"] ?? bandFor(co2),
        rl_action: intersection["rl_action"] ?? intersection["rlAction"] ?? "Maintain cycle",
      };
    }),
    pollution_cells: value["pollution_cells"] ?? rawIntersections.map((item) => {
      const intersection = item as Record<string, unknown>;
      const co2 = Number(intersection["co2"] ?? 0);
      return { id: intersection["id"], x: intersection["x"], y: intersection["y"], co2, pollution_level: bandFor(co2) };
    }),
    metrics: {
      vehicle_count: metrics["vehicle_count"] ?? metrics["vehicleCount"] ?? 0,
      avg_waiting_time: metrics["avg_waiting_time"] ?? metrics["avgWaitingTime"] ?? 0,
      total_co2: metrics["total_co2"] ?? metrics["totalCo2"] ?? 0,
      avg_queue_length: metrics["avg_queue_length"] ?? metrics["queueLength"] ?? 0,
      throughput: metrics["throughput"] ?? metrics["vehicle_count"] ?? metrics["vehicleCount"] ?? 0,
      rl_reward: metrics["rl_reward"] ?? metrics["rlReward"] ?? 0,
    },
    rl: value["rl"] ?? {
      enabled: true, algorithm: "PPO", framework: "RLlib", current_action: null,
      reason: null, status: "ACTIVE", source: "backend",
    },
  };

  return simulationStateSchema.parse(state);
}

export function stateToSnapshot(state: SimulationState): SimulationSnapshot {
  const signalById = new Map(state.signals.map((signal) => [signal.id, signal]));
  const vehicles: Vehicle[] = state.vehicles.map(({ waiting_time: _waitingTime, ...vehicle }) => vehicle);
  const intersections: Intersection[] = state.intersections.map((item) => ({
    id: item.id, x: item.x, y: item.y, queueLength: item.queue_length,
    waitingTime: item.waiting_time, co2: item.co2, rlAction: item.rl_action,
  }));
  const signals: Signal[] = state.signals.map((item) => ({
    id: item.id, phase: item.phase as Signal["phase"], remaining: item.remaining_seconds,
    ns: item.ns, ew: item.ew, rlControlled: item.rl_controlled,
  }));
  return {
    timestamp: state.timestamp,
    simulationStatus: state.simulation_status === "error" ? "stopped" : state.simulation_status,
    vehicles, signals, intersections,
    metrics: {
      vehicleCount: state.metrics.vehicle_count,
      avgWaitingTime: state.metrics.avg_waiting_time,
      queueLength: Math.round(state.metrics.avg_queue_length * Math.max(intersections.length, 1)),
      totalCo2: state.metrics.total_co2,
      rlReward: state.metrics.rl_reward,
    },
  };
}