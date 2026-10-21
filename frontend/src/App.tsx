import { useMemo, useState } from "react";
import {
  AssistantRuntimeProvider,
  WebSpeechDictationAdapter,
  WebSpeechSynthesisAdapter,
} from "@assistant-ui/react";
import { useBackendChatRuntime } from "@/hooks/use-backend-chat-runtime";
import { Thread } from "@/components/assistant-ui/elements/thread.aui";
import { ThreadListSidebar } from "@/components/assistant-ui/elements/threadlist-sidebar.aui";
import { AssistantModal } from "@/components/assistant-ui/elements/assistant-modal.aui";
import { AssistantSidebar } from "@/components/assistant-ui/elements/assistant-sidebar.aui";
import { ModelSelector } from "@/components/assistant-ui/elements/model-selector.aui";
import { AgentStatus } from "@/components/assistant-ui/elements/agent-status.aui";
import { ContextDisplayBar } from "@/components/assistant-ui/elements/context-display.aui";
import { WeatherToolUI } from "@/components/assistant-ui/tools/weather-tool";
import { AllChartToolsUI } from "@/components/assistant-ui/tools/chart-tool";
import { AllEnergyToolsUI } from "@/components/assistant-ui/tools/energy-tools";
import { LiveTelemetryPanel } from "@/components/live-telemetry-panel";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ColumnsIcon,
  LayersIcon,
  MessageSquareIcon,
  SparklesIcon,
  ZapIcon,
  BotIcon,
} from "lucide-react";

const AI_MODELS = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "OpenAI flagship multimodal intelligence",
    efforts: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o mini",
    description: "Fast, cost-efficient model for most tasks",
    efforts: true,
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    description: "Exceptional coding & nuanced text generation",
    efforts: true,
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    description: "Multimodal model with 1M context window",
    efforts: true,
  },
] as const;

