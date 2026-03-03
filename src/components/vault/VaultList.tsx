import React, { useRef } from 'react';
import { Search, ShieldAlert, X, Star, Folder } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useVaultStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { VaultItem } from '@shared/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useVirtualizer } from '@tanstack/react-virtual';
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
  const parentRef = useRef<HTMLDivElement>(null);
  const items = data?.items ?? [];
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.username?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = activeFilter === 'all' || item.type === activeFilter ||
                        (activeFilter === 'favorites' && item.favorite);
    return matchesSearch && matchesType;
  }).sort((a, b) => b.updatedAt - a.updatedAt);
  const virtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 90,
    overscan: 5,
  });
  return (
    <div className="flex flex-col h-full border-r border-border/50 bg-background/50">
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Vault</h2>
          <span className="bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded-full">
            {filteredItems.length} items
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 pr-9 h-10 bg-secondary/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
            placeholder="Search vault..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div 
        ref={parentRef}
        className="flex-1 overflow-y-auto px-3 pb-6 scrollbar-thin scrollbar-thumb-border"
      >
        {isLoading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-border/20">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-muted-foreground">No matches found</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your search or filters.</p>
            </div>
            {searchQuery && (
              <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const item = filteredItems[virtualRow.index];
              const isSelected = selectedItemId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={cn(
                    "text-left p-4 rounded-xl transition-all group border border-transparent mb-2 flex flex-col justify-center",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-primary"
                      : "hover:bg-secondary/80 hover:border-border/50"
                  )}
                >
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="font-bold truncate pr-4 text-sm md:text-base leading-tight">
                      {item.title}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.favorite && (
                        <Star className={cn(
                          "w-3.5 h-3.5 fill-orange-500 text-orange-500",
                          isSelected && "text-primary-foreground fill-primary-foreground"
                        )} />
                      )}
                    </div>
                  </div>
                  <div className={cn(
                    "text-xs truncate font-medium flex items-center gap-2",
                    isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    {item.username || item.url || (item.type === 'note' ? 'Secure Note' : 'No details')}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className={cn(
                      "text-[10px] opacity-70 font-bold uppercase tracking-tighter flex items-center gap-1",
                      isSelected ? "text-primary-foreground" : "text-muted-foreground"
                    )}>
                      {item.folder && (
                        <span className="flex items-center gap-1 mr-2 px-1.5 py-0.5 bg-background/10 rounded border border-current">
                          <Folder className="w-2.5 h-2.5" />
                          {item.folder}
                        </span>
                      )}
                      <span>{formatDistanceToNow(item.updatedAt)} ago</span>
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