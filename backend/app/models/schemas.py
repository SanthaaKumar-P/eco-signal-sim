from typing import Literal

from pydantic import BaseModel


SignalPhase = Literal["NS_GREEN", "EW_GREEN", "YELLOW", "ALL_RED"]
PollutionLevel = Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]


class Vehicle(BaseModel):
    id: str
    x: float
    y: float
    speed: float
    waiting_time: float
    heading: Literal["horizontal", "vertical"]


class Signal(BaseModel):
    id: str
    phase: SignalPhase
    state: str
    remaining_seconds: int
    ns: Literal["GREEN", "YELLOW", "RED"]
    ew: Literal["GREEN", "YELLOW", "RED"]
    rl_controlled: bool


class Intersection(BaseModel):
    id: str
    x: float
    y: float
    queue_length: int
    waiting_time: float
    co2: float
    pollution_level: PollutionLevel
    rl_action: str


class Metrics(BaseModel):
    vehicle_count: int
    avg_waiting_time: float
    total_co2: float
    avg_queue_length: float
    throughput: int
    rl_reward: float


class PollutionCell(BaseModel):
    id: str
    x: float
    y: float
    co2: float
    pollution_level: PollutionLevel


class SimulationState(BaseModel):
    timestamp: int
    simulation_status: Literal["running", "paused", "stopped", "error"]
    vehicles: list[Vehicle]
    signals: list[Signal]
    intersections: list[Intersection]
    pollution_cells: list[PollutionCell]
    metrics: Metrics
    rl: "RlAction"


class SimulationSnapshot(SimulationState):
    """Normalized snapshot returned by the simulation adapter."""


class RlAction(BaseModel):
    enabled: bool
    algorithm: Literal["PPO"] = "PPO"
    framework: Literal["RLlib"] = "RLlib"
    current_action: str | None
    reason: str | None
    status: Literal["ACTIVE", "STANDBY", "DEMO"]
    source: Literal["mock", "backend"]


class RlToggle(BaseModel):
    enabled: bool


class RlDecision(BaseModel):
    agent: Literal["PPO"] = "PPO"
    status: Literal["ACTIVE", "STANDBY"]
    objective: str
    action: str
    reason: str
    source: Literal["mock", "backend"]


class ComparisonResult(BaseModel):
    available: bool = False
    baseline: dict[str, float] | None = None
    ppo: dict[str, float] | None = None


class StatusResponse(BaseModel):
    status: Literal["running", "paused", "stopped"]


class ToggleResponse(BaseModel):
    enabled: bool