export default function App() {
  const [viewMode, setViewMode] = useState<"standard" | "split">("standard");
  const [showModalBubble, setShowModalBubble] = useState(false);

  const adapters = useMemo(() => {
    return {
      suggestion: {
        generate: async ({ messages }: { messages: readonly unknown[] }) => {
          if (messages.length === 0) {
            return [
              {
                prompt: "What is the weather and solar generation potential in Tokyo?",
                title: "Solar & Weather",
                description: "Test generative weather tool with Yamaha facility coordinates",
              },
              {
                prompt:
                  "Analyze peak energy demand and suggest load shifting opportunities for the molding shop",
                title: "Energy Optimization",
                description: "Yamaha EMS load balancing and peak shaving strategy",
              },
              {
                prompt:
                  "Write a TypeScript utility to calculate power factor and reactive power",
                title: "Power Factor Calculator",
                description: "TypeScript electrical engineering calculation utility",
              },
              {
                prompt:
                  "Summarize key energy efficiency metrics across production lines",
                title: "Facility Metrics",
                description: "Specific energy consumption (SEC) and baseline comparison",
              },
            ];
          }
          return [
            { prompt: "Can you provide a concrete code example?" },
            { prompt: "What are the main edge cases to watch out for?" },
            { prompt: "How does this compare to alternative approaches?" },
          ];
        },
      },
      feedback: {
        submit: ({ type }: { type: "positive" | "negative" }) => {
          console.log("[assistant-ui] Feedback recorded:", type);
        },
      },
      dictation:
        typeof window !== "undefined" &&
        ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
          ? new WebSpeechDictationAdapter()
          : undefined,
      speech:
        typeof window !== "undefined" && "speechSynthesis" in window
          ? new WebSpeechSynthesisAdapter()
          : undefined,
    };
  }, []);

  const runtime = useBackendChatRuntime({
    adapters,
  });

  return (
    <TooltipProvider>
      <AssistantRuntimeProvider runtime={runtime}>
        <WeatherToolUI />
        <AllChartToolsUI />
        <AllEnergyToolsUI />

        <SidebarProvider defaultOpen={true}>
          <div className="flex h-screen w-full overflow-hidden bg-background">
            <ThreadListSidebar />

            <SidebarInset className="flex h-full flex-1 flex-col overflow-hidden">
              {/* Top Navigation & Controls Header */}
              <header className="flex h-13 shrink-0 items-center justify-between border-b px-4 gap-3 bg-background/95 backdrop-blur-sm z-20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <SidebarTrigger className="-ms-1" />
                  <Separator orientation="vertical" className="h-4" />

                  <ModelSelector
                    models={AI_MODELS}
                    defaultValue="gpt-4o"
                    size="sm"
                    variant="outline"
                    className="h-8 max-w-[180px] sm:max-w-xs"
                  />

                  <AgentStatus />
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden md:flex items-center">
                    <ContextDisplayBar modelContextWindow={128000} />
                  </div>

                  <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
                    <Button
                      variant={viewMode === "standard" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 px-2.5 text-xs font-medium gap-1.5"
                      onClick={() => setViewMode("standard")}
                    >
                      <MessageSquareIcon className="size-3.5" />
                      <span className="hidden sm:inline">Standard</span>
                    </Button>
                    <Button
                      variant={viewMode === "split" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 px-2.5 text-xs font-medium gap-1.5"
                      onClick={() => setViewMode("split")}
                    >
                      <ColumnsIcon className="size-3.5" />
                      <span className="hidden sm:inline">Split Workspace</span>
                    </Button>
                  </div>

                  <Button
                    variant={showModalBubble ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2 text-xs font-medium gap-1.5"
                    onClick={() => setShowModalBubble((prev) => !prev)}
                    title="Toggle floating chat bubble widget"
                  >
                    <BotIcon className="size-3.5" />
                    <span className="hidden lg:inline">Floating Bubble</span>
                  </Button>
                </div>
              </header>

              {/* Main Content Area */}
              <main className="relative flex-1 min-h-0 h-full overflow-hidden">
                {viewMode === "standard" ? (
                  <div className="h-full w-full">
                    <Thread />
                  </div>
                ) : (
                  <AssistantSidebar>
                    <div className="flex h-full flex-col overflow-y-auto bg-muted/15 p-6">
                      <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <LayersIcon className="size-5" />
                          </div>
                          <div>
                            <h2 className="text-base font-semibold leading-none">
                              Yamaha Energy Studio
                            </h2>
                            <p className="text-xs text-muted-foreground mt-1">
                              Elements Energy EMS Copilot &amp; Analytics
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs font-normal border-brand-300 text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/40"
                        >
                          EE Yamaha
                        </Badge>
                      </div>

                      <div className="space-y-4">
                        {/* Component 10 Real-Time Telemetry Registry */}
                        <LiveTelemetryPanel
                          onSelectDevice={(dev) => {
                            runtime.thread.append(`Show real-time telemetry and status for ${dev}`);
                          }}
                        />

                        {/* Quick EMS Operations & Queries */}
                        <div className="rounded-xl border bg-card p-4 shadow-xs">
                          <div className="flex items-center gap-2 mb-2">
                            <ZapIcon className="size-4 text-primary" />
                            <h3 className="text-sm font-semibold">
                              Quick Energy &amp; Analytics Prompts
                            </h3>
                          </div>
                          <div className="flex flex-col gap-1.5 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                runtime.thread.append(
                                  "What is the shift-wise consumption for 2026-10-20?",
                                );
                              }}
                              className="rounded-lg border p-2 text-start transition-colors hover:bg-accent hover:text-accent-foreground flex items-center justify-between"
                            >
                              <span>🕒 Shift-wise consumption (Shift A, B, C)</span>
                              <Badge variant="outline" className="text-[10px] h-4">00:40 Rule</Badge>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                runtime.thread.append(
                                  "Analyze peak energy demand on the South Utilities Transformer for 2026-10-20",
                                );
                              }}
                              className="rounded-lg border p-2 text-start transition-colors hover:bg-accent hover:text-accent-foreground flex items-center justify-between"
                            >
                              <span>⚡ Peak apparent power demand (kVA)</span>
                              <Badge variant="outline" className="text-[10px] h-4">Gauge</Badge>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                runtime.thread.append(
                                  "Calculate daily electricity cost under Tariff HT_1 for 2026-10-20",
                                );
                              }}
                              className="rounded-lg border p-2 text-start transition-colors hover:bg-accent hover:text-accent-foreground flex items-center justify-between"
                            >
                              <span>₹ Tariff HT_1 &amp; TOD band cost</span>
                              <Badge variant="outline" className="text-[10px] h-4">INR ₹</Badge>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                runtime.thread.append(
                                  "Show donut chart for equipment-wise energy breakdown",
                                );
                              }}
                              className="rounded-lg border p-2 text-start transition-colors hover:bg-accent hover:text-accent-foreground flex items-center justify-between"
                            >
                              <span>📊 Equipment breakdown distribution</span>
                              <Badge variant="outline" className="text-[10px] h-4">Donut</Badge>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                runtime.thread.append(
                                  "What is the operational status and fuel usage of the diesel generator?",
                                );
                              }}
                              className="rounded-lg border p-2 text-start transition-colors hover:bg-accent hover:text-accent-foreground flex items-center justify-between"
                            >
                              <span>⛽ Diesel Generator (DG) runtime &amp; kWh</span>
                              <Badge variant="outline" className="text-[10px] h-4">DG 300kVA</Badge>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                runtime.thread.append(
                                  "What is the weather and solar generation potential in Tokyo?",
                                );
                              }}
                              className="rounded-lg border p-2 text-start transition-colors hover:bg-accent hover:text-accent-foreground flex items-center justify-between"
                            >
                              <span>☀️ Weather &amp; Solar Irradiance</span>
                              <Badge variant="outline" className="text-[10px] h-4">Weather</Badge>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AssistantSidebar>
                )}

                {/* Floating Chat Modal Widget */}
                {showModalBubble && <AssistantModal />}
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </AssistantRuntimeProvider>
    </TooltipProvider>
  );
}
