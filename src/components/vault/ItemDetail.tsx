import React from 'react';
import { useVaultStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { VaultItem } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, ShieldCheck, Star, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
export function ItemDetail() {
  const selectedItemId = useVaultStore(s => s.selectedItemId);
  const { data: itemsData } = useQuery({
    queryKey: ['vault-items'],
    queryFn: () => api<{ items: VaultItem[] }>('/api/vault')
  });
  const item = itemsData?.items.find(i => i.id === selectedItemId);
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };
  if (!item) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6">
          <ShieldCheck className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No item selected</h3>
        <p className="text-muted-foreground max-w-xs">Select an item from the list to view its secure details.</p>
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col bg-background/50">
      <header className="p-8 border-b border-border/50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl uppercase">
            {item.title[0]}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{item.title}</h2>
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{item.type}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className={item.favorite ? "text-orange-500 fill-orange-500" : ""}>
            <Star className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-8 max-w-3xl">
        <div className="space-y-8">
          {item.username && (
            <div className="group">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Username</label>
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border group-hover:border-primary/30 transition-colors">
                <span className="font-mono text-lg">{item.username}</span>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(item.username!, 'Username')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          {item.password && (
            <div className="group">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Password</label>
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border group-hover:border-primary/30 transition-colors">
                <span className="font-mono text-lg tracking-[0.3em]">••••••••••••</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(item.password!, 'Password')}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          {item.url && (
            <div className="group">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Website</label>
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border group-hover:border-primary/30 transition-colors">
                <span className="text-lg truncate pr-4 text-blue-500">{item.url}</span>
                <Button variant="ghost" size="icon" asChild>
                  <a href={item.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a>
                </Button>
              </div>
            </div>
          )}
          {item.notes && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Notes</label>
              <div className="p-4 rounded-xl bg-secondary/30 border border-border whitespace-pre-wrap leading-relaxed">
                {item.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}