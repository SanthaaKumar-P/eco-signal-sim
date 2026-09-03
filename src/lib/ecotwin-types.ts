export type SimulationStatus = "running" | "paused" | "stopped";
export type SignalPhase = "NS_GREEN" | "EW_GREEN" | "YELLOW" | "ALL_RED";
export type PollutionBand = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface Vehicle {
  id: string;
  x: number;
  y: number;
  speed: number;
  heading: "horizontal" | "vertical";
}

export interface Signal {
  id: string;
  phase: SignalPhase;
  remaining: number;
  ns: "GREEN" | "YELLOW" | "RED";
  ew: "GREEN" | "YELLOW" | "RED";
  rlControlled: boolean;
}

export interface Intersection {
  id: string;
  x: number;
  y: number;
  queueLength: number;
  waitingTime: number;
  co2: number;
  rlAction: string;
}

export interface Metrics {
  vehicleCount: number;
  avgWaitingTime: number;
  queueLength: number;
  totalCo2: number;
  rlReward: number;
}

export interface SimulationSnapshot {
  timestamp: number;
  simulationStatus: SimulationStatus;
  vehicles: Vehicle[];
  signals: Signal[];
  intersections: Intersection[];
  metrics: Metrics;
}

export interface Hotspot {
  rank: number;
  intersectionId: string;
  co2: number;
  queueLength: number;
  waitingTime: number;
  trend: "rising" | "stable" | "falling";
  band: PollutionBand;
}

export interface RlDecision {
  agent: "PPO";
  status: "ACTIVE" | "STANDBY";
  objective: string;
  action: string;
  reason: string;
  source: "mock" | "backend";
}

export interface TimelinePoint {
  time: number;
  vehicles: number;
  co2: number;
  wait: number;
  reward: number;
}

export interface ComparisonResult {
  available: boolean;
  baseline?: { waitingTime: number; totalCo2: number; queueLength: number; throughput: number };
  ppo?: { waitingTime: number; totalCo2: number; queueLength: number; throughput: number };
}

export interface SimulationControlState {
  heatmap: boolean;
  vehicles: boolean;
  rlControl: boolean;
}
