import math

from app.models.schemas import Intersection, Metrics, PollutionCell, RlAction, Signal, SimulationSnapshot, Vehicle


class MockSimulationService:
    """Deterministic telemetry source with the same shape as a SUMO adapter."""

    def __init__(self) -> None:
        self.timestamp = 120
        self.status: str = "running"
        self.rl_enabled = True

    def snapshot(self) -> SimulationSnapshot:
        layout = [(18, 28), (50, 28), (82, 28), (18, 58), (50, 58), (82, 58), (18, 82), (50, 82), (82, 82)]
        intersections: list[Intersection] = []
        for index, (x, y) in enumerate(layout):
            wave = math.sin(self.timestamp / 18 + index * 0.82)
            queue = max(3, round(10 + wave * 7 + (9 if index == 4 else 0)))
            co2 = max(26, round(42 + queue * 2.3 + math.sin(self.timestamp / 13 + index) * 8))
            intersections.append(Intersection(id=f"INT-{index + 1:02d}", x=x, y=y, queue_length=queue, waiting_time=round(queue * 1.55 + 6 + abs(wave) * 5, 1), co2=co2, pollution_level=self._pollution_level(co2), rl_action="Extend EW green phase" if self.rl_enabled and queue > 14 else "Maintain cycle"))

        vehicles = [Vehicle(id=f"veh_{index + 1:03d}", x=(self.timestamp * (0.8 + (index % 4) * 0.12) + (index * 19.7)) % 100 if index % 2 == 0 else (18 if index % 3 == 0 else 50 if index % 3 == 1 else 82), y=(28 if index % 3 == 0 else 58 if index % 3 == 1 else 82) if index % 2 == 0 else 100 - (self.timestamp * (0.8 + (index % 4) * 0.12) + (index * 19.7)) % 100, speed=round(8 + (index % 6) * 1.4, 1), heading="horizontal" if index % 2 == 0 else "vertical") for index in range(34)]
        phases: list[SignalPhase] = ["NS_GREEN", "EW_GREEN", "YELLOW", "ALL_RED"]
        signals = [Signal(id=intersection.id, phase=phases[(self.timestamp // 12 + index) % 4], state=phases[(self.timestamp // 12 + index) % 4], remaining_seconds=12 - self.timestamp % 12, ns="GREEN" if phases[(self.timestamp // 12 + index) % 4] == "NS_GREEN" else "YELLOW" if phases[(self.timestamp // 12 + index) % 4] == "YELLOW" else "RED", ew="GREEN" if phases[(self.timestamp // 12 + index) % 4] == "EW_GREEN" else "YELLOW" if phases[(self.timestamp // 12 + index) % 4] == "YELLOW" else "RED", rl_controlled=self.rl_enabled and index % 3 != 2) for index, intersection in enumerate(intersections)]
        queue_total = sum(item.queue_length for item in intersections)
        co2_total = sum(item.co2 for item in intersections)
        return SimulationSnapshot(timestamp=self.timestamp, simulation_status=self.status, vehicles=vehicles, signals=signals, intersections=intersections, pollution_cells=[PollutionCell(id=item.id, x=item.x, y=item.y, co2=item.co2, pollution_level=item.pollution_level) for item in intersections], metrics=Metrics(vehicle_count=len(vehicles) + round(84 + math.sin(self.timestamp / 20) * 8), avg_waiting_time=round(sum(item.waiting_time for item in intersections) / len(intersections), 1), total_co2=round(co2_total * 0.72, 1), avg_queue_length=round(queue_total / len(intersections), 2), throughput=len(vehicles) + round(84 + math.sin(self.timestamp / 20) * 8), rl_reward=round(0.58 + math.sin(self.timestamp / 28) * 0.12 + (0.08 if self.rl_enabled else 0), 2)), rl=RlAction(enabled=self.rl_enabled, current_action=max(intersections, key=lambda item: item.co2).rl_action if intersections else None, reason=f"Demo telemetry focus: {max(intersections, key=lambda item: item.co2).id}" if intersections else None, status="DEMO" if self.rl_enabled else "STANDBY", source="mock"))

    @staticmethod
    def _pollution_level(co2: float) -> str:
        if co2 >= 90:
            return "CRITICAL"
        if co2 >= 70:
            return "HIGH"
        if co2 >= 40:
            return "MODERATE"
        return "LOW"

    def tick(self, seconds: int = 3) -> SimulationSnapshot:
        if self.status == "running":
            self.timestamp += seconds
        return self.snapshot()

    def reset(self) -> SimulationSnapshot:
        self.timestamp = 120
        self.status = "stopped"
        return self.snapshot()