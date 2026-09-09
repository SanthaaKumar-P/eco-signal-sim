# EcoTwin integration-readiness plan

## What will change
- Preserve the existing Kinetic Glass Command dashboard and reusable map/metric panels.
- Introduce a normalized simulation contract with explicit vehicle, signal, intersection, pollution, metric, RL, and overall state types.
- Add a browser-safe simulation stream abstraction that can use the deterministic mock source now and switch to backend polling/WebSocket updates later.
- Move dashboard updates onto one shared state stream, with connection, stopped, invalid-data, and last-known-state handling.
- Extend the FastAPI scaffold with normalized payload fields, health/status controls, RL decision access, and a managed WebSocket connection lifecycle without implementing SUMO or PPO.
- Verify the existing interactions and build output after the changes.

## Technical details
- Keep SUMO/TraCI and PPO/RLlib outside the React UI.
- Keep environment-based API and WebSocket URLs; no production URLs in code.
- Preserve the current mock-only labels and the “No evaluation yet” comparison state.
- Avoid editing generated route files or replacing the existing page composition.
