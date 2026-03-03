import React, { useRef, useMemo, useState } from 'react';
import { Search, ShieldAlert, Star, Fingerprint, Key, CreditCard, FileText, LayoutGrid, ArrowUpDown, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useVaultStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { getStrengthData } from '@/lib/security-utils';
import type { VaultItem, VaultItemType } from '@shared/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
type SortOption = 'recent' | 'risk' | 'strength' | 'alpha';
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
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const { data, isLoading } = useQuery({
    queryKey: ['vault-items'],
    queryFn: () => api<{ items: VaultItem[] }>('/api/vault')
  });
  const parentRef = useRef<HTMLDivElement>(null);
  const filteredItems = useMemo(() => {
    const items = data?.items ?? [];
    let processed = items.filter(item => {
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
    });
    // Sort logic
    processed.sort((a, b) => {
      if (sortBy === 'recent') return b.updatedAt - a.updatedAt;
      if (sortBy === 'alpha') return a.title.localeCompare(b.title);
      const aScore = a.password ? getStrengthData(a.password).score : (a.type === 'passkey' ? 5 : 0);
      const bScore = b.password ? getStrengthData(b.password).score : (b.type === 'passkey' ? 5 : 0);
      if (sortBy === 'strength') return aScore - bScore;
      if (sortBy === 'risk') return aScore - bScore; // Lower score = Higher risk
      return 0;
    });
    return processed;
  }, [data?.items, searchQuery, activeFilter, activeTag, sortBy]);
  const virtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88,
    overscan: 10,
  });
  const sortLabel = {
    recent: 'Recent',
    risk: 'Risk',
    strength: 'Strength',
    alpha: 'A-Z'
  }[sortBy];
  return (
    <div className="flex flex-col h-full border-r bg-background/50">
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Vault</h2>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase gap-1 px-2 border border-border/50">
                  <ArrowUpDown className="w-3 h-3" /> {sortLabel} <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy('recent')}>Recently Updated</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('risk')}>Highest Security Risk</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('strength')}>Weakest Password</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('alpha')}>Alphabetical</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Badge variant="secondary" className="bg-primary/5 text-primary border-none h-7 flex items-center">{filteredItems.length} Items</Badge>
          </div>
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
              const strengthData = item.password ? getStrengthData(item.password) : null;
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
                      "w-full h-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 group relative overflow-hidden",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                        : "hover:bg-secondary/60 border-transparent bg-card shadow-sm"
                    )}
                  >
                    {/* Security Health Indicator Bar */}
                    {strengthData && !isSelected && (
                      <div className={cn("absolute left-0 top-0 bottom-0 w-1", strengthData.color)} />
                    )}
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                      isSelected ? "bg-white/20" : "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white"
                    )}>
                      <TypeIcon type={item.type} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold truncate pr-2 text-sm">{item.title}</span>
                        <div className="flex items-center gap-1.5">
                          {item.favorite && <Star className="w-3 h-3 fill-orange-500 text-orange-500 shrink-0" />}
                          {strengthData && strengthData.score < 2 && !isSelected && (
                            <ShieldAlert className="w-3 h-3 text-destructive animate-pulse" />
                          )}
                        </div>
                      </div>
                      <div className={cn(
                        "text-[11px] truncate mt-0.5",
                        isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}>
                        {item.type === 'passkey' ? (
                          <span className="flex items-center gap-1 font-medium"><Fingerprint className="w-3 h-3" /> Hardware Key</span>
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