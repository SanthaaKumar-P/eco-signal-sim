from typing import Literal

from pydantic import BaseModel, Field


SignalPhase = Literal["NS_GREEN", "EW_GREEN", "YELLOW", "ALL_RED"]


class Vehicle(BaseModel):
    id: str
    x: float
    y: float
    speed: float
    heading: Literal["horizontal", "vertical"]


class Signal(BaseModel):
    id: str
    phase: SignalPhase
    remaining: int
    ns: Literal["GREEN", "YELLOW", "RED"]
    ew: Literal["GREEN", "YELLOW", "RED"]
    rlControlled: bool


class Intersection(BaseModel):
    id: str
    x: float
    y: float
    queueLength: int
    waitingTime: float
    co2: float
    rlAction: str


class Metrics(BaseModel):
    vehicleCount: int
    avgWaitingTime: float
    queueLength: int
    totalCo2: float
    rlReward: float


class SimulationSnapshot(BaseModel):
    timestamp: int
    simulationStatus: Literal["running", "paused", "stopped"]
    vehicles: list[Vehicle]
    signals: list[Signal]
    intersections: list[Intersection]
    metrics: Metrics


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