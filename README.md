# EcoTwin Command

Build a production-quality web dashboard called "EcoTwin".

IMPORTANT:

This is NOT a generic traffic dashboard.

It is the frontend + backend layer of an AI-powered urban traffic and carbon optimization system.

PROJECT CONTEXT:

EcoTwin is a simulated smart-city platform where a Reinforcement Learning agent controls traffic lights while considering both traffic efficiency and localized CO₂ pollution.

The overall architecture is:

SUMO Traffic Simulation

        ↓

TraCI

        ↓

RL / PPO Agent

        ↓

FastAPI Backend

        ↓

WebSocket

        ↓

React Dashboard

My responsibility is the FRONTEND + BACKEND layer.

The SUMO and PPO modules will be provided by other team members later, so create a clean API contract and mock-data mode now. The system must be designed so mock data can later be replaced by real SUMO/PPO data without rewriting the frontend.

==================================================

TECH STACK

==================================================

Frontend:

- React

- TypeScript

- Tailwind CSS

- Leaflet OR Deck.gl for the city visualization

- Recharts for analytics

- Lucide icons

Backend:

- Python

- FastAPI

- WebSockets

- Pydantic

Development:

- VS Code compatible

- Docker-ready

- Environment variables for configuration

Do NOT use Supabase or Firebase unless absolutely required.

Do NOT add authentication unless necessary.

Focus on the actual EcoTwin functionality.

==================================================

CORE UX

==================================================

Create a professional "Mission Control" dashboard for an urban planner.

The UI should feel like:

- smart-city command center

- environmental intelligence platform

- AI simulation laboratory

Avoid:

- generic admin dashboard appearance

- excessive gradients

- random decorative cards

- unnecessary animations

- fake AI claims

Use a clean dark/light professional visual system with strong hierarchy.

==================================================

MAIN DASHBOARD

==================================================

Create a responsive desktop-first dashboard.

Top header:

EcoTwin

Urban Carbon Intelligence

Status:

● Simulation Connected

● RL Agent Active / Standby

Controls:

- Start Simulation

- Pause

- Reset

- Toggle RL Control

- Toggle Heatmap

- Toggle Vehicles

==================================================

LIVE CITY MAP

==================================================

The map must be the visual centerpiece.

Show a simulated city grid containing:

- roads

- intersections

- traffic lights

- moving vehicle markers

- pollution/CO₂ heatmap

- selected intersection information

Traffic lights should visually communicate:

GREEN

YELLOW

RED

Vehicles should move along roads when live/mock simulation is active.

The heatmap must communicate localized CO₂ concentration.

Use a meaningful pollution scale:

Low → Moderate → High → Critical

Do not rely only on colors.

Add tooltips/labels so the dashboard remains understandable.

When an intersection is selected, show:

Intersection ID

Current signal phase

Vehicles waiting

Queue length

Average waiting time

CO₂ concentration

Current RL action

==================================================

LIVE METRICS

==================================================

Create high-quality metric cards for:

- Total Vehicles

- Average Waiting Time

- Queue Length

- Total CO₂ Emissions

- Current Pollution Hotspots

- RL Reward

Every metric must support live updates.

Do not use meaningless fake percentages.

If the value is simulated/mock data, clearly label it as:

"Simulation Data"

==================================================

POLLUTION INTELLIGENCE

==================================================

Create a "Pollution Hotspots" panel.

Display:

Rank

Intersection

CO₂ level

Queue length

Waiting time

Trend

Example:

#1 INT-04

HIGH

CO₂: 82

Queue: 19

Wait: 34s

When a hotspot is clicked:

- focus the map on that intersection

- open its details

- highlight the pollution region

==================================================

TRAFFIC SIGNAL PANEL

==================================================

Create a live traffic signal table.

Columns:

Intersection

North/South

East/West

Current Phase

Remaining Time

Queue

CO₂

RL Status

Allow filtering by:

- High CO₂

- Long queue

- RL controlled

- All

==================================================

RL INTELLIGENCE PANEL

==================================================

Create a compact panel explaining what the RL agent is doing.

Show:

Agent:

PPO

Status:

ACTIVE

Current Objective:

Traffic efficiency + carbon reduction

Current Action:

Example:

"Extend East-West green phase"

Reason:

"High queue and elevated CO₂ detected"

IMPORTANT:

These explanations must be based on received backend data when real integration is available.

During mock mode clearly label:

"Demo explanation"

==================================================

PERFORMANCE COMPARISON

