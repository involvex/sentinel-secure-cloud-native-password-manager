import React from "react";
import { Shield, LayoutGrid, Key, CreditCard, FileText, Star, Trash2, Plus } from "lucide-react";
import { useVaultStore } from "@/lib/store";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
export function VaultSidebar() {
  const activeFilter = useVaultStore(s => s.activeFilter);
  const setActiveFilter = useVaultStore(s => s.setActiveFilter);
  const categories = [
    { id: 'all', label: 'All Items', icon: LayoutGrid },
    { id: 'login', label: 'Logins', icon: Key },
    { id: 'card', label: 'Cards', icon: CreditCard },
    { id: 'note', label: 'Secure Notes', icon: FileText },
  ];
  return (
    <Sidebar variant="inset" className="border-r border-border/50">
      <SidebarHeader className="h-16 flex items-center px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight">Sentinel</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3">
        <div className="mb-4 mt-2">
          <Button className="w-full justify-start gap-2 h-11 btn-gradient" size="sm">
            <Plus className="w-4 h-4" /> New Item
          </Button>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="px-3">Vault</SidebarGroupLabel>
          <SidebarMenu>
            {categories.map((cat) => (
              <SidebarMenuItem key={cat.id}>
                <SidebarMenuButton 
                  isActive={activeFilter === cat.id}
                  onClick={() => setActiveFilter(cat.id as any)}
                  className="h-10 px-3"
                >
                  <cat.icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="px-3">Filters</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeFilter === 'favorites'} 
                onClick={() => setActiveFilter('favorites')}
                className="h-10 px-3"
              >
                <Star className="w-4 h-4" />
                <span>Favorites</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeFilter === 'trash'} 
                onClick={() => setActiveFilter('trash')}
                className="h-10 px-3"
              >
                <Trash2 className="w-4 h-4" />
                <span>Trash</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}