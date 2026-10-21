"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { CloudSunIcon, MapPinIcon, RefreshCwIcon, ThermometerIcon, WindIcon } from "lucide-react";

type WeatherArgs = {
  city: string;
};

export const WeatherToolUI = makeAssistantToolUI<WeatherArgs, string>({
  toolName: "get_current_weather",
  render: function WeatherTool({ args, result, status }) {
    const isRunning = status.type === "running";
    const city = args?.city || "Unknown Location";

    return (
      <div className="my-2.5 max-w-sm rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <CloudSunIcon className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <MapPinIcon className="size-3" />
                <span>Weather Forecast</span>
              </div>
              <h4 className="text-base font-semibold leading-tight">{city}</h4>
            </div>
          </div>
          {isRunning && (
            <RefreshCwIcon className="size-4 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="mt-3 rounded-lg bg-muted/50 p-2.5 text-sm">
          {isRunning ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="size-2 animate-pulse rounded-full bg-primary" />
              <span>Checking weather satellite data...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-medium text-foreground">
                {result || "Sunny, 24°C / 75°F"}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ThermometerIcon className="size-3" /> Feels like 25°C
                </span>
                <span className="flex items-center gap-1">
                  <WindIcon className="size-3" /> 12 km/h
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
});