==================================================

Create a comparison section:

Baseline Traffic Control

vs

EcoTwin PPO Control

Metrics:

Average Waiting Time

Total CO₂

Queue Length

Traffic Throughput

Use charts.

The purpose is to demonstrate whether EcoTwin improves the trade-off between traffic efficiency and environmental impact.

Do NOT fabricate final performance improvements.

Show "No evaluation yet" until real benchmark data is supplied.

==================================================

TIMELINE / LIVE SIMULATION

==================================================

Create a compact live simulation timeline:

Simulation Time

Vehicles

CO₂

Average Wait

RL Reward

Allow the user to visually understand how conditions evolve over time.

==================================================

BACKEND API CONTRACT

==================================================

Prepare frontend service modules for:

GET /api/health

GET /api/simulation/status

GET /api/metrics

GET /api/intersections

GET /api/signals

GET /api/pollution/hotspots

GET /api/comparison

POST /api/simulation/start

POST /api/simulation/pause

POST /api/simulation/reset

POST /api/rl/toggle

WebSocket:

WS /ws/simulation

Expected WebSocket message format:

{

  "timestamp": 120,

  "simulation_status": "running",

  "vehicles": [

    {

      "id": "veh_001",

      "x": 120,

      "y": 80,

      "speed": 12.4

    }

  ],

  "signals": [

    {

      "id": "INT_01",

      "phase": "NS_GREEN",

      "remaining": 12

    }

  ],

  "intersections": [

    {

      "id": "INT_01",

      "queue_length": 8,

      "waiting_time": 21.4,

      "co2": 64.2

    }

  ],

  "metrics": {

    "vehicle_count": 142,

    "avg_waiting_time": 18.5,

    "queue_length": 27,

    "total_co2": 542.7,

    "rl_reward": 0.72

  }

}

Make all frontend types strongly typed.

==================================================

MOCK DATA MODE

==================================================

Create a realistic mock simulation engine/service.

The dashboard must work completely even without SUMO.

Mock mode should simulate:

- vehicle movement

- changing signal phases

- changing queues

- changing CO₂ concentration

- changing waiting times

- RL actions

- simulation time

Use deterministic seeded mock data where possible so demonstrations are reproducible.

Create a visible indicator:

"MOCK SIMULATION"

Later this will be replaced by the real WebSocket stream.

==================================================

BACKEND STRUCTURE

==================================================

If backend generation is supported, create:

backend/

  app/

    main.py

    api/

      routes.py

      simulation.py

      metrics.py

      rl.py

    websocket/

      manager.py

    models/

      schemas.py

    services/

      simulation_service.py

      rl_service.py

      mock_service.py

    config.py

The backend must be designed so the mock service can later be replaced with:

SUMO + TraCI

and

trained PPO/RLlib model.

Do NOT implement fake PPO training.

Only create the integration interface.

==================================================

MAP BEHAVIOR

==================================================

The map should support:

- zoom

- pan

- intersection selection

- vehicle movement

- signal state visualization

- pollution heatmap

- hotspot highlighting

- tooltip information

Use a simulated coordinate system if real geographic coordinates are unavailable.

Do not require a real city map.

==================================================

RESPONSIVENESS

==================================================

Desktop:

Full command-center experience.

Tablet:

Condense side panels.

Mobile:

Stack panels and preserve the map as the primary component.

==================================================

ERROR / CONNECTION STATES

==================================================

Handle:

Backend disconnected

WebSocket disconnected

Simulation stopped

No data available

Loading

API error

Display useful messages.

Example:

"Simulation backend disconnected. Showing last known state."

==================================================

CODE QUALITY

==================================================

Use:

- reusable React components

- TypeScript interfaces

- clean service layer

- environment variables

- no hardcoded API URLs

- clear folder structure

- meaningful names

- comments only where useful

Do not put the entire application in one file.

==================================================

FINAL RESULT

==================================================

The finished application should feel like a real smart-city environmental command center.

The most important visual hierarchy is:

1. Live City Simulation

2. CO₂ Heatmap

3. Traffic Signals

4. Live Metrics

5. Pollution Hotspots

6. RL Decision Information

7. Baseline vs PPO comparison

Build the actual working interactions, not just static screens.

Start with mock simulation data but architect everything for seamless replacement with the real SUMO + PPO + FastAPI WebSocket pipeline later.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://eco-signal-sim.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8558d6e0-5447-40a5-9ea2-26a5bf447385).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
