import type * as React from "react";
import { MessagesSquare } from "lucide-react";
import { GitHubIcon } from "@/components/icons/github";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ThreadList } from "@/components/assistant-ui/elements/thread-list.aui";

export function ThreadListSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader className="aui-sidebar-header mb-2 border-b border-sidebar-border/60">
        <div className="aui-sidebar-header-content flex items-center justify-between">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="hover:bg-sidebar-accent/50">
                <div
                  className="flex aspect-square size-8 items-center justify-center rounded-lg shadow-sm overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #159488, #0E5C54)" }}
                >
                  <img
                    src="/logo-dark.png"
                    alt="EE Yamaha"
                    className="size-6 object-contain"
                  />
                </div>
                <div className="aui-sidebar-header-heading me-6 flex flex-col gap-0.5 leading-none">
                  <span className="aui-sidebar-header-title font-bold tracking-tight text-sm text-sidebar-foreground">
                    Elements Energy
                  </span>
                  <span className="text-[9.5px] font-bold tracking-[1.2px] text-[#6FC4B6] uppercase">
                    Yamaha EMS
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>
      <SidebarContent className="aui-sidebar-content px-2">
        <ThreadList />
      </SidebarContent>
      {props.collapsible !== "none" && <SidebarRail />}
      <SidebarFooter className="aui-sidebar-footer border-t border-sidebar-border/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-sidebar-accent/50">
              <div
                className="flex aspect-square size-8 items-center justify-center rounded-lg text-white"
                style={{ background: "linear-gradient(135deg, #159488, #0E5C54)" }}
              >
                <MessagesSquare className="size-4" />
              </div>
              <div className="aui-sidebar-footer-heading flex flex-col gap-0.5 leading-none">
                <span className="aui-sidebar-footer-title font-semibold text-xs text-sidebar-foreground">
                  Yamaha AI Copilot
                </span>
                <span className="text-[10px] text-sidebar-foreground/60">
                  Energy &amp; Analytics
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
