import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  note: string;
  icon: LucideIcon;
  tone?: "default" | "amber" | "red" | "mint";
}

export function MetricCard({ label, value, unit, note, icon: Icon, tone = "default" }: MetricCardProps) {
  const toneClass = tone === "amber" ? "text-amber" : tone === "red" ? "text-red" : tone === "mint" ? "text-mint" : "text-foreground";
  return (
    <div className={`glass-panel min-w-0 rounded-2xl border p-4 ${tone === "mint" ? "border-mint/25" : "border-line/80"}`}>
      <div className="flex items-start justify-between gap-2"><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel">{label}</div><Icon className={`size-4 ${toneClass} opacity-75`} /></div>
      <div className={`mt-2 font-mono text-2xl font-bold ${toneClass}`}>{value}<span className="ml-1 text-sm text-steel">{unit}</span></div>
      <div className="mt-1 font-mono text-[9px] text-steel">{note}</div>
    </div>
  );
}
