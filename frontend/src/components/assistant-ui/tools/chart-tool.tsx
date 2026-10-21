"use client";

import React, { useMemo, useState, useRef, useCallback } from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import { MermaidDiagram } from "@/components/assistant-ui/elements/mermaid-diagram";
import {
  BarChart3Icon,
  PieChartIcon,
  ActivityIcon,
  GaugeIcon,
  GridIcon,
  TrendingUpIcon,
  RefreshCwIcon,
  SparklesIcon,
  Maximize2Icon,
  Minimize2Icon,
  CopyIcon,
  CheckIcon,
  TableIcon,
  GitForkIcon,
  PlusIcon,
  MinusIcon,
  RotateCcwIcon,
  LayersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ChartSeries {
  name: string;
  data: (number | null)[];
  color?: string;
  unit?: string;
  series_type?: "bar" | "line" | "area" | "scatter";
  y_axis_id?: "left" | "right";
  stroke_dasharray?: string;
}

export interface GaugeConfig {
  current_value: number;
  min_value: number;
  max_value: number;
  threshold_value?: number;
  unit: string;
  status?: string;
}

export interface HeatmapMatrix {
  x_labels: string[];
  y_labels: string[];
  z_matrix: number[][];
  z_label: string;
}

export interface ScatterPoint {
  x: number;
  y: number;
  label?: string;
}

export interface ScatterSeries {
  name: string;
  points: ScatterPoint[];
  color?: string;
}

export interface ChartConfig {
  chart_type: string;
  title: string;
  subtitle?: string;
  x_axis_label?: string;
  x_labels?: string[];
  y_axis_label?: string;
  secondary_y_axis_label?: string;
  layout?: "horizontal" | "vertical";
  series?: ChartSeries[];
  threshold_line?: number;
  threshold_label?: string;
  scatter_series?: ScatterSeries[];
  gauge_data?: GaugeConfig;
  heatmap_data?: HeatmapMatrix;
  treemap_data?: Array<{ name: string; size: number; unit?: string }>;
  radar_data?: Array<Record<string, any>>;
  radial_bar_data?: Array<{ name: string; value: number; fill?: string }>;
  center_kpi?: { label: string; value: string };
  representation_reason?: string;
  mermaid_code?: string;
}

export const MODERN_PALETTE = [
  "#2563EB", // Electric Blue
  "#059669", // Emerald Green
  "#D97706", // Amber
  "#DC2626", // Crimson Red
  "#7C3AED", // Royal Purple
  "#0891B2", // Cyan
  "#DB2777", // Magenta Pink
  "#4B5563", // Slate Gray
  "#10B981", // Mint Teal
  "#F59E0B", // Bright Orange
  "#6366F1", // Indigo
  "#EC4899", // Rose
];

// -------------------------------------------------------------
// Interactive Tooltip Overlay Component
// -------------------------------------------------------------
interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  title: string;
  items: Array<{ label: string; value: string; color: string }>;
}

