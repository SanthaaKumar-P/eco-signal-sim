from fastapi import APIRouter

from app.models.schemas import ComparisonResult, RlToggle, SimulationSnapshot, StatusResponse, ToggleResponse
from app.services.mock import MockSimulationService
from app.services.rl import RlPolicyService

router = APIRouter()
simulation = MockSimulationService()
policy = RlPolicyService()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/simulation/status", response_model=StatusResponse)
def simulation_status() -> StatusResponse:
    return StatusResponse(status=simulation.status)  # type: ignore[arg-type]


@router.get("/snapshot", response_model=SimulationSnapshot)
def snapshot() -> SimulationSnapshot:
    return simulation.snapshot()


@router.get("/metrics")
def metrics() -> dict[str, float | int]:
    return simulation.snapshot().metrics.model_dump()


@router.get("/intersections")
def intersections() -> list[dict[str, object]]:
    return [item.model_dump() for item in simulation.snapshot().intersections]


@router.get("/signals")
def signals() -> list[dict[str, object]]:
    return [item.model_dump() for item in simulation.snapshot().signals]


@router.get("/pollution/hotspots")
def hotspots() -> list[dict[str, object]]:
    return [item.model_dump() for item in sorted(simulation.snapshot().intersections, key=lambda item: item.co2, reverse=True)[:4]]


@router.get("/comparison", response_model=ComparisonResult)
def comparison() -> ComparisonResult:
    return ComparisonResult()


@router.post("/simulation/start", response_model=StatusResponse)
def start() -> StatusResponse:
    simulation.status = "running"
    return StatusResponse(status="running")


@router.post("/simulation/pause", response_model=StatusResponse)
def pause() -> StatusResponse:
    simulation.status = "paused"
    return StatusResponse(status="paused")


@router.post("/simulation/reset", response_model=StatusResponse)
def reset() -> StatusResponse:
    simulation.reset()
    return StatusResponse(status="stopped")


@router.post("/rl/toggle", response_model=ToggleResponse)
def toggle_rl(payload: RlToggle) -> ToggleResponse:
    simulation.rl_enabled = payload.enabled
    return ToggleResponse(enabled=simulation.rl_enabled)


@router.get("/rl/decision")
def rl_decision() -> dict[str, object]:
    return policy.decide(simulation.snapshot(), simulation.rl_enabled).model_dump()