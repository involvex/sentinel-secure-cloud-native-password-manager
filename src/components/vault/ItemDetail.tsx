import React, { useState, useEffect } from 'react';
import { useVaultStore } from '@/lib/store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { generateTOTP } from '@/lib/totp-utils';
import type { VaultItem } from '@shared/types';
import { Button } from '@/components/ui/button';
import { ItemForm } from './ItemForm';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Copy, ExternalLink, ShieldCheck, Star, Edit, Trash2,
  Check, ArrowLeft, ShieldAlert, Clock, Hash, Folder
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
  const setActiveTag = useVaultStore(s => s.setActiveTag);
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [copyState, setCopyState] = useState<Record<string, boolean>>({});
  const [totp, setTotp] = useState({ code: '------', secondsRemaining: 30 });
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
    } else {
      setTotp({ code: '------', secondsRemaining: 30 });
    }
  }, [item?.totpSecret, item?.id]);
  const toggleFavorite = useMutation({
    mutationFn: (fav: boolean) => api<VaultItem>(`/api/vault/${item?.id}`, {
      method: 'PUT',
      body: JSON.stringify({ favorite: fav, updatedAt: Date.now() })
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
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyState(prev => ({ ...prev, [label]: true }));
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopyState(prev => ({ ...prev, [label]: false })), 2000);
  };
  if (!item) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-background/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-6"
        >
          <ShieldCheck className="w-10 h-10 text-muted-foreground/40" />
        </motion.div>
        <h3 className="text-xl font-bold mb-2">Secure Vault</h3>
        <p className="text-muted-foreground max-w-[240px] text-sm leading-relaxed">
          Select an item from the list to view its sensitive data. All secrets are encrypted at the edge.
        </p>
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <header className="p-6 md:px-10 md:py-8 border-b border-border/50 flex justify-between items-center bg-card/10 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-5 min-w-0">
          <motion.div
            key={item.id}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-14 h-14 shrink-0 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-extrabold text-2xl"
          >
            {item.title[0].toUpperCase()}
          </motion.div>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
               <h2 className="text-2xl md:text-3xl font-extrabold truncate tracking-tight text-foreground">{item.title}</h2>
               {item.favorite && <Star className="w-5 h-5 fill-orange-500 text-orange-500 shrink-0" />}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold bg-secondary px-1.5 py-0.5 rounded">
                {item.type}
              </span>
              {item.folder && (
                <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 border-primary/20 bg-primary/5">
                  <Folder className="w-2.5 h-2.5 mr-1" />
                  {item.folder}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className={cn("transition-transform hover:scale-110 active:scale-95", item.favorite ? "text-orange-500 hover:text-orange-600" : "text-muted-foreground hover:text-foreground")}
            onClick={() => toggleFavorite.mutate(!item.favorite)}
          >
            <Star className={cn("w-5 h-5", item.favorite && "fill-orange-500")} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)} className="text-muted-foreground hover:text-foreground transition-all hover:scale-110 active:scale-95">
            <Edit className="w-5 h-5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-all hover:scale-110 active:scale-95">
                <Trash2 className="w-5 h-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                  <ShieldAlert className="w-6 h-6 text-destructive" />
                </div>
                <AlertDialogTitle className="text-xl">Purge this secret?</AlertDialogTitle>
                <AlertDialogDescription className="text-pretty">
                  This action is irreversible. The data will be permanently wiped from our edge nodes and durable objects.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Keep Secret</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteItem.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                >
                  Confirm Deletion
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-none">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="mb-8 flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="rounded-xl">
                  <ArrowLeft className="w-4 h-4 mr-2" /> View Mode
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto space-y-10"
            >
              {item.totpSecret && (
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" /> Two-Factor Authentication
                  </label>
                  <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6 group hover:bg-primary/10 transition-colors">
                    <div className="flex items-center gap-6">
                      <motion.span
                        key={totp.code}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-mono text-5xl font-extrabold tracking-[0.2em] text-primary"
                      >
                        {totp.code.slice(0, 3)} {totp.code.slice(3)}
                      </motion.span>
                      <div className="flex flex-col items-center gap-1">
                        <div className="relative w-10 h-10 flex items-center justify-center">
                           <Clock className="w-5 h-5 text-muted-foreground/40" />
                           <span className="absolute text-[10px] font-bold font-mono text-primary/80">
                             {totp.secondsRemaining}
                           </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      className="h-12 px-6 rounded-2xl gap-2 font-bold transition-all hover:scale-105 active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                      onClick={() => copyToClipboard(totp.code, '2FA Code')}
                    >
                      <AnimatePresence mode="wait">
                        {copyState['2FA Code'] ? (
                          <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-400" /> Copied
                          </motion.div>
                        ) : (
                          <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                            <Copy className="w-4 h-4" /> Copy Code
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {item.username && (
                  <div className="space-y-2 group">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Username</label>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/20 border border-border group-hover:border-primary/20 transition-all">
                      <span className="font-mono text-lg truncate pr-4 text-foreground">{item.username}</span>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(item.username!, 'Username')} className="rounded-xl transition-all hover:scale-110">
                        {copyState['Username'] ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}
                {item.password && (
                  <div className="space-y-2 group">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</label>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/20 border border-border group-hover:border-primary/20 transition-all">
                      <span className="font-mono text-lg tracking-[0.3em] opacity-50 text-foreground">••••••••••••</span>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(item.password!, 'Password')} className="rounded-xl transition-all hover:scale-110">
                        {copyState['Password'] ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {item.url && (
                <div className="space-y-2 group">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Website</label>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/20 border border-border group-hover:border-primary/20 transition-all">
                    <span className="text-lg truncate pr-4 font-medium text-primary/80">{item.url}</span>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(item.url!, 'URL')} className="rounded-xl transition-all hover:scale-110">
                        {copyState['URL'] ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" asChild className="rounded-xl transition-all hover:scale-110">
                        <a href={item.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {item.tags && item.tags.length > 0 && (
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Hash className="w-3 h-3" /> Labels & Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map(tag => (
                      <Badge
                        key={tag}
                        onClick={() => setActiveTag(tag)}
                        variant="secondary"
                        className="px-3 py-1 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all rounded-full border border-primary/10 uppercase text-[10px] font-black"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {item.notes && (
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Secure Notes</label>
                  <div className="p-6 rounded-3xl bg-secondary/10 border border-border/50 whitespace-pre-wrap leading-relaxed text-foreground/90 font-medium">
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