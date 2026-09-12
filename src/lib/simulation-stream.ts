import { ecotwinApi } from "@/lib/ecotwin-api";
import { createMockSnapshot } from "@/lib/mock-simulation";
import { payloadToState, snapshotToState, type SimulationState } from "@/lib/simulation-contract";

export type StreamMode = "mock" | "live";
export type StreamConnection = "mock" | "connecting" | "connected" | "disconnected" | "error";

export interface SimulationStream {
  start(): void;
  stop(): void;
  subscribe(listener: (state: SimulationState) => void): () => void;
  subscribeConnection(listener: (status: StreamConnection) => void): () => void;
  startSimulation(): Promise<void>;
  pauseSimulation(): Promise<void>;
  resetSimulation(): Promise<void>;
  toggleRl(enabled: boolean): Promise<void>;
}

const configuredMode: StreamMode = import.meta.env["VITE_ECOTWIN_MODE"] === "live" ? "live" : "mock";

export function getSimulationMode(): StreamMode {
  return configuredMode;
}

export function createSimulationStream(mode: StreamMode = configuredMode): SimulationStream {
  return mode === "live" ? new LiveSimulationStream() : new MockSimulationStream();
}

class MockSimulationStream implements SimulationStream {
  private timestamp = 120;
  private status: "running" | "paused" | "stopped" = "running";
  private rlEnabled = true;
  private interval: number | undefined;
  private listeners = new Set<(state: SimulationState) => void>();
  private connectionListeners = new Set<(status: StreamConnection) => void>();

  start() {
    this.emit();
    this.interval = window.setInterval(() => {
      if (this.status === "running") {
        this.timestamp += 3;
        this.emit();
      }
    }, 1500);
    this.connectionListeners.forEach((listener) => listener("mock"));
  }

  stop() {
    if (this.interval !== undefined) window.clearInterval(this.interval);
    this.interval = undefined;
  }

  subscribe(listener: (state: SimulationState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeConnection(listener: (status: StreamConnection) => void) {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  async startSimulation() { this.status = "running"; this.emit(); }
  async pauseSimulation() { this.status = "paused"; this.emit(); }
  async resetSimulation() { this.timestamp = 120; this.status = "stopped"; this.emit(); }
  async toggleRl(enabled: boolean) { this.rlEnabled = enabled; this.emit(); }

  private emit() {
    const snapshot = { ...createMockSnapshot(this.timestamp, this.rlEnabled), simulationStatus: this.status };
    const state = snapshotToState(snapshot, this.rlEnabled);
    this.listeners.forEach((listener) => listener(state));
  }
}

class LiveSimulationStream implements SimulationStream {
  private socket: WebSocket | undefined;
  private listeners = new Set<(state: SimulationState) => void>();
  private connectionListeners = new Set<(status: StreamConnection) => void>();
  private lastState: SimulationState | undefined;
  private reconnectTimer: number | undefined;

  start() {
    this.connect();
  }

  stop() {
    if (this.reconnectTimer !== undefined) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    this.socket?.close();
    this.socket = undefined;
  }

  subscribe(listener: (state: SimulationState) => void) {
    this.listeners.add(listener);
    if (this.lastState) listener(this.lastState);
    return () => this.listeners.delete(listener);
  }

  subscribeConnection(listener: (status: StreamConnection) => void) {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  async startSimulation() { await ecotwinApi.start(); }
  async pauseSimulation() { await ecotwinApi.pause(); }
  async resetSimulation() { await ecotwinApi.reset(); }
  async toggleRl(enabled: boolean) { await ecotwinApi.toggleRl(enabled); }

  private connect() {
    this.connectionListeners.forEach((listener) => listener("connecting"));
    this.socket = new WebSocket(ecotwinApi.websocketUrl());
    this.socket.onopen = () => this.connectionListeners.forEach((listener) => listener("connected"));
    this.socket.onmessage = (event) => {
      try {
        const state = payloadToState(JSON.parse(event.data));
        this.lastState = state;
        this.listeners.forEach((listener) => listener(state));
      } catch {
        this.connectionListeners.forEach((listener) => listener("error"));
      }
    };
    this.socket.onerror = () => this.connectionListeners.forEach((listener) => listener("error"));
    this.socket.onclose = () => {
      this.connectionListeners.forEach((listener) => listener("disconnected"));
      this.reconnectTimer = window.setTimeout(() => this.connect(), 2500);
    };
  }
}