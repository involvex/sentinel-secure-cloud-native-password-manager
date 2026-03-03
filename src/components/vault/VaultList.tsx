import React, { useRef, useMemo } from 'react';
import { Search, ShieldAlert, Star, Fingerprint, Key, CreditCard, FileText, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useVaultStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { VaultItem, VaultItemType } from '@shared/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';
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
    estimateSize: () => 88,
    overscan: 10,
  });
  return (
    <div className="flex flex-col h-full border-r bg-background/50">
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Vault</h2>
          <Badge variant="secondary" className="bg-primary/5 text-primary border-none">{filteredItems.length} Items</Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-secondary/30 border-none h-11 focus-visible:ring-primary/20"
            placeholder="Search vault..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div ref={parentRef} className="flex-1 overflow-y-auto px-4 pb-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
          </div>
        ) : filteredItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col items-center justify-center text-center p-10"
          >
            <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              <ShieldAlert className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-bold text-muted-foreground">No matching items</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your filters or search query.</p>
          </motion.div>
        ) : (
          <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            {virtualizer.getVirtualItems().map((v) => {
              const item = filteredItems[v.index];
              const isSelected = selectedItemId === item.id;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: v.index * 0.02 }}
                  style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: `${v.size - 8}px`, 
                    transform: `translateY(${v.start}px)` 
                  }}
                >
                  <button
                    onClick={() => setSelectedItemId(item.id)}
                    className={cn(
                      "w-full h-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 group",
                      isSelected 
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                        : "hover:bg-secondary/60 border-transparent bg-card shadow-sm"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors", 
                      isSelected ? "bg-white/20" : "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white"
                    )}>
                      <TypeIcon type={item.type} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold truncate pr-2 text-sm">{item.title}</span>
                        {item.favorite && <Star className="w-3 h-3 fill-orange-500 text-orange-500 shrink-0" />}
                      </div>
                      <div className={cn(
                        "text-[11px] truncate mt-0.5", 
                        isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}>
                        {item.type === 'passkey' ? (
                          <span className="flex items-center gap-1"><Fingerprint className="w-3 h-3" /> Hardware Key</span>
                        ) : item.username || item.url || 'Secure Secret'}
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}