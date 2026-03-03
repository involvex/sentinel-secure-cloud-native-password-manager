import React from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useVaultStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { VaultItem } from '@shared/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
export function VaultList() {
  const searchQuery = useVaultStore(s => s.searchQuery);
  const setSearchQuery = useVaultStore(s => s.setSearchQuery);
  const selectedItemId = useVaultStore(s => s.selectedItemId);
  const setSelectedItemId = useVaultStore(s => s.setSelectedItemId);
  const activeFilter = useVaultStore(s => s.activeFilter);
  const { data, isLoading } = useQuery({
    queryKey: ['vault-items'],
    queryFn: () => api<{ items: VaultItem[] }>('/api/vault')
  });
  const items = data?.items ?? [];
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = activeFilter === 'all' || item.type === activeFilter || 
                        (activeFilter === 'favorites' && item.favorite);
    return matchesSearch && matchesType;
  });
  return (
    <div className="flex flex-col h-full border-r border-border/50">
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold">Vault</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            className="pl-9 h-10 bg-secondary/50" 
            placeholder="Search items..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-1">
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Loading vault...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No items found.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedItemId(item.id)}
              className={cn(
                "w-full text-left p-3 rounded-xl transition-all group relative",
                selectedItemId === item.id 
                  ? "bg-primary text-primary-foreground shadow-lg" 
                  : "hover:bg-secondary"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold truncate pr-4">{item.title}</span>
                {item.favorite && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
              </div>
              <div className={cn(
                "text-xs truncate",
                selectedItemId === item.id ? "text-primary-foreground/70" : "text-muted-foreground"
              )}>
                {item.username || item.url || 'No details'}
              </div>
              <div className={cn(
                "text-[10px] mt-2 opacity-50",
                selectedItemId === item.id ? "text-primary-foreground" : "text-muted-foreground"
              )}>
                Updated {formatDistanceToNow(item.updatedAt)} ago
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}