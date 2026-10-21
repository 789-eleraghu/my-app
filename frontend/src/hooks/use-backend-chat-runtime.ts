"use client";

import { useMemo } from "react";
import { useRemoteThreadListRuntime } from "@assistant-ui/react";
import { useAui, useAuiState } from "@assistant-ui/store";
import { useHostDestroySignal } from "@assistant-ui/store/internal";
import {
  AssistantChatTransport,
  useChatRuntime,
  type UseChatRuntimeOptions,
} from "@assistant-ui/ai-sdk";
import type { AssistantRuntime } from "@assistant-ui/core";
import { backendThreadAdapter } from "@/adapters/backend-thread-adapter";

// Direct hook for backend-persisted chat runtime
export const useBackendChatRuntime = (
  options: UseChatRuntimeOptions = {},
): AssistantRuntime => {
  const hostDestroySignal = useHostDestroySignal();
  const aui = useAui();
  const fallback = useMemo(() => new AssistantChatTransport(), []);
  const transport = options.transport ?? fallback;

  // We wrap useChatRuntime and connect it to RemoteThreadListRuntime with backendThreadAdapter
  return useRemoteThreadListRuntime({
    runtimeHook: function RuntimeHook() {
      return useChatRuntime({
        ...options,
        transport,
      });
    },
    adapter: backendThreadAdapter,
    allowNesting: true,
  });
};
