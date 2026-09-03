import type {
  ComparisonResult,
  Hotspot,
  Intersection,
  Metrics,
  SimulationSnapshot,
} from "@/lib/ecotwin-types";

const apiBase = import.meta.env.VITE_ECOTWIN_API_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) throw new Error(`EcoTwin API request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export const ecotwinApi = {
  health: () => request<{ status: string }>("/api/health"),
  status: () => request<{ status: string }>("/api/simulation/status"),
  metrics: () => request<Metrics>("/api/metrics"),
  intersections: () => request<Intersection[]>("/api/intersections"),
  signals: () => request<SimulationSnapshot["signals"]>("/api/signals"),
  hotspots: () => request<Hotspot[]>("/api/pollution/hotspots"),
  comparison: () => request<ComparisonResult>("/api/comparison"),
  start: () => request<{ status: string }>("/api/simulation/start", { method: "POST" }),
  pause: () => request<{ status: string }>("/api/simulation/pause", { method: "POST" }),
  reset: () => request<{ status: string }>("/api/simulation/reset", { method: "POST" }),
  toggleRl: (enabled: boolean) =>
    request<{ enabled: boolean }>("/api/rl/toggle", {
      method: "POST",
      body: JSON.stringify({ enabled }),
    }),
  websocketUrl: () => {
    if (import.meta.env.VITE_ECOTWIN_WS_URL) return import.meta.env.VITE_ECOTWIN_WS_URL;
    if (typeof window === "undefined") return "ws://localhost:8000/ws/simulation";
    return `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/simulation`;
  },
};
