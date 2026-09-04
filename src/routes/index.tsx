import { createFileRoute } from "@tanstack/react-router";

import { EcoTwinDashboard } from "@/components/ecotwin-dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EcoTwin Dashboard | Urban Traffic Intelligence" },
      { name: "description", content: "Monitor simulated traffic, signal timing, pollution hotspots, and RL control decisions in one urban command center." },
      { property: "og:title", content: "EcoTwin Dashboard | Urban Traffic Intelligence" },
      { property: "og:description", content: "A live mission-control view of traffic flow, carbon concentration, and adaptive signal control." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EcoTwinDashboard,
});
