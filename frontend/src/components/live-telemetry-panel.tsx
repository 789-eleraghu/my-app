import React, { useEffect, useState } from "react";
import {
  RadioIcon,
  RefreshCwIcon,
  ZapIcon,
  ActivityIcon,
  GaugeIcon,
  ClockIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface TelemetryDevice {
  device_id: string;
  device_name: string;
  category: string;
  prefix: string;
  voltage_avg: number;
  current_avg: number;
  power_factor: number;
  real_power_kw: number;
  apparent_power_kva: number;
  reactive_power_kvar: number;
  frequency_hz: number;
  status: string;
  last_updated_ist: string;
}

export function LiveTelemetryPanel({
  onSelectDevice,
}: {
  onSelectDevice?: (deviceName: string) => void;
}) {
  const [devices, setDevices] = useState<TelemetryDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const fetchTelemetry = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/telemetry/live");
      if (res.ok) {
        const data = await res.json();
        setDevices(data.telemetry || []);
        setLastRefreshed(data.timestamp_ist || new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error("Failed to fetch live telemetry:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 15000); // 15s live refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <RadioIcon className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                Component 10: Real-Time Telemetry
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Section 14 representative live meter registry
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={fetchTelemetry}
            disabled={isLoading}
            title="Refresh live telemetry"
          >
            <RefreshCwIcon className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="text-[10px] text-muted-foreground flex justify-between">
          <span>Active Monitored Feeds: <strong>{devices.length}</strong></span>
          <span>Last Sync: {lastRefreshed || "Just now"}</span>
        </div>
      </div>

      {/* Grid of Devices */}
      <div className="grid grid-cols-1 gap-2.5">
        {devices.map((device) => {
          const isWarning = device.status === "WARNING" || device.status === "CRITICAL";
          const isStandby = device.status === "STANDBY";

          return (
            <div
              key={device.device_id}
              onClick={() => onSelectDevice?.(device.device_name)}
              className="group cursor-pointer rounded-xl border bg-card p-3 shadow-xs transition-all hover:border-primary/50 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground group-hover:text-primary">
                      {device.device_name}
                    </span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                      {device.category}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono truncate block max-w-[220px]">
                    {device.prefix}
                  </span>
                </div>

                <Badge
                  variant={isWarning ? "destructive" : "secondary"}
                  className={`text-[9px] px-1.5 py-0 h-4 uppercase ${
                    isStandby
                      ? "bg-muted text-muted-foreground"
                      : isWarning
                      ? "bg-destructive/15 text-destructive"
                      : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  }`}
                >
                  {device.status}
                </Badge>
              </div>

              <div className="mt-2.5 grid grid-cols-4 gap-1.5 rounded-lg bg-muted/40 p-2 text-center text-[10px]">
                <div>
                  <span className="text-muted-foreground block">Power</span>
                  <strong className="text-foreground text-xs">{device.real_power_kw.toFixed(1)}</strong> kW
                </div>
                <div>
                  <span className="text-muted-foreground block">Voltage</span>
                  <strong className="text-foreground text-xs">{device.voltage_avg.toFixed(1)}</strong> V
                </div>
                <div>
                  <span className="text-muted-foreground block">Current</span>
                  <strong className="text-foreground text-xs">{device.current_avg.toFixed(1)}</strong> A
                </div>
                <div>
                  <span className="text-muted-foreground block">P.F.</span>
                  <strong className="text-foreground text-xs">{device.power_factor.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