export const FloatingTooltip: React.FC<{ tooltip: TooltipState | null }> = ({ tooltip }) => {
  if (!tooltip || !tooltip.visible) return null;
  return (
    <div
      className="pointer-events-none absolute z-30 rounded-xl border border-border/80 bg-background/95 p-2.5 shadow-xl backdrop-blur-md transition-all duration-75 text-xs"
      style={{
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`,
        transform: "translate(-50%, -115%)",
      }}
    >
      <div className="font-semibold text-foreground border-b pb-1 mb-1.5">{tooltip.title}</div>
      <div className="space-y-1">
        {tooltip.items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-muted-foreground">{item.label}:</span>
            <span className="font-semibold text-foreground font-mono">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 1. Native Interactive Donut & Pie Chart Renderer
// -------------------------------------------------------------
export const NativeDonutChart: React.FC<{
  config: ChartConfig;
  isExpanded: boolean;
  zoomScale: number;
}> = ({ config, isExpanded, zoomScale }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isDonut = config.chart_type?.toLowerCase() === "donut" || !config.chart_type;
  const labels = config.x_labels || [];
  const series = config.series?.[0];
  const unit = series?.unit || "kWh";
  const rawValues = (series?.data || []).map((v) => (typeof v === "number" ? Math.max(v, 0) : 0));
  const total = rawValues.reduce((sum, v) => sum + v, 0) || 1;

  // Arc path generator
  const outerR = isExpanded ? 130 : 105;
  const innerR = isDonut ? (isExpanded ? 80 : 65) : 0;
  const cx = 175;
  const cy = 175;

  let currentAngle = -Math.PI / 2;
  const slices = rawValues.map((val, idx) => {
    const angle = (val / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle += angle;

    const isHovered = hoveredIdx === idx;
    const rOut = isHovered ? outerR + 6 : outerR;
    const rIn = isHovered && innerR > 0 ? innerR - 2 : innerR;

    const x1 = cx + rOut * Math.cos(startAngle);
    const y1 = cy + rOut * Math.sin(startAngle);
    const x2 = cx + rOut * Math.cos(endAngle);
    const y2 = cy + rOut * Math.sin(endAngle);

    const largeArc = angle > Math.PI ? 1 : 0;

    let path = "";
    if (rIn > 0) {
      const ix1 = cx + rIn * Math.cos(endAngle);
      const iy1 = cy + rIn * Math.sin(endAngle);
      const ix2 = cx + rIn * Math.cos(startAngle);
      const iy2 = cy + rIn * Math.sin(startAngle);
      path = `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${rIn} ${rIn} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
    } else {
      path = `M ${cx} ${cy} L ${x1} ${y1} A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    }

    const color = series?.color || MODERN_PALETTE[idx % MODERN_PALETTE.length];
    const pct = ((val / total) * 100).toFixed(1);
    return {
      path,
      color,
      label: labels[idx] || `Item ${idx + 1}`,
      val,
      pct,
    };
  });

  const handleMouseMove = (e: React.MouseEvent, s: (typeof slices)[0], idx: number) => {
    setHoveredIdx(idx);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      title: s.label,
      items: [
        { label: "Energy", value: `${s.val.toLocaleString()} ${unit}`, color: s.color },
        { label: "Share", value: `${s.pct}%`, color: s.color },
      ],
    });
  };

  return (
    <div ref={containerRef} className="relative flex flex-col items-center justify-center w-full py-4">
      <FloatingTooltip tooltip={tooltip} />
      <div
        className="flex items-center justify-center transition-transform duration-200"
        style={{ transform: `scale(${zoomScale})` }}
      >
        <svg
          viewBox="0 0 350 350"
          className={cn("transition-all", isExpanded ? "size-[380px]" : "size-72 sm:size-80")}
          onMouseLeave={() => {
            setHoveredIdx(null);
            setTooltip(null);
          }}
        >
          {slices.map((s, idx) => (
            <path
              key={idx}
              d={s.path}
              fill={s.color}
              className="cursor-pointer transition-all duration-200 hover:opacity-90"
              stroke="hsl(var(--background))"
              strokeWidth="2.5"
              onMouseMove={(e) => handleMouseMove(e, s, idx)}
            />
          ))}

          {/* Center KPI Readout */}
          {isDonut && (
            <g className="pointer-events-none select-none text-center">
              <text
                x={cx}
                y={cy - 6}
                textAnchor="middle"
                className="fill-foreground font-mono font-bold text-xl sm:text-2xl"
              >
                {config.center_kpi?.value || `${total.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit}`}
              </text>
              <text
                x={cx}
                y={cy + 16}
                textAnchor="middle"
                className="fill-muted-foreground font-medium text-xs tracking-wider uppercase"
              >
                {config.center_kpi?.label || "Total Consumption"}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Slices Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 max-w-xl text-xs">
        {slices.map((s, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 transition-all cursor-pointer",
              hoveredIdx === idx ? "border-primary bg-primary/10 shadow-xs" : "border-border/60 bg-muted/30"
            )}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="font-medium text-foreground">{s.label}</span>
            <span className="text-muted-foreground font-mono font-semibold">({s.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 2. Native Interactive Bar & Stacked Bar Chart Renderer
// -------------------------------------------------------------
export const NativeBarChart: React.FC<{
  config: ChartConfig;
  isExpanded: boolean;
  zoomScale: number;
}> = ({ config, isExpanded, zoomScale }) => {
  const [hoveredBar, setHoveredBar] = useState<{ seriesIdx: number; catIdx: number } | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isStacked = config.chart_type === "stacked_bar";
  const xLabels = config.x_labels || [];
  const seriesList = config.series || [];
  const unit = seriesList[0]?.unit || "kWh";

  // Calculate scales
  const catCount = Math.max(xLabels.length, 1);
  const maxVal = useMemo(() => {
    if (isStacked) {
      let maxStack = 0;
      for (let i = 0; i < catCount; i++) {
        const sum = seriesList.reduce((acc, s) => acc + (typeof s.data[i] === "number" ? (s.data[i] as number) : 0), 0);
        if (sum > maxStack) maxStack = sum;
      }
      return maxStack * 1.15 || 100;
    } else {
      let m = 0;
      seriesList.forEach((s) => {
        s.data.forEach((val) => {
          if (typeof val === "number" && val > m) m = val;
        });
      });
      return m * 1.15 || 100;
    }
  }, [seriesList, isStacked, catCount]);

  const chartW = Math.max(760, catCount * 36);
  const chartH = isExpanded ? 460 : 320;
  const padLeft = 65;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 55;
  const plotW = chartW - padLeft - padRight;
  const plotH = chartH - padTop - padBottom;

  const slotW = plotW / catCount;
  const barGap = slotW * 0.18;
  const availSlot = slotW - barGap;
  const subBarW = isStacked ? availSlot : availSlot / Math.max(seriesList.length, 1);

  // Grid Ticks
  const tickCount = 5;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (maxVal / tickCount) * i);

  return (
    <div ref={containerRef} className="relative w-full overflow-x-auto py-2">
      <FloatingTooltip tooltip={tooltip} />
      <div
        className="min-w-full transition-transform duration-200"
        style={{ transform: `scale(${zoomScale})`, transformOrigin: "top left" }}
      >
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => {
            setHoveredBar(null);
            setTooltip(null);
          }}
        >
          {/* Gridlines & Y-Axis Labels */}
          {ticks.map((val, i) => {
            const y = padTop + plotH - (val / maxVal) * plotH;
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + plotW}
                  y2={y}
                  stroke="hsl(var(--border))"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-muted-foreground text-[10px] font-mono"
                >
                  {val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </text>
              </g>
            );
          })}

          {/* Base Axis Line */}
          <line
            x1={padLeft}
            y1={padTop + plotH}
            x2={padLeft + plotW}
            y2={padTop + plotH}
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
          />

          {/* Bars */}
          {xLabels.map((catLabel, catIdx) => {
            const slotX = padLeft + catIdx * slotW + barGap / 2;
            let currentStackBottom = 0;

            return (
              <g key={catIdx}>
                {seriesList.map((s, sIdx) => {
                  const val = typeof s.data[catIdx] === "number" ? (s.data[catIdx] as number) : 0;
                  const barH = (val / maxVal) * plotH;
                  const color = s.color || MODERN_PALETTE[sIdx % MODERN_PALETTE.length];
                  const isHovered = hoveredBar?.seriesIdx === sIdx && hoveredBar?.catIdx === catIdx;

                  let barX = slotX + sIdx * subBarW;
                  let barY = padTop + plotH - barH;

                  if (isStacked) {
                    barX = slotX;
                    barY = padTop + plotH - currentStackBottom - barH;
                    currentStackBottom += barH;
                  }

                  return (
                    <rect
                      key={sIdx}
                      x={barX}
                      y={barY}
                      width={Math.max(subBarW, 2)}
                      height={Math.max(barH, 0)}
                      fill={color}
                      rx={3}
                      className="cursor-pointer transition-opacity duration-150"
                      opacity={isHovered ? 1 : 0.88}
                      stroke={isHovered ? "hsl(var(--foreground))" : "none"}
                      strokeWidth={1.5}
                      onMouseMove={(e) => {
                        setHoveredBar({ seriesIdx: sIdx, catIdx });
                        if (!containerRef.current) return;
                        const rect = containerRef.current.getBoundingClientRect();
                        setTooltip({
                          visible: true,
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                          title: catLabel,
                          items: [
                            {
                              label: s.name,
                              value: `${val.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${s.unit || unit}`,
                              color,
                            },
                          ],
                        });
                      }}
                    />
                  );
                })}

                {/* X-Axis Tick Label */}
                <text
                  x={slotX + availSlot / 2}
                  y={padTop + plotH + 18}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px] font-medium"
                >
                  {catLabel.length > 10 ? `${catLabel.slice(0, 9)}…` : catLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Series Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs">
        {seriesList.map((s, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: s.color || MODERN_PALETTE[idx % MODERN_PALETTE.length] }}
            />
            <span className="font-medium text-foreground">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 3. Native Interactive Line & Area Chart Renderer
// -------------------------------------------------------------
export const NativeLineAreaChart: React.FC<{
  config: ChartConfig;
  isExpanded: boolean;
  zoomScale: number;
}> = ({ config, isExpanded, zoomScale }) => {
  const [crosshairIdx, setCrosshairIdx] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isArea = config.chart_type?.includes("area");
  const xLabels = config.x_labels || [];
  const seriesList = config.series || [];
  const unit = seriesList[0]?.unit || "kWh";

  const catCount = Math.max(xLabels.length, 1);
  const maxVal = useMemo(() => {
    let m = 0;
    seriesList.forEach((s) => {
      s.data.forEach((val) => {
        if (typeof val === "number" && val > m) m = val;
      });
    });
    return m * 1.15 || 100;
  }, [seriesList]);

  const chartW = Math.max(760, catCount * 18);
  const chartH = isExpanded ? 460 : 320;
  const padLeft = 65;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 55;
  const plotW = chartW - padLeft - padRight;
  const plotH = chartH - padTop - padBottom;

  const slotW = catCount > 1 ? plotW / (catCount - 1) : plotW;

  // Generate paths
  const seriesPaths = seriesList.map((s, sIdx) => {
    const color = s.color || MODERN_PALETTE[sIdx % MODERN_PALETTE.length];
    const pts = s.data.map((val, idx) => {
      const v = typeof val === "number" ? val : 0;
      const x = padLeft + idx * slotW;
      const y = padTop + plotH - (v / maxVal) * plotH;
      return { x, y, val: v };
    });

    const linePath = pts.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");
    const areaPath = pts.length > 0 ? `${linePath} L ${pts[pts.length - 1].x} ${padTop + plotH} L ${pts[0].x} ${padTop + plotH} Z` : "";

    return { s, color, pts, linePath, areaPath };
  });

  const ticks = Array.from({ length: 6 }, (_, i) => (maxVal / 5) * i);

  const handlePointerMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - padLeft;
    const closestIdx = Math.max(0, Math.min(Math.round(mouseX / slotW), catCount - 1));
    setCrosshairIdx(closestIdx);

    const label = xLabels[closestIdx] || `Index ${closestIdx}`;
    const items = seriesList.map((s, idx) => {
      const val = s.data[closestIdx];
      return {
        label: s.name,
        value: typeof val === "number" ? `${val.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${s.unit || unit}` : "N/A",
        color: s.color || MODERN_PALETTE[idx % MODERN_PALETTE.length],
      };
    });

    setTooltip({
      visible: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      title: label,
      items,
    });
  };

  return (
    <div ref={containerRef} className="relative w-full overflow-x-auto py-2">
      <FloatingTooltip tooltip={tooltip} />
      <div
        className="min-w-full transition-transform duration-200"
        style={{ transform: `scale(${zoomScale})`, transformOrigin: "top left" }}
      >
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="w-full h-auto overflow-visible select-none cursor-crosshair"
          onMouseMove={handlePointerMove}
          onMouseLeave={() => {
            setCrosshairIdx(null);
            setTooltip(null);
          }}
        >
          <defs>
            {seriesPaths.map((sp, idx) => (
              <linearGradient key={idx} id={`grad-series-${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={sp.color} stopOpacity="0.35" />
                <stop offset="100%" stopColor={sp.color} stopOpacity="0.02" />
              </linearGradient>
            ))}
          </defs>

          {/* Gridlines */}
          {ticks.map((val, i) => {
            const y = padTop + plotH - (val / maxVal) * plotH;
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + plotW}
                  y2={y}
                  stroke="hsl(var(--border))"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-muted-foreground text-[10px] font-mono"
                >
                  {val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </text>
              </g>
            );
          })}

          {/* Areas */}
          {isArea &&
            seriesPaths.map((sp, idx) => (
              <path key={idx} d={sp.areaPath} fill={`url(#grad-series-${idx})`} />
            ))}

          {/* Lines */}
          {seriesPaths.map((sp, idx) => (
            <path
              key={idx}
              d={sp.linePath}
              fill="none"
              stroke={sp.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Crosshair & Points */}
          {crosshairIdx !== null && (
            <g>
              <line
                x1={padLeft + crosshairIdx * slotW}
                y1={padTop}
                x2={padLeft + crosshairIdx * slotW}
                y2={padTop + plotH}
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              {seriesPaths.map((sp, idx) => {
                const pt = sp.pts[crosshairIdx];
                if (!pt) return null;
                return (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={5}
                    fill={sp.color}
                    stroke="hsl(var(--background))"
                    strokeWidth="2"
                    className="drop-shadow-xs"
                  />
                );
              })}
            </g>
          )}

          {/* X-Axis Ticks */}
          {xLabels.map((lbl, idx) => {
            const step = Math.max(1, Math.floor(catCount / 12));
            if (idx % step !== 0 && idx !== catCount - 1) return null;
            const x = padLeft + idx * slotW;
            return (
              <text
                key={idx}
                x={x}
                y={padTop + plotH + 18}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px] font-medium"
              >
                {lbl}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Series Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs">
        {seriesList.map((s, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: s.color || MODERN_PALETTE[idx % MODERN_PALETTE.length] }}
            />
            <span className="font-medium text-foreground">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 4. Native Demand Utilization Gauge
// -------------------------------------------------------------
export const NativeDemandGauge: React.FC<{
  config: ChartConfig;
  isExpanded: boolean;
}> = ({ config, isExpanded }) => {
  const g = config.gauge_data;
  if (!g) return null;

  const current = g.current_value;
  const maxVal = g.max_value || 1475.0;
  const threshold = g.threshold_value || 1180.0;
  const pct = Math.min(Math.max((current / maxVal) * 100, 0), 100);

  const isExcursion = current > threshold;
  const color = isExcursion ? "#DC2626" : pct > 70 ? "#D97706" : "#059669";
  const arcCircumference = 314.16;

  return (
    <div className="flex flex-col items-center justify-center py-6 w-full">
      <div
        className={cn(
          "relative flex items-end justify-center overflow-hidden transition-all duration-300",
          isExpanded ? "h-64 w-88 sm:w-[420px]" : "h-48 sm:h-52 w-72 sm:w-80"
        )}
      >
        <svg className="w-full h-full" viewBox="0 0 240 130">
          <path
            d="M 20 120 A 100 100 0 0 1 220 120"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="24"
            strokeLinecap="round"
          />
          <path
            d="M 20 120 A 100 100 0 0 1 220 120"
            fill="none"
            stroke="rgba(217, 119, 6, 0.35)"
            strokeWidth="24"
            strokeDasharray={`${arcCircumference * 0.8} ${arcCircumference * 0.2}`}
            strokeDashoffset="0"
            strokeLinecap="round"
          />
          <path
            d="M 20 120 A 100 100 0 0 1 220 120"
            fill="none"
            stroke={color}
            strokeWidth="24"
            strokeDasharray={arcCircumference}
            strokeDashoffset={arcCircumference * (1 - pct / 100)}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        <div className="absolute inset-x-0 bottom-2 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {current.toFixed(1)}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {g.unit} Recorded Peak Demand
          </span>
          <span className="text-xs sm:text-sm font-semibold text-muted-foreground mt-0.5">
            {pct.toFixed(1)}% Capacity Utilization
          </span>
        </div>
      </div>

      <div className="mt-4 flex w-full max-w-sm items-center justify-between text-xs text-muted-foreground border-t pt-3">
        <span>0 {g.unit}</span>
        <span className="font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
          80% Warning: {threshold} {g.unit}
        </span>
        <span className="font-semibold text-foreground">Contract: {maxVal} {g.unit}</span>
      </div>

      <div
        className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
        style={{
          backgroundColor: isExcursion ? "rgba(220, 38, 38, 0.15)" : "rgba(5, 150, 105, 0.15)",
          color: isExcursion ? "#DC2626" : "#059669",
        }}
      >
        <span className="size-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
        Status: {g.status || (isExcursion ? "THRESHOLD EXCURSION (>1180 kVA)" : "NORMAL OPERATING RANGE")}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 5. Native Load Heatmap
// -------------------------------------------------------------
export const NativeHeatmap: React.FC<{
  config: ChartConfig;
}> = ({ config }) => {
  const hm = config.heatmap_data;
  if (!hm) return null;

  const allVals = hm.z_matrix.flat();
  const maxVal = Math.max(...allVals, 1);
  const minVal = Math.min(...allVals, 0);

  return (
    <div className="overflow-x-auto py-3 w-full">
      <div className="min-w-[650px]">
        <div className="grid grid-cols-25 gap-1 text-[10px] font-medium text-muted-foreground mb-1.5 text-center">
          <div className="w-16 text-left font-semibold">Date</div>
          {hm.x_labels.map((h, i) => (
            <div key={i}>{h.replace(":00", "")}</div>
          ))}
        </div>
        {hm.y_labels.map((date, rIdx) => (
          <div key={rIdx} className="grid grid-cols-25 gap-1 items-center mb-1.5">
            <div className="w-16 text-xs font-medium text-muted-foreground truncate">{date.slice(5)}</div>
            {(hm.z_matrix[rIdx] || []).map((val, cIdx) => {
              const intensity = (val - minVal) / (maxVal - minVal || 1);
              const bg = `rgba(37, 99, 235, ${Math.max(0.12, intensity)})`;
              return (
                <div
                  key={cIdx}
                  className="h-7 sm:h-8 rounded-sm transition-transform hover:scale-110 hover:ring-2 hover:ring-primary cursor-pointer shadow-2xs"
                  style={{ backgroundColor: bg }}
                  title={`${date} ${hm.x_labels[cIdx]}: ${val.toFixed(1)} ${hm.z_label}`}
                />
              );
            })}
          </div>
        ))}
        <div className="mt-3 flex items-center justify-end gap-3 text-xs text-muted-foreground">
          <span>Low ({minVal.toFixed(1)} {hm.z_label})</span>
          <div className="h-2.5 w-24 rounded-full bg-gradient-to-r from-blue-100 to-blue-600 dark:from-blue-950 dark:to-blue-500" />
          <span>High ({maxVal.toFixed(1)} {hm.z_label})</span>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 6. Native Scatter / Correlation Pair Plot
// -------------------------------------------------------------
export const NativeScatterPlot: React.FC<{
  config: ChartConfig;
  isExpanded: boolean;
  zoomScale: number;
}> = ({ config, isExpanded, zoomScale }) => {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const seriesList = config.scatter_series || [];

  const allPoints = seriesList.flatMap((s) => s.points);
  const maxX = Math.max(...allPoints.map((p) => p.x), 100) * 1.1;
  const maxY = Math.max(...allPoints.map((p) => p.y), 100) * 1.1;

  const chartW = 760;
  const chartH = isExpanded ? 460 : 340;
  const padLeft = 65;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 55;
  const plotW = chartW - padLeft - padRight;
  const plotH = chartH - padTop - padBottom;

  return (
    <div ref={containerRef} className="relative w-full overflow-x-auto py-2">
      <FloatingTooltip tooltip={tooltip} />
      <div
        className="min-w-full transition-transform duration-200"
        style={{ transform: `scale(${zoomScale})`, transformOrigin: "top left" }}
      >
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto overflow-visible select-none">
          <line
            x1={padLeft}
            y1={padTop + plotH}
            x2={padLeft + plotW}
            y2={padTop + plotH}
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
          />
          <line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={padTop + plotH}
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
          />

          {seriesList.map((s, sIdx) => {
            const color = s.color || MODERN_PALETTE[sIdx % MODERN_PALETTE.length];
            return s.points.map((pt, pIdx) => {
              const cx = padLeft + (pt.x / maxX) * plotW;
              const cy = padTop + plotH - (pt.y / maxY) * plotH;
              return (
                <circle
                  key={`${sIdx}-${pIdx}`}
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill={color}
                  stroke="hsl(var(--background))"
                  strokeWidth="1.5"
                  className="cursor-pointer transition-transform hover:scale-150"
                  onMouseMove={(e) => {
                    if (!containerRef.current) return;
                    const rect = containerRef.current.getBoundingClientRect();
                    setTooltip({
                      visible: true,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                      title: pt.label || s.name,
                      items: [
                        { label: config.x_axis_label || "X", value: pt.x.toFixed(1), color },
                        { label: config.y_axis_label || "Y", value: pt.y.toFixed(1), color },
                      ],
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            });
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs">
        {seriesList.map((s, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: s.color || MODERN_PALETTE[idx % MODERN_PALETTE.length] }}
            />
            <span className="font-medium text-foreground">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 7. Dynamic Mermaid Graph Generator
// -------------------------------------------------------------
export const generateMermaidGraph = (config: ChartConfig): string => {
  if (config.mermaid_code) return config.mermaid_code;

  const title = config.title.replace(/["\n]/g, "");
  const xLabels = config.x_labels || [];
  const series = config.series || [];

  if (config.chart_type === "donut" || config.chart_type === "pie") {
    const s0 = series[0];
    const unit = s0?.unit || "kWh";
    let mm = `graph TD\n  Root["⚡ ${title}"]\n`;
    xLabels.slice(0, 10).forEach((label, idx) => {
      const val = s0?.data[idx];
      const cleanLabel = label.replace(/["\n]/g, "");
      const valStr = typeof val === "number" ? `${val.toLocaleString()} ${unit}` : "0";
      mm += `  Root --> Node_${idx}["${cleanLabel}<br/><b>${valStr}</b>"]\n`;
    });
    return mm;
  }

  if (config.chart_type === "shift_comparison") {
    return (
      `graph LR\n` +
      `  subgraph Shift_A [🌅 Shift A: Morning Surge]\n` +
      `    A1[Peak Machinery Load]\n` +
      `  end\n` +
      `  subgraph Shift_B [🌇 Shift B: Evening Peak]\n` +
      `    B1[Production Peak]\n` +
      `  end\n` +
      `  subgraph Shift_C [🌙 Shift C: Night Baseload]\n` +
      `    C1[Idle Baseload Leaks]\n` +
      `  end\n` +
      `  Shift_A --> Shift_B --> Shift_C\n`
    );
  }

  // Fallback hierarchical breakdown graph
  let mm = `graph TD\n  Header["📊 ${title}"]\n`;
  xLabels.slice(0, 8).forEach((label, idx) => {
    const cleanLabel = label.replace(/["\n]/g, "");
    mm += `  Header --> Item_${idx}["${cleanLabel}"]\n`;
  });
  return mm;
};

// -------------------------------------------------------------
// 8. Tabular View Component
// -------------------------------------------------------------
export const ChartDataTable: React.FC<{ config: ChartConfig }> = ({ config }) => {
  const xLabels = config.x_labels || [];
  const seriesList = config.series || [];

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border/60 bg-muted/20 my-2">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b bg-muted/40 font-semibold text-foreground">
            <th className="p-2.5">Category / Interval</th>
            {seriesList.map((s, idx) => (
              <th key={idx} className="p-2.5 text-right">
                {s.name} ({s.unit || "kWh"})
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {xLabels.map((lbl, rIdx) => (
            <tr key={rIdx} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
              <td className="p-2.5 font-medium text-foreground">{lbl}</td>
              {seriesList.map((s, cIdx) => (
                <td key={cIdx} className="p-2.5 text-right font-mono text-muted-foreground">
                  {typeof s.data[rIdx] === "number"
                    ? (s.data[rIdx] as number).toLocaleString(undefined, { maximumFractionDigits: 1 })
                    : "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// -------------------------------------------------------------
// Universal Interactive Chart Renderer
// -------------------------------------------------------------
export const UniversalChartRenderer: React.FC<{
  config: ChartConfig;
  isExpanded?: boolean;
  viewMode: "chart" | "graph" | "table";
  zoomScale: number;
}> = ({ config, isExpanded = false, viewMode, zoomScale }) => {
  if (viewMode === "table") {
    return <ChartDataTable config={config} />;
  }

  if (viewMode === "graph") {
    const mermaidCode = generateMermaidGraph(config);
    return (
      <div className="w-full overflow-hidden rounded-xl border border-border/50 bg-background/50 p-2">
        <MermaidDiagram code={mermaidCode} />
      </div>
    );
  }

  const chartType = config.chart_type?.toLowerCase() || "bar";

  if (chartType === "donut" || chartType === "pie") {
    return <NativeDonutChart config={config} isExpanded={isExpanded} zoomScale={zoomScale} />;
  }

  if (chartType === "gauge" && config.gauge_data) {
    return <NativeDemandGauge config={config} isExpanded={isExpanded} />;
  }

  if (chartType === "heatmap" && config.heatmap_data) {
    return <NativeHeatmap config={config} />;
  }

  if (chartType === "scatter" || chartType === "pair_plot") {
    return <NativeScatterPlot config={config} isExpanded={isExpanded} zoomScale={zoomScale} />;
  }

  if (chartType.includes("line") || chartType.includes("area")) {
    return <NativeLineAreaChart config={config} isExpanded={isExpanded} zoomScale={zoomScale} />;
  }

  return <NativeBarChart config={config} isExpanded={isExpanded} zoomScale={zoomScale} />;
};

// -------------------------------------------------------------
// Chart Card Container with SDK Controls (Zoom, Pan, Fullscreen)
// -------------------------------------------------------------
export const ChartCardContainer: React.FC<{
  config?: ChartConfig;
  isRunning?: boolean;
}> = ({ config, isRunning }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<"chart" | "graph" | "table">("chart");
  const [zoomScale, setZoomScale] = useState(1);
  const [copied, setCopied] = useState(false);

  const handleCopyData = () => {
    if (!config) return;
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const zoomIn = () => setZoomScale((s) => Math.min(s + 0.2, 2.5));
  const zoomOut = () => setZoomScale((s) => Math.max(s - 0.2, 0.6));
  const resetZoom = () => setZoomScale(1);

  if (isRunning) {
    return (
      <div className="my-4 flex items-center justify-center rounded-2xl border bg-card/90 p-8 text-card-foreground shadow-xs">
        <div className="flex flex-col items-center gap-2">
          <RefreshCwIcon className="size-6 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Aggregating telemetric datasets & rendering optimal visualization...
          </span>
        </div>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div
      className={cn(
        "my-4 w-full rounded-2xl border bg-card/95 p-5 sm:p-6 text-card-foreground shadow-xs transition-all backdrop-blur-xs",
        isExpanded ? "ring-2 ring-primary/40 shadow-2xl" : ""
      )}
    >
      {/* Header & Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
            {config.chart_type === "donut" || config.chart_type === "pie" ? (
              <PieChartIcon className="size-5" />
            ) : config.chart_type === "gauge" ? (
              <GaugeIcon className="size-5" />
            ) : config.chart_type === "heatmap" ? (
              <GridIcon className="size-5" />
            ) : config.chart_type === "scatter" || config.chart_type === "pair_plot" ? (
              <TrendingUpIcon className="size-5" />
            ) : (
              <BarChart3Icon className="size-5" />
            )}
          </div>
          <div>
            <h4 className="text-base font-semibold leading-tight text-foreground">{config.title}</h4>
            {config.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{config.subtitle}</p>}
          </div>
        </div>

        {/* View Mode & Zoom Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
            <Button
              variant={viewMode === "chart" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={() => setViewMode("chart")}
              title="Visual Chart View"
            >
              <BarChart3Icon className="size-3.5" />
              <span className="hidden sm:inline">Chart</span>
            </Button>
            <Button
              variant={viewMode === "graph" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={() => setViewMode("graph")}
              title="Interactive Mermaid Graph View"
            >
              <GitForkIcon className="size-3.5" />
              <span className="hidden sm:inline">Graph</span>
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={() => setViewMode("table")}
              title="Data Table View"
            >
              <TableIcon className="size-3.5" />
              <span className="hidden sm:inline">Table</span>
            </Button>
          </div>

          {/* Zoom In / Out / Reset */}
          {viewMode !== "table" && (
            <div className="hidden sm:flex items-center rounded-lg border bg-muted/40 p-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={zoomOut}
                title="Zoom Out"
              >
                <MinusIcon className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={resetZoom}
                title="Reset Zoom"
              >
                <RotateCcwIcon className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={zoomIn}
                title="Zoom In"
              >
                <PlusIcon className="size-3.5" />
              </Button>
            </div>
          )}

          {/* Copy JSON */}
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={handleCopyData}
            title="Copy chart data as JSON"
          >
            {copied ? <CheckIcon className="size-3.5 text-emerald-500" /> : <CopyIcon className="size-3.5" />}
          </Button>

          {/* Expand Fullscreen */}
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded((prev) => !prev)}
            title={isExpanded ? "Collapse view" : "Expand view"}
          >
            {isExpanded ? <Minimize2Icon className="size-3.5" /> : <Maximize2Icon className="size-3.5" />}
          </Button>
        </div>
      </div>

      {/* Main Chart Body */}
      <div className={cn("transition-all duration-300", isExpanded ? "min-h-[500px]" : "")}>
        <UniversalChartRenderer
          config={config}
          isExpanded={isExpanded}
          viewMode={viewMode}
          zoomScale={zoomScale}
        />
      </div>

      {/* AI Representation Reason Callout */}
      {config.representation_reason && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-muted/30 px-3 py-2 text-xs text-muted-foreground border border-border/40">
          <SparklesIcon className="size-3.5 shrink-0 text-primary mt-0.5" />
          <span>{config.representation_reason}</span>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// Assistant-UI Tool Registrations (Configured as Standalone)
// -------------------------------------------------------------
export const AggregateEnergyToolUI = makeAssistantToolUI<any, any>({
  toolName: "aggregate_energy_telemetry",
  display: "standalone",
  render: function AggregateTool({ args, result, status }) {
    const config = result?.chart_config || result;
    return <ChartCardContainer config={config} isRunning={status.type === "running"} />;
  },
});

export const BreakdownChartToolUI = makeAssistantToolUI<any, any>({
  toolName: "create_breakdown_chart",
  display: "standalone",
  render: function BreakdownTool({ args, result, status }) {
    const config = result?.chart_config || result;
    return <ChartCardContainer config={config} isRunning={status.type === "running"} />;
  },
});

export const TimeSeriesChartToolUI = makeAssistantToolUI<any, any>({
  toolName: "create_time_series_chart",
  display: "standalone",
  render: function TimeSeriesTool({ args, result, status }) {
    const config = result?.chart_config || result;
    return <ChartCardContainer config={config} isRunning={status.type === "running"} />;
  },
});

export const DemandGaugeToolUI = makeAssistantToolUI<any, any>({
  toolName: "create_demand_utilization_gauge",
  display: "standalone",
  render: function DemandGaugeTool({ args, result, status }) {
    const config = result?.chart_config || result;
    return <ChartCardContainer config={config} isRunning={status.type === "running"} />;
  },
});

export const LoadHeatmapToolUI = makeAssistantToolUI<any, any>({
  toolName: "create_load_heatmap",
  display: "standalone",
  render: function HeatmapTool({ args, result, status }) {
    const config = result?.chart_config || result;
    return <ChartCardContainer config={config} isRunning={status.type === "running"} />;
  },
});

export const ShiftComparisonChartToolUI = makeAssistantToolUI<any, any>({
  toolName: "create_shift_comparison_chart",
  display: "standalone",
  render: function ShiftCompTool({ args, result, status }) {
    const config = result?.chart_config || result;
    return <ChartCardContainer config={config} isRunning={status.type === "running"} />;
  },
});

export const ScatterPlotChartToolUI = makeAssistantToolUI<any, any>({
  toolName: "create_correlation_scatter_plot",
  display: "standalone",
  render: function ScatterPlotTool({ args, result, status }) {
    const config = result?.chart_config || result;
    return <ChartCardContainer config={config} isRunning={status.type === "running"} />;
  },
});

export const AllChartToolsUI = () => (
  <>
    <AggregateEnergyToolUI />
    <BreakdownChartToolUI />
    <TimeSeriesChartToolUI />
    <DemandGaugeToolUI />
    <LoadHeatmapToolUI />
    <ShiftComparisonChartToolUI />
    <ScatterPlotChartToolUI />
  </>
);
