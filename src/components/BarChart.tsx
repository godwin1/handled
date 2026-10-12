"use client";

import { useState } from "react";

export type BarDatum = { label: string; value: number; displayValue: string };

// Hand-rolled rather than a charting library - the data here is always a
// handful of bars (months, account types), so a dependency would be
// overkill. Follows the dataviz skill's mark spec: thin marks, rounded
// data-ends, a hover tooltip even for a single-series chart.
export function BarChart({
  data,
  orientation = "vertical",
  color = "#a8532f",
}: {
  data: BarDatum[];
  orientation?: "vertical" | "horizontal";
  color?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1);

  if (data.length === 0) {
    return <p className="text-sm text-stone-400">Nothing to show yet.</p>;
  }

  if (orientation === "horizontal") {
    return (
      <div className="space-y-2.5">
        {data.map((d, i) => (
          <div
            key={d.label}
            className="flex items-center gap-3 text-xs"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="w-24 shrink-0 text-stone-600 truncate">{d.label}</span>
            <div className="flex-1 h-4 bg-stone-100 rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max((d.value / max) * 100, d.value > 0 ? 2 : 0)}%`, backgroundColor: color }}
              />
              {hovered === i && (
                <div className="absolute left-2 -top-7 bg-stone-900 text-white text-[11px] px-2 py-0.5 rounded whitespace-nowrap z-10">
                  {d.displayValue}
                </div>
              )}
            </div>
            <span className="w-20 shrink-0 text-right text-stone-500">{d.displayValue}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d, i) => (
        <div
          key={d.label}
          className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        >
          <div className="relative w-full flex items-end justify-center flex-1">
            {hovered === i && (
              <div className="absolute -top-6 bg-stone-900 text-white text-[11px] px-2 py-0.5 rounded whitespace-nowrap z-10">
                {d.displayValue}
              </div>
            )}
            <div
              className="w-full max-w-10 rounded-t-md"
              style={{ height: `${Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0)}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-[11px] text-stone-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
