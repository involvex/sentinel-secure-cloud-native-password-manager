import React from "react";
import { Shield, LayoutGrid, Key, CreditCard, FileText, Star, Plus, Zap, Folder, LogOut, Share2, UserCircle, Trash2 } from "lucide-react";
import { useVaultStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { VaultItem } from "@shared/types";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GeneratorTool } from "./GeneratorTool";
import { CreateItemDialog } from "./CreateItemDialog";
import { ImportExportDialog } from "./ImportExportDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
export function VaultSidebar() {
  const navigate = useNavigate();
  const activeFilter = useVaultStore(s => s.activeFilter);
  const activeTag = useVaultStore(s => s.activeTag);
  const setActiveFilter = useVaultStore(s => s.setActiveFilter);
  const setCreateDialogOpen = useVaultStore(s => s.setCreateDialogOpen);
  const setImportExportOpen = useVaultStore(s => s.setImportExportOpen);
  const user = useAuthStore(s => s.user);
  const clearAuth = useAuthStore(s => s.clearAuth);
  const { data } = useQuery({
    queryKey: ['vault-items'],
    queryFn: () => api<{ items: VaultItem[] }>('/api/vault')
  });
  const categories = [
    { id: 'all', label: 'All Items', icon: LayoutGrid },
    { id: 'login', label: 'Logins', icon: Key },
    { id: 'card', label: 'Cards', icon: CreditCard },
    { id: 'note', label: 'Secure Notes', icon: FileText },
  ];
  const items = data?.items ?? [];
  const folders = Array.from(new Set(items.map(i => i.folder).filter(Boolean))) as string[];
  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };
  return (
    <>
      <Sidebar variant="inset" className="border-r border-border/50">
        <SidebarHeader className="h-16 flex items-center px-6 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">Sentinel</span>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-3">
          <div className="mb-4 mt-2 px-1">
            <Button
              className="w-full justify-start gap-2 h-11 btn-gradient shadow-md"
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="w-4 h-4" /> New Item
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <SidebarGroup>
              <SidebarGroupLabel className="px-3">Vault</SidebarGroupLabel>
              <SidebarMenu>
                {categories.map((cat) => (
                  <SidebarMenuItem key={cat.id}>
                    <SidebarMenuButton
                      isActive={activeFilter === cat.id && !activeTag}
                      onClick={() => setActiveFilter(cat.id)}
                      className={cn(
                        "h-10 px-3 transition-colors",
                        activeFilter === cat.id && !activeTag && "bg-primary/10 text-primary font-bold"
                      )}
                    >
                      <cat.icon className="w-4 h-4" />
                      <span>{cat.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
            {folders.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="px-3">Folders</SidebarGroupLabel>
                <SidebarMenu>
                  {folders.map((folder) => (
                    <SidebarMenuItem key={folder}>
                      <SidebarMenuButton
                        isActive={activeFilter === folder && !activeTag}
                        onClick={() => setActiveFilter(folder)}
                        className={cn(
                          "h-10 px-3 transition-colors",
                          activeFilter === folder && "bg-accent/50 text-foreground font-semibold"
                        )}
                      >
                        <Folder className="w-4 h-4" />
                        <span>{folder}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            )}
            <SidebarGroup>
              <SidebarGroupLabel className="px-3">System</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setImportExportOpen(true)} className="h-10 px-3">
                    <Share2 className="w-4 h-4" />
                    <span>Import / Export</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeFilter === 'favorites'}
                    onClick={() => setActiveFilter('favorites')}
                    className={cn(
                      "h-10 px-3",
                      activeFilter === 'favorites' && "bg-orange-500/10 text-orange-600 font-bold"
                    )}
                  >
                    <Star className="w-4 h-4" />
                    <span>Favorites</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeFilter === 'trash'}
                    onClick={() => setActiveFilter('trash')}
                    className={cn(
                      "h-10 px-3",
                      activeFilter === 'trash' && "bg-destructive/10 text-destructive font-bold"
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Trash</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </ScrollArea>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-border/40 space-y-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary" className="w-full justify-start gap-2 h-10 border-dashed border-border hover:bg-accent transition-colors">
                <Zap className="w-4 h-4 text-orange-500" />
                <span>Password Generator</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent side="right" align="end" className="w-80 p-0 shadow-2xl border-none">
              <div className="p-4 border-b border-border font-bold">Quick Generator</div>
              <GeneratorTool />
            </PopoverContent>
          </Popover>
          <div className="flex items-center gap-3 px-2 py-1 bg-secondary/30 rounded-xl border border-border/30 group">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <UserCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate">{user?.name || 'Vault User'}</p>
              <p className="text-[10px] text-muted-foreground truncate uppercase font-extrabold tracking-tighter">Encrypted Session</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <CreateItemDialog />
      <ImportExportDialog />
    </>
  );
}