from app.models.schemas import RlDecision, SimulationSnapshot


class RlPolicyService:
    """Integration seam for a trained PPO/RLlib policy; no training occurs here."""

    def decide(self, snapshot: SimulationSnapshot, enabled: bool) -> RlDecision:
        focus = max(snapshot.intersections, key=lambda item: item.co2, default=None)
        if focus is None:
            return RlDecision(status="ACTIVE" if enabled else "STANDBY", objective="Traffic efficiency + carbon reduction", action="Awaiting intersection telemetry", reason="No intersection data is available yet", source="mock")
        high_queue = focus.queueLength > 14
        return RlDecision(status="ACTIVE" if enabled else "STANDBY", objective="Traffic efficiency + carbon reduction", action="Extend East–West green phase" if enabled and high_queue else "Monitor current cycle", reason=f"High queue and elevated CO₂ detected at {focus.id}" if enabled and high_queue else "RL control is waiting for an active control signal", source="mock")