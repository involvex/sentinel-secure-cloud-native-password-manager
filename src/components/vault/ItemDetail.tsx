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
  Check, ArrowLeft, ShieldAlert, Clock, Hash, Folder, Fingerprint, Lock
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { authenticatePasskey } from '@/lib/webauthn-utils';
export function ItemDetail() {
  const selectedItemId = useVaultStore(s => s.selectedItemId);
  const setSelectedItemId = useVaultStore(s => s.setSelectedItemId);
  const setActiveTag = useVaultStore(s => s.setActiveTag);
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
      toast.success('Passkey Verification Successful', {
        description: `Verified hardware identity for ${item.title}`
      });
    } catch (err) {
      toast.error('Passkey authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyState(prev => ({ ...prev, [label]: true }));
    toast.success(`${label} copied`);
    setTimeout(() => setCopyState(prev => ({ ...prev, [label]: false })), 2000);
  };
  if (!item) return (
    <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-background/30">
      <ShieldCheck className="w-16 h-16 text-muted-foreground/20 mb-4" />
      <h3 className="text-xl font-bold">Secure Vault</h3>
      <p className="text-muted-foreground text-sm max-w-xs">Select a secret to view its details. All data is edge-encrypted.</p>
    </div>
  );
  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <header className="p-6 border-b flex justify-between items-center bg-card/5 sticky top-0 z-10">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
            {item.type === 'passkey' ? <Fingerprint className="w-6 h-6" /> : item.title[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold truncate tracking-tight">{item.title}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-[10px] uppercase font-black px-1.5 py-0">{item.type}</Badge>
              {item.folder && <span className="text-xs text-muted-foreground flex items-center gap-1"><Folder className="w-3 h-3" />{item.folder}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => toggleFavorite.mutate(!item.favorite)} className={item.favorite ? "text-orange-500" : ""}>
            <Star className={cn("w-5 h-5", item.favorite && "fill-orange-500")} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}><Edit className="w-5 h-5" /></Button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div key="edit" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Button variant="ghost" onClick={() => setIsEditing(false)} className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
              <ItemForm initialData={item} onSuccess={() => setIsEditing(false)} onCancel={() => setIsEditing(false)} />
            </motion.div>
          ) : (
            <motion.div key="view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto space-y-8">
              {item.type === 'passkey' && item.passkeyData && (
                <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20 text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Fingerprint className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Hardware-Backed Security</h3>
                    <p className="text-sm text-muted-foreground">This item uses WebAuthn for secure, passwordless authentication.</p>
                  </div>
                  <div className="bg-secondary/30 p-4 rounded-xl font-mono text-xs text-muted-foreground break-all">
                    Credential ID: {item.passkeyData.credentialId}
                  </div>
                  <Button 
                    className="w-full h-14 text-lg btn-gradient" 
                    onClick={handlePasskeyAuth} 
                    disabled={isAuthenticating}
                  >
                    {isAuthenticating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ShieldCheck className="w-5 h-5 mr-2" />}
                    Verify Identity
                  </Button>
                </div>
              )}
              {item.type === 'login' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border bg-secondary/10 group">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Username</Label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-medium truncate">{item.username || '—'}</span>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(item.username!, 'Username')}><Copy className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border bg-secondary/10 group">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Password</Label>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-mono tracking-widest">••••••••</span>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(item.password!, 'Password')}><Copy className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              )}
              {item.totpSecret && (
                <div className="p-6 rounded-2xl bg-secondary/5 border space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold uppercase tracking-widest">2FA Code</Label>
                    <Badge variant="outline" className="font-mono">{totp.secondsRemaining}s</Badge>
                  </div>
                  <div className="text-4xl font-mono font-black text-center tracking-[0.2em] py-2 text-primary">
                    {totp.code.slice(0,3)} {totp.code.slice(3)}
                  </div>
                  <Button variant="secondary" className="w-full" onClick={() => copyToClipboard(totp.code, '2FA Code')}>Copy Code</Button>
                </div>
              )}
              {item.notes && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest">Notes</Label>
                  <div className="p-6 rounded-2xl bg-secondary/10 border whitespace-pre-wrap leading-relaxed">{item.notes}</div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}