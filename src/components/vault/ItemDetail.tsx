import React, { useState, useEffect } from 'react';
import { useVaultStore } from '@/lib/store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { generateTOTP } from '@/lib/totp-utils';
import type { VaultItem } from '@shared/types';
import { Button } from '@/components/ui/button';
import { ItemForm } from './ItemForm';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Copy, Star, Edit, ArrowLeft, ShieldCheck, Fingerprint, Loader2, Folder,
  Clock, Hash, ShieldAlert, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { authenticatePasskey } from '@/lib/webauthn-utils';
export function ItemDetail() {
  const selectedItemId = useVaultStore(s => s.selectedItemId);
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [copyState, setCopyState] = useState<Record<string, boolean>>({});
  const [totp, setTotp] = useState({ code: '------', secondsRemaining: 30 });
  const { data: itemsData } = useQuery({
    queryKey: ['vault-items'],
    queryFn: () => api<{ items: VaultItem[] }>('/api/vault')
  });
  const item = itemsData?.items.find(i => i.id === selectedItemId);
  useEffect(() => {
    if (item?.totpSecret) {
      const updateTotp = () => setTotp(generateTOTP(item.totpSecret!));
      updateTotp();
      const interval = setInterval(updateTotp, 1000);
      return () => clearInterval(interval);
    }
    setTotp({ code: '------', secondsRemaining: 30 });
  }, [item?.totpSecret, item?.id]);
  useEffect(() => {
    setIsEditing(false);
  }, [selectedItemId]);
  const toggleFavorite = useMutation({
    mutationFn: (fav: boolean) => api<VaultItem>(`/api/vault/${item?.id}`, {
      method: 'PUT',
      body: JSON.stringify({ favorite: fav, updatedAt: Date.now() })
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vault-items'] })
  });
  const handlePasskeyAuth = async () => {
    if (!item?.passkeyData) return;
    setIsAuthenticating(true);
    try {
      const { challenge } = await api<{ challenge: string }>('/api/auth/challenge', { method: 'POST' });
      await authenticatePasskey(item.passkeyData.credentialId, challenge);
      toast.success('Hardware verification confirmed');
    } catch (err) {
      toast.error('Passkey authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };
  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyState(prev => ({ ...prev, [label]: true }));
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopyState(prev => ({ ...prev, [label]: false })), 1500);
  };
  if (!item) return (
    <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-background/30">
      <div className="w-20 h-20 rounded-3xl bg-secondary/50 flex items-center justify-center mb-6 animate-pulse">
        <ShieldCheck className="w-10 h-10 text-muted-foreground/20" />
      </div>
      <h3 className="text-xl font-bold tracking-tight">Vault Protected</h3>
      <p className="text-muted-foreground text-sm max-w-xs mt-2">Select an item to view encrypted details. Your keys never leave this device.</p>
    </div>
  );
  return (
    <div className="h-full flex flex-col bg-background overflow-hidden selection:bg-primary/20">
      <header className="p-6 border-b flex justify-between items-center bg-card/5 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center text-primary-foreground font-bold text-xl shrink-0 shadow-lg shadow-primary/20">
            {item.type === 'passkey' ? <Fingerprint className="w-6 h-6" /> : item.title[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold truncate tracking-tight">{item.title}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-[10px] uppercase font-black px-1.5 py-0 bg-primary/10 text-primary border-none">{item.type}</Badge>
              {item.folder && <span className="text-xs text-muted-foreground flex items-center gap-1"><Folder className="w-3 h-3" />{item.folder}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => toggleFavorite.mutate(!item.favorite)} className={cn("hover:bg-orange-500/10", item.favorite && "text-orange-500")}>
            <Star className={cn("w-5 h-5 transition-all", item.favorite && "fill-orange-500 scale-110")} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)} className="hover:bg-primary/10"><Edit className="w-5 h-5" /></Button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div key="edit" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Button variant="ghost" onClick={() => setIsEditing(false)} className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" /> Cancel Edition</Button>
              <ItemForm initialData={item} onSuccess={() => setIsEditing(false)} onCancel={() => setIsEditing(false)} />
            </motion.div>
          ) : (
            <motion.div key="view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto space-y-8 pb-12">
              {item.type === 'passkey' && item.passkeyData && (
                <div className="p-8 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto ring-4 ring-emerald-500/5">
                    <Fingerprint className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Encrypted Passkey</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Hardware-backed authentication is enabled for this item. Use your biometric or security key to verify.</p>
                  </div>
                  <div className="bg-secondary/40 p-4 rounded-xl font-mono text-xs text-muted-foreground break-all border border-border/50">
                    ID: {item.passkeyData.credentialId}
                  </div>
                  <Button
                    className="w-full h-14 text-lg btn-gradient"
                    onClick={handlePasskeyAuth}
                    disabled={isAuthenticating}
                  >
                    {isAuthenticating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ShieldCheck className="w-5 h-5 mr-2" />}
                    Authenticate with Passkey
                  </Button>
                </div>
              )}
              {item.type === 'login' && (
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-5 rounded-2xl border bg-secondary/20 hover:bg-secondary/30 transition-colors group">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">User Identity</Label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-semibold truncate text-lg">{item.username || '—'}</span>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(item.username!, 'Username')} className="rounded-full">
                        {copyState['Username'] ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl border bg-secondary/20 hover:bg-secondary/30 transition-colors group">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Credential</Label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-mono tracking-[0.4em] text-lg select-none">��•••••••</span>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(item.password!, 'Password')} className="rounded-full">
                        {copyState['Password'] ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {item.totpSecret && (
                <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20 space-y-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <Clock className="w-24 h-24" />
                  </div>
                  <div className="flex justify-between items-center relative z-10">
                    <Label className="text-xs font-bold uppercase tracking-widest text-primary">2FA Security Token</Label>
                    <Badge variant="outline" className={cn(
                      "font-mono bg-background border-primary/20 px-3",
                      totp.secondsRemaining < 5 ? "text-destructive border-destructive/50" : "text-primary"
                    )}>
                      {totp.secondsRemaining}s
                    </Badge>
                  </div>
                  <div className="text-5xl font-mono font-black text-center tracking-[0.2em] py-4 text-primary relative z-10">
                    {totp.code.slice(0,3)} {totp.code.slice(3)}
                  </div>
                  <Button variant="secondary" className="w-full h-12 bg-primary/10 hover:bg-primary/20 border-none font-bold text-primary relative z-10" onClick={() => copyToClipboard(totp.code, '2FA Code')}>
                    {copyState['2FA Code'] ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    Copy 2FA Code
                  </Button>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mt-2">
                    <motion.div 
                      className="h-full bg-primary" 
                      initial={false}
                      animate={{ width: `${(totp.secondsRemaining / 30) * 100}%` }}
                      transition={{ ease: "linear", duration: 1 }}
                    />
                  </div>
                </div>
              )}
              {item.notes && (
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Secure Encrypted Notes</Label>
                  <div className="p-8 rounded-3xl bg-secondary/10 border border-border/50 whitespace-pre-wrap leading-relaxed text-sm shadow-inner min-h-[120px]">
                    {item.notes}
                  </div>
                </div>
              )}
              <div className="pt-10 flex flex-col items-center gap-2 border-t text-muted-foreground/40 italic">
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-tighter">
                  <ShieldCheck className="w-3 h-3" />
                  Military-Grade AES-256 Storage
                </div>
                <div className="text-[10px]">Updated {new Date(item.updatedAt).toLocaleString()}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}