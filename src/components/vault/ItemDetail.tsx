import React, { useState, useEffect } from 'react';
import { useVaultStore } from '@/lib/store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { generateTOTP } from '@/lib/totp-utils';
import type { VaultItem } from '@shared/types';
import { Button } from '@/components/ui/button';
import { ItemForm } from './ItemForm';
import { Badge } from '@/components/ui/badge';
import {
  Copy, ExternalLink, ShieldCheck, Star, Edit, Trash2,
  Check, ArrowLeft, ShieldAlert, Clock
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
export function ItemDetail() {
  const selectedItemId = useVaultStore(s => s.selectedItemId);
  const setSelectedItemId = useVaultStore(s => s.setSelectedItemId);
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [copyState, setCopyState] = useState<Record<string, boolean>>({});
  const [totp, setTotp] = useState({ code: '', secondsRemaining: 30 });
  const { data: itemsData } = useQuery({
    queryKey: ['vault-items'],
    queryFn: () => api<{ items: VaultItem[] }>('/api/vault')
  });
  const item = itemsData?.items.find(i => i.id === selectedItemId);
  useEffect(() => {
    if (item?.totpSecret) {
      const updateTotp = () => {
        setTotp(generateTOTP(item.totpSecret!));
      };
      updateTotp();
      const interval = setInterval(updateTotp, 1000);
      return () => clearInterval(interval);
    }
  }, [item?.totpSecret]);
  const toggleFavorite = useMutation({
    mutationFn: (fav: boolean) => api<VaultItem>(`/api/vault/${item?.id}`, {
      method: 'PUT',
      body: JSON.stringify({ favorite: fav })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-items'] });
      toast.success(item?.favorite ? 'Removed from favorites' : 'Added to favorites');
    }
  });
  const deleteItem = useMutation({
    mutationFn: () => api(`/api/vault/${item?.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-items'] });
      setSelectedItemId(null);
      toast.success('Item deleted successfully');
    }
  });
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyState(prev => ({ ...prev, [label]: true }));
    toast.success(`${label} copied`);
    setTimeout(() => setCopyState(prev => ({ ...prev, [label]: false })), 2000);
  };
  if (!item) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-background/30">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6">
          <ShieldCheck className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-foreground">No item selected</h3>
        <p className="text-muted-foreground max-w-xs">Select an item from the list to view its secure details.</p>
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col bg-background">
      <header className="p-6 md:p-8 border-b border-border/50 flex justify-between items-center bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl uppercase">
            {item.title[0]}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
               <h2 className="text-2xl font-bold truncate">{item.title}</h2>
               {item.folder && <Badge variant="secondary" className="font-semibold text-[10px] uppercase">{item.folder}</Badge>}
            </div>
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{item.type}</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            className={item.favorite ? "text-orange-500 fill-orange-500 hover:text-orange-600" : ""}
            onClick={() => toggleFavorite.mutate(!item.favorite)}
          >
            <Star className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setIsEditing(!isEditing)}>
            <Edit className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <ShieldAlert className="w-6 h-6 text-destructive" />
                </div>
                <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This secret will be permanently removed from your vault.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteItem.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Confirm Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto"
            >
              <div className="mb-6 flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Details
                </Button>
              </div>
              <ItemForm
                initialData={item}
                onSuccess={() => setIsEditing(false)}
                onCancel={() => setIsEditing(false)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              {item.totpSecret && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    Two-Factor Code
                  </label>
                  <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between group">
                    <div className="flex items-baseline gap-4">
                      <motion.span 
                        key={totp.code}
                        initial={{ opacity: 0.5, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="font-mono text-4xl font-bold tracking-widest text-primary"
                      >
                        {totp.code.slice(0, 3)} {totp.code.slice(3)}
                      </motion.span>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold font-mono">{totp.secondsRemaining}s</span>
                      </div>
                    </div>
                    <Button variant="secondary" size="icon" className="rounded-xl" onClick={() => copyToClipboard(totp.code, '2FA Code')}>
                       {copyState['2FA Code'] ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
              {item.username && (
                <div className="space-y-2 group">
                  <label className="text-sm font-semibold text-muted-foreground">Username</label>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border group-hover:border-primary/20 transition-all">
                    <span className="font-mono text-lg">{item.username}</span>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(item.username!, 'Username')}>
                      {copyState['Username'] ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
              {item.password && (
                <div className="space-y-2 group">
                  <label className="text-sm font-semibold text-muted-foreground">Password</label>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border group-hover:border-primary/20 transition-all">
                    <span className="font-mono text-lg tracking-[0.3em]">••••••••••••</span>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(item.password!, 'Password')}>
                      {copyState['Password'] ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
              {item.url && (
                <div className="space-y-2 group">
                  <label className="text-sm font-semibold text-muted-foreground">Website</label>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border group-hover:border-primary/20 transition-all">
                    <span className="text-lg truncate pr-4 text-primary/80 hover:text-primary transition-colors font-medium">{item.url}</span>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={item.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a>
                    </Button>
                  </div>
                </div>
              )}
              {item.notes && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Secure Notes</label>
                  <div className="p-5 rounded-xl bg-secondary/30 border border-border whitespace-pre-wrap leading-relaxed text-foreground/90">
                    {item.notes}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}