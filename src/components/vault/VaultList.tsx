import React, { useRef, useMemo } from 'react';
import { Search, ShieldAlert, X, Star, Folder, Hash, Fingerprint, Key, CreditCard, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useVaultStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { VaultItem, VaultItemType } from '@shared/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
const TypeIcon = ({ type }: { type: VaultItemType }) => {
  switch (type) {
    case 'passkey': return <Fingerprint className="w-4 h-4" />;
    case 'login': return <Key className="w-4 h-4" />;
    case 'card': return <CreditCard className="w-4 h-4" />;
    case 'note': return <FileText className="w-4 h-4" />;
    default: return <Key className="w-4 h-4" />;
  }
};
export function VaultList() {
  const searchQuery = useVaultStore(s => s.searchQuery);
  const setSearchQuery = useVaultStore(s => s.setSearchQuery);
  const selectedItemId = useVaultStore(s => s.selectedItemId);
  const setSelectedItemId = useVaultStore(s => s.setSelectedItemId);
  const activeFilter = useVaultStore(s => s.activeFilter);
  const activeTag = useVaultStore(s => s.activeTag);
  const { data, isLoading } = useQuery({
    queryKey: ['vault-items'],
    queryFn: () => api<{ items: VaultItem[] }>('/api/vault')
  });
  const parentRef = useRef<HTMLDivElement>(null);
  const filteredItems = useMemo(() => {
    const items = data?.items ?? [];
    return items.filter(item => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query || 
        item.title.toLowerCase().includes(query) || 
        item.username?.toLowerCase().includes(query) || 
        item.url?.toLowerCase().includes(query);
      let matchesFilter = true;
      if (activeTag) {
        matchesFilter = item.tags?.includes(activeTag) ?? false;
      } else if (activeFilter === 'all') {
        matchesFilter = true;
      } else if (activeFilter === 'favorites') {
        matchesFilter = item.favorite;
      } else if (['login', 'card', 'note', 'passkey'].includes(activeFilter)) {
        matchesFilter = item.type === activeFilter;
      } else {
        matchesFilter = item.folder === activeFilter;
      }
      return matchesSearch && matchesFilter;
    }).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [data?.items, searchQuery, activeFilter, activeTag]);
  const virtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 90,
    overscan: 5,
  });
  return (
    <div className="flex flex-col h-full border-r bg-background/50">
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Vault</h2>
          <Badge variant="secondary">{filteredItems.length}</Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            className="pl-9 bg-secondary/30 border-none" 
            placeholder="Search vault..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div ref={parentRef} className="flex-1 overflow-y-auto px-3 pb-6">
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
        ) : filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <ShieldAlert className="w-12 h-12 mb-2" />
            <p className="text-sm font-medium">No items found</p>
          </div>
        ) : (
          <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            {virtualizer.getVirtualItems().map((v) => {
              const item = filteredItems[v.index];
              const isSelected = selectedItemId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: `${v.size}px`, transform: `translateY(${v.start}px)` }}
                  className={cn(
                    "text-left p-4 rounded-xl mb-2 border transition-all flex items-center gap-4",
                    isSelected ? "bg-primary text-primary-foreground border-primary" : "hover:bg-secondary/40 border-transparent bg-card/40"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", isSelected ? "bg-background/20" : "bg-primary/10 text-primary")}>
                    <TypeIcon type={item.type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold truncate pr-2">{item.title}</span>
                      {item.favorite && <Star className="w-3 h-3 fill-orange-500 text-orange-500" />}
                    </div>
                    <div className={cn("text-xs truncate opacity-70", isSelected ? "text-primary-foreground" : "text-muted-foreground")}>
                      {item.type === 'passkey' ? 'Hardware Credential' : item.username || item.url || 'Secure Secret'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}