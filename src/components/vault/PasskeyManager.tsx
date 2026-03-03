import React, { useState, useEffect } from 'react';
import { Fingerprint, Smartphone, Laptop, Usb, Trash2, Plus, ShieldCheck, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api-client';
import { registerPasskey, checkPlatformAuthenticatorSupport } from '@/lib/webauthn-utils';
import type { PasskeyData, AuthenticatorType } from '@shared/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
interface PasskeyManagerProps {
  passkeys: PasskeyData[];
  title: string;
  onChange: (passkeys: PasskeyData[]) => void;
}
export function PasskeyManager({ passkeys, title, onChange }: PasskeyManagerProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [supportsPlatform, setSupportsPlatform] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  useEffect(() => {
    checkPlatformAuthenticatorSupport().then(setSupportsPlatform);
  }, []);
  const handleAddPasskey = async (type: AuthenticatorType) => {
    if (!title) {
      toast.error('Please enter a title for this item first');
      return;
    }
    setIsRegistering(true);
    try {
      const { challenge } = await api<{ challenge: string }>('/api/auth/challenge', { method: 'POST' });
      const cred = await registerPasskey({
        title,
        challenge,
        attachment: type === 'platform' ? 'platform' : 'cross-platform',
        userVerification: 'preferred'
      });
      const newPasskey: PasskeyData = {
        id: crypto.randomUUID(),
        label: newLabel || (type === 'platform' ? 'This Device' : 'Security Key'),
        credentialId: cred.credentialId,
        publicKey: cred.publicKey,
        transports: cred.transports,
        authenticatorType: cred.authenticatorType as any,
        createdAt: Date.now()
      };
      onChange([...passkeys, newPasskey]);
      setNewLabel('');
      setShowAddMenu(false);
      toast.success('Passkey added successfully');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };
  const removePasskey = (id: string) => {
    onChange(passkeys.filter(pk => pk.id !== id));
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Fingerprint className="w-4 h-4" /> Registered Authenticators
        </Label>
        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none">
          {passkeys.length} Keys
        </Badge>
      </div>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {passkeys.map((pk) => (
            <motion.div
              key={pk.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent/30 transition-colors group"
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                pk.authenticatorType === 'platform' ? "bg-indigo-500/10 text-indigo-600" : "bg-emerald-500/10 text-emerald-600"
              )}>
                {pk.authenticatorType === 'platform' ? <Laptop className="w-5 h-5" /> : <Usb className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{pk.label}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-tighter">
                  {pk.authenticatorType === 'platform' ? 'Biometric / PIN' : 'Hardware Key'} • Added {new Date(pk.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                onClick={() => removePasskey(pk.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
        {passkeys.length === 0 && !showAddMenu && (
          <div className="p-8 rounded-2xl border border-dashed text-center space-y-3 bg-secondary/20">
            <Fingerprint className="w-10 h-10 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground">No passkeys registered yet.</p>
            <Button variant="outline" size="sm" onClick={() => setShowAddMenu(true)}>
              Setup First Passkey
            </Button>
          </div>
        )}
      </div>
      <AnimatePresence>
        {showAddMenu ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 rounded-2xl border bg-accent/20 space-y-4"
          >
            <div className="space-y-2">
              <Label className="text-xs">Custom Label (Optional)</Label>
              <Input
                placeholder="e.g. Work MacBook, Blue YubiKey"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                className="h-20 flex-col gap-2 bg-background border hover:border-indigo-500/50 hover:bg-indigo-500/5 group"
                onClick={() => handleAddPasskey('platform')}
                disabled={isRegistering || !supportsPlatform}
              >
                <Laptop className={cn("w-6 h-6", supportsPlatform ? "text-indigo-500" : "text-muted-foreground/50")} />
                <div className="text-center">
                  <p className="text-xs font-bold">This Device</p>
                  <p className="text-[10px] text-muted-foreground">TouchID / Hello</p>
                </div>
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-20 flex-col gap-2 bg-background border hover:border-emerald-500/50 hover:bg-emerald-500/5"
                onClick={() => handleAddPasskey('cross-platform')}
                disabled={isRegistering}
              >
                <Usb className="w-6 h-6 text-emerald-500" />
                <div className="text-center">
                  <p className="text-xs font-bold">Security Key</p>
                  <p className="text-[10px] text-muted-foreground">USB / NFC / BLE</p>
                </div>
              </Button>
            </div>
            {!supportsPlatform && (
              <div className="flex items-start gap-2 text-[10px] text-muted-foreground px-1">
                <Info className="w-3 h-3 shrink-0" />
                <span>Biometric login is not available on this device/browser. Use a hardware key instead.</span>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAddMenu(false)}>Cancel</Button>
            </div>
          </motion.div>
        ) : (
          passkeys.length > 0 && (
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed gap-2"
              onClick={() => setShowAddMenu(true)}
              disabled={isRegistering}
            >
              {isRegistering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Another Key
            </Button>
          )
        )}
      </AnimatePresence>
    </div>
  );
}