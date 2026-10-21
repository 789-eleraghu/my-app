"use client";

import React from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import {
  ZapIcon,
  ClockIcon,
  IndianRupeeIcon,
  GaugeIcon,
  ActivityIcon,
  RadioIcon,
  CpuIcon,
  RefreshCwIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  CalendarIcon,
  FuelIcon,
} from "lucide-react";

// 1. Facility Energy Consumption Tool UI
export const EnergyConsumptionToolUI = makeAssistantToolUI<any, any>({
  toolName: "get_energy_consumption",
  render: function EnergyTool({ args, result, status }) {
    const isRunning = status.type === "running";
    const date = args?.date || result?.date || "2026-10-20";
    const kwh = result?.energy_kwh ?? 0;
    const tag = result?.tag_id || "HT_Room.11kV_Main_Incomer";

    return (
      <div className="my-2.5 rounded-xl border bg-card p-4 text-card-foreground shadow-sm max-w-md">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <ZapIcon className="size-5" />
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Main Incomer Energy</span>
              <h4 className="text-sm font-semibold">{date}</h4>
            </div>
          </div>
          {isRunning ? (
            <RefreshCwIcon className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Counter Delta Verified
            </span>
          )}
        </div>

        <div className="mt-3 rounded-lg bg-muted/40 p-3">
          {isRunning ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 animate-pulse rounded-full bg-primary" />
              Calculating cumulative reading delta on main feeder...
            </div>
          ) : (
            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {kwh.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-base font-normal text-muted-foreground">kWh</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="truncate max-w-[200px]" title={tag}>Meter: {tag.split("/")[0]}</span>
                <span>Source: {result?.source || "Daily Rollup"}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
});

// 2. Shift-wise Consumption Tool UI
export const ShiftWiseToolUI = makeAssistantToolUI<any, any>({
  toolName: "get_shift_wise_consumption",
  render: function ShiftTool({ args, result, status }) {
    const isRunning = status.type === "running";
    const date = args?.date || result?.date || "2026-10-20";
    const shiftA = result?.shift_a_kwh ?? 0;
    const shiftB = result?.shift_b_kwh ?? 0;
    const shiftC = result?.shift_c_kwh ?? 0;
    const total = result?.total_shifts_kwh ?? (shiftA + shiftB + shiftC);

    const pctA = total > 0 ? (shiftA / total) * 100 : 0;
    const pctB = total > 0 ? (shiftB / total) * 100 : 0;
    const pctC = total > 0 ? (shiftC / total) * 100 : 0;

    return (
      <div className="my-2.5 rounded-xl border bg-card p-4 text-card-foreground shadow-sm max-w-lg">
        <div className="flex items-start justify-between border-b pb-2.5 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <ClockIcon className="size-5" />
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Shift Boundaries (00:40 Rule)</span>
              <h4 className="text-sm font-semibold">{date}</h4>
            </div>
          </div>
          {isRunning && <RefreshCwIcon className="size-4 animate-spin text-muted-foreground" />}
        </div>

        {isRunning ? (
          <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
            <span className="size-2 animate-pulse rounded-full bg-primary" />
            Resolving nearest boundary counter readings...
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-muted/40 p-2.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Shift A (08:00 - 17:00)</span>
                <div className="text-sm font-bold text-foreground mt-0.5">{shiftA.toLocaleString()} kWh</div>
                <div className="text-[10px] text-muted-foreground">{pctA.toFixed(1)}% of day</div>
              </div>
              <div className="rounded-lg bg-muted/40 p-2.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Shift B (17:00 - 00:40)</span>
                <div className="text-sm font-bold text-foreground mt-0.5">{shiftB.toLocaleString()} kWh</div>
                <div className="text-[10px] text-muted-foreground">{pctB.toFixed(1)}% of day</div>
              </div>
              <div className="rounded-lg bg-muted/40 p-2.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Shift C (00:40 - 08:00)</span>
                <div className="text-sm font-bold text-foreground mt-0.5">{shiftC.toLocaleString()} kWh</div>
                <div className="text-[10px] text-muted-foreground">{pctC.toFixed(1)}% of day</div>
              </div>
            </div>

            {/* Visual ratio bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted flex">
              <div style={{ width: `${pctA}%` }} className="bg-blue-600" title={`Shift A: ${pctA.toFixed(1)}%`} />
              <div style={{ width: `${pctB}%` }} className="bg-emerald-600" title={`Shift B: ${pctB.toFixed(1)}%`} />
              <div style={{ width: `${pctC}%` }} className="bg-amber-600" title={`Shift C: ${pctC.toFixed(1)}%`} />
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
              <span>Total Shifts Sum: <strong className="text-foreground">{total.toLocaleString()} kWh</strong></span>
              <span className="text-[10px]">Meter: HT_Room Incomer</span>
            </div>
          </div>
        )}
      </div>
    );
  },
});

// 3. Tariff & Cost Tool UI
export const CostTariffToolUI = makeAssistantToolUI<any, any>({
  toolName: "get_cost_and_tariff",
  render: function TariffTool({ args, result, status }) {
    const isRunning = status.type === "running";
    const date = args?.date || result?.date || "2026-10-20";
    const cost = result?.total_cost_inr ?? 0;
    const kwh = result?.true_daily_kwh ?? 0;
    const bands = result?.band_summary || {};

    return (
      <div className="my-2.5 rounded-xl border bg-card p-4 text-card-foreground shadow-sm max-w-lg">
        <div className="flex items-start justify-between border-b pb-2.5 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <IndianRupeeIcon className="size-5" />
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Tariff HT_1 Cost Billing</span>
              <h4 className="text-sm font-semibold">{date}</h4>
            </div>
          </div>
          <span className="rounded-md border bg-muted/40 px-2 py-0.5 text-xs font-semibold text-foreground">
            ₹{cost > 0 && kwh > 0 ? (cost / kwh).toFixed(2) : "0.00"} / kWh
          </span>
        </div>

        {isRunning ? (
          <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
            <span className="size-2 animate-pulse rounded-full bg-primary" />
            Rescaling hourly intervals with true daily counter delta...
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg bg-muted/40 p-3 flex justify-between items-baseline">
              <div>
                <span className="text-xs text-muted-foreground">Total Daily Billed Cost</span>
                <div className="text-2xl font-bold text-foreground">₹{cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">True Energy Billed</span>
                <div className="text-sm font-semibold text-foreground">{kwh.toLocaleString()} kWh</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg border p-2 bg-card">
                <span className="text-[10px] text-muted-foreground block font-medium">PEAK (₹9.375)</span>
                <span className="font-semibold text-foreground block mt-0.5">₹{(bands?.Peak?.cost || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                <span className="text-[10px] text-muted-foreground">{(bands?.Peak?.kwh || 0).toLocaleString()} kWh</span>
              </div>
              <div className="rounded-lg border p-2 bg-card">
                <span className="text-[10px] text-muted-foreground block font-medium">NORMAL (₹7.50)</span>
                <span className="font-semibold text-foreground block mt-0.5">₹{(bands?.Normal?.cost || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                <span className="text-[10px] text-muted-foreground">{(bands?.Normal?.kwh || 0).toLocaleString()} kWh</span>
              </div>
              <div className="rounded-lg border p-2 bg-card">
                <span className="text-[10px] text-muted-foreground block font-medium">OFF-PEAK (₹7.125)</span>
                <span className="font-semibold text-foreground block mt-0.5">₹{(bands?.['Off-Peak']?.cost || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                <span className="text-[10px] text-muted-foreground">{(bands?.['Off-Peak']?.kwh || 0).toLocaleString()} kWh</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
});

// 4. Peak Demand Tool UI
export const PeakDemandToolUI = makeAssistantToolUI<any, any>({
  toolName: "get_peak_demand_analysis",
  render: function PeakTool({ args, result, status }) {
    const isRunning = status.type === "running";
    const date = args?.date || result?.date || "2026-10-20";
    const peakKva = result?.peak_kva ?? 0;
    const contractKva = result?.contracted_demand_kva ?? 1475.0;
    const utilPct = result?.utilization_percent ?? 0;
    const excursions = result?.excursion_events_count ?? 0;

    return (
      <div className="my-2.5 rounded-xl border bg-card p-4 text-card-foreground shadow-sm max-w-md">
        <div className="flex items-start justify-between border-b pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <GaugeIcon className="size-5" />
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">South Transformer Peak Demand</span>
              <h4 className="text-sm font-semibold">{date}</h4>
            </div>
          </div>
          {excursions > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
              <AlertTriangleIcon className="size-3" /> {excursions} Excursions
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2Icon className="size-3" /> Within Limit
            </span>
          )}
        </div>

        {isRunning ? (
          <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
            <span className="size-2 animate-pulse rounded-full bg-primary" />
            Scanning 1-minute apparent power intervals...
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-foreground">{peakKva.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">kVA</span></div>
              <div className="text-right text-xs">
                <span className="font-semibold text-foreground">{utilPct.toFixed(1)}%</span> of 1475 kVA
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground flex justify-between">
              <span>Peak Time: {result?.peak_timestamp || "N/A"}</span>
              <span>80% Warning Limit: 1180 kVA</span>
            </div>
          </div>
        )}
      </div>
    );
  },
});

// 5. Real-Time Telemetry Tool UI (Component 10)
export const LiveTelemetryToolUI = makeAssistantToolUI<any, any>({
  toolName: "get_realtime_device_telemetry",
  render: function TelemetryTool({ args, result, status }) {
    const isRunning = status.type === "running";
    const telemetry = result?.telemetry || [];

    return (
      <div className="my-2.5 rounded-xl border bg-card p-4 text-card-foreground shadow-sm max-w-xl">
        <div className="flex items-start justify-between border-b pb-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <RadioIcon className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-foreground">Component 10: Real-Time Telemetry</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Live meter telemetry snapshots</p>
            </div>
          </div>
          {isRunning && <RefreshCwIcon className="size-4 animate-spin text-muted-foreground" />}
        </div>

        {isRunning ? (
          <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
            <span className="size-2 animate-pulse rounded-full bg-primary" />
            Querying live OPC-DA telemetry registers...
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {telemetry.map((t: any) => (
              <div key={t.device_id} className="flex items-center justify-between rounded-lg bg-muted/40 p-2 text-xs">
                <div>
                  <div className="font-semibold text-foreground">{t.device_name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {t.voltage_avg?.toFixed(1)}V | {t.current_avg?.toFixed(1)}A | PF: {t.power_factor?.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-foreground">{t.real_power_kw?.toFixed(1)} kW</div>
                  <span className={`inline-block text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded ${t.status === "NORMAL" ? "text-emerald-600 bg-emerald-500/10" : "text-amber-600 bg-amber-500/10"}`}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
});

// 6. Current Datetime & Shift Tool UI
export const CurrentDateTimeToolUI = makeAssistantToolUI<any, any>({
  toolName: "get_current_datetime_ist",
  render: function DateTimeTool({ result, status }) {
    if (status.type === "running") return null;
    return (
      <div className="my-2 inline-flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-1.5 text-xs">
        <ClockIcon className="size-3.5 text-primary" />
        <span className="font-medium text-foreground">Active Shift {result?.active_shift || "A"}</span>
        <span className="text-muted-foreground">({result?.active_shift_window})</span>
        <span className="text-[10px] text-muted-foreground">| IST: {result?.current_time}</span>
      </div>
    );
  },
});

export const AllEnergyToolsUI = () => (
  <>
    <EnergyConsumptionToolUI />
    <ShiftWiseToolUI />
    <CostTariffToolUI />
    <PeakDemandToolUI />
    <LiveTelemetryToolUI />
    <CurrentDateTimeToolUI />
  </>
);
