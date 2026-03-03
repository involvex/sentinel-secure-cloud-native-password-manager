import React from 'react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { VaultSidebar } from "@/components/vault/VaultSidebar";
import { VaultList } from "@/components/vault/VaultList";
import { ItemDetail } from "@/components/vault/ItemDetail";
import { SecurityMonitor } from "@/components/vault/SecurityMonitor";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { useVaultStore } from "@/lib/store";
export function Dashboard() {
  const isMobile = useIsMobile();
  const activeFilter = useVaultStore(s => s.activeFilter);
  const isMonitor = activeFilter === 'monitor' || activeFilter === 'security';
  return (
    <div className="h-screen w-full flex overflow-hidden bg-background">
      <SidebarProvider defaultOpen={true}>
        <VaultSidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          {isMonitor ? (
            <div className="h-full overflow-y-auto bg-background">
              <SecurityMonitor />
            </div>
          ) : isMobile ? (
            <div className="flex flex-col h-full">
              <VaultList />
            </div>
          ) : (
            <ResizablePanelGroup direction="horizontal" className="h-full flex-1">
              <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
                <VaultList />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={65}>
                <ItemDetail />
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}