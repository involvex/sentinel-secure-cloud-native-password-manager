import React, { useRef, useMemo } from 'react';
import { Search, ShieldAlert, X, Star, Folder, Hash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useVaultStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { VaultItem } from '@shared/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
function HighlightedText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="bg-primary/20 text-foreground px-0.5 rounded-sm">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
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
                          (item.username?.toLowerCase().includes(query)) ||
                          (item.url?.toLowerCase().includes(query));
      let matchesFilter = true;
      if (activeTag) {
        matchesFilter = item.tags?.includes(activeTag) ?? false;
      } else if (activeFilter === 'all') {
        matchesFilter = true;
      } else if (activeFilter === 'favorites') {
        matchesFilter = item.favorite;
      } else if (['login', 'card', 'note'].includes(activeFilter)) {
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
    estimateSize: () => 100,
    overscan: 5,
  });
  return (
    <div className="flex flex-col h-full border-r border-border/50 bg-background/50">
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold tracking-tight">Vault</h2>
            {activeTag && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Hash className="w-3 h-3" />
                <span>Tagged: {activeTag}</span>
              </div>
            )}
          </div>
          <Badge variant="secondary" className="px-2 py-0.5 rounded-full font-bold">
            {filteredItems.length}
          </Badge>
        </div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            className="pl-9 pr-9 h-11 bg-secondary/30 border-none focus-visible:ring-1 focus-visible:ring-primary/40 transition-all"
            placeholder="Search everything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto px-3 pb-6 scrollbar-none"
      >
        <AnimatePresence mode="popLayout">
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
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4"
            >
              <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="w-16 h-16 rounded-3xl bg-secondary/50 flex items-center justify-center"
              >
                <ShieldAlert className="w-8 h-8 text-muted-foreground/50" />
              </motion.div>
              <div className="max-w-[200px]">
                <p className="font-bold text-muted-foreground">Empty Vault</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your filters or adding a new secret.</p>
              </div>
              {searchQuery && (
                <Button variant="outline" size="sm" onClick={() => setSearchQuery('')} className="rounded-xl">
                  Clear Search
                </Button>
              )}
            </motion.div>
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
                  <motion.button
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
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
                      "text-left p-4 rounded-2xl transition-all border mb-2 flex flex-col justify-center",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 border-primary"
                        : "hover:bg-secondary/60 bg-card/40 border-border/40"
                    )}
                  >
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="font-bold truncate pr-4 text-sm md:text-base leading-tight">
                        <HighlightedText text={item.title} highlight={searchQuery} />
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
                      "text-[11px] truncate font-medium flex items-center gap-2",
                      isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}>
                      {item.username ? (
                        <HighlightedText text={item.username} highlight={searchQuery} />
                      ) : item.url ? (
                        <HighlightedText text={item.url} highlight={searchQuery} />
                      ) : (
                        item.type === 'note' ? 'Secure Note' : 'Untitled secret'
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2 overflow-hidden">
                      {item.folder && (
                        <span className={cn(
                          "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-tighter border",
                          isSelected ? "bg-background/20 border-white/20" : "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                        )}>
                          <Folder className="w-2.5 h-2.5" />
                          {item.folder}
                        </span>
                      )}
                      {(item.tags || []).slice(0, 2).map(tag => (
                        <span key={tag} className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border",
                          isSelected ? "bg-background/10 border-white/10" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        )}>
                          #{tag}
                        </span>
                      ))}
                      {(item.tags?.length || 0) > 2 && (
                        <span className="text-[9px] font-bold opacity-60">
                          +{item.tags!.length - 2} more
                        </span>
                      )}
                      <span className={cn(
                        "text-[10px] opacity-60 font-medium ml-auto",
                        isSelected ? "text-primary-foreground" : "text-muted-foreground"
                      )}>
                        {formatDistanceToNow(item.updatedAt)} ago
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}