import React, { useState, useEffect, useMemo } from 'react';
import { useVaultStore } from '@/lib/store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { generateTOTP } from '@/lib/totp-utils';
import { getStrengthData, checkPasswordBreach } from '@/lib/security-utils';
import type { VaultItem } from '@shared/types';
import { Button } from '@/components/ui/button';
import { ItemForm } from './ItemForm';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { QRDisplay } from './QRDisplay';
import { QRCodeSVG } from 'qrcode.react';
import {
  Copy, Star, Edit, ArrowLeft, ShieldCheck, Fingerprint, Loader2, Folder,
  Clock, Check, Laptop, Usb, Eye, EyeOff, AlertTriangle, ShieldAlert, 
  Wifi, Terminal, Mail, Shield, User, MapPin, Phone, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { authenticatePasskey } from '@/lib/webauthn-utils';
export function ItemDetail() {
  const selectedItemId = useVaultStore(s => s.selectedItemId);
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copyState, setCopyState] = useState<Record<string, boolean>>({});
  const [totp, setTotp] = useState({ code: '------', secondsRemaining: 30 });
  const [breachInfo, setBreachInfo] = useState<{ isBreached: boolean; count: number } | null>(null);
  const { data: itemsData } = useQuery({
    queryKey: ['vault-items'],
    queryFn: () => api<{ items: VaultItem[] }>('/api/vault')
  });
  const item = itemsData?.items.find(i => i.id === selectedItemId);
  const strength = useMemo(() => item?.password ? getStrengthData(item.password) : null, [item?.password]);
  useEffect(() => {
    if (item?.password) checkPasswordBreach(item.password).then(setBreachInfo);
    else setBreachInfo(null);
  }, [item?.password]);
  useEffect(() => {
    if (item?.totpSecret) {
      const updateTotp = () => setTotp(generateTOTP(item.totpSecret!));
      updateTotp();
      const interval = setInterval(updateTotp, 1000);
      return () => clearInterval(interval);
    }
  }, [item?.totpSecret, item?.id]);
  useEffect(() => {
    setIsEditing(false);
    setShowPassword(false);
  }, [selectedItemId]);
  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyState(prev => ({ ...prev, [label]: true }));
    toast.success(`${label} copied`);
    setTimeout(() => setCopyState(prev => ({ ...prev, [label]: false })), 1500);
  };
  if (!item) return (
    <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-background/30">
      <ShieldCheck className="w-16 h-16 text-muted-foreground/20 mb-6" />
      <h3 className="text-xl font-bold">Vault Protected</h3>
      <p className="text-muted-foreground text-sm mt-2">Select an item to view encrypted details.</p>
    </div>
  );
  const renderField = (label: string, value: string | undefined, icon?: React.ReactNode, isSecret = false) => {
    if (!value) return null;
    return (
      <div className="p-4 rounded-2xl border bg-secondary/20 hover:bg-secondary/30 transition-colors group">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{label}</Label>
        </div>
        <div className="flex justify-between items-center">
          <span className={cn("font-medium truncate", isSecret && !showPassword && "blur-sm select-none")}>
            {isSecret && !showPassword ? '••••••••' : value}
          </span>
          <div className="flex gap-1">
            {isSecret && (
              <Button variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} className="h-8 w-8">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(value, label)} className="h-8 w-8">
              {copyState[label] ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <header className="p-6 border-b flex justify-between items-center bg-card/5 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center text-primary-foreground font-bold text-xl shrink-0">
            {item.title[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold truncate tracking-tight">{item.title}</h2>
            <Badge variant="secondary" className="text-[10px] uppercase px-1.5 py-0 bg-primary/10 text-primary">{item.type}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}><Edit className="w-5 h-5" /></Button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ItemForm initialData={item} onSuccess={() => setIsEditing(false)} onCancel={() => setIsEditing(false)} />
            </motion.div>
          ) : (
            <div className="max-w-xl mx-auto space-y-6">
              {item.type === 'login' && (
                <>
                  {renderField('Username', item.username, <User className="w-3 h-3" />)}
                  {renderField('Password', item.password, <ShieldCheck className="w-3 h-3" />, true)}
                </>
              )}
              {item.type === 'wifi' && (
                <>
                  {renderField('SSID', item.ssid, <Wifi className="w-3 h-3" />)}
                  {renderField('WiFi Password', item.wifiPassword, <ShieldCheck className="w-3 h-3" />, true)}
                  <div className="p-6 rounded-3xl border bg-primary/5 flex flex-col items-center gap-4">
                    <Label className="text-xs font-bold uppercase text-primary">Share Network</Label>
                    <div className="bg-white p-3 rounded-xl border">
                      <QRCodeSVG value={`WIFI:T:WPA;S:${item.ssid};P:${item.wifiPassword};;`} size={160} />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">Scan to connect to {item.ssid}</p>
                  </div>
                </>
              )}
              {item.type === 'alias' && (
                <div className="p-5 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-indigo-500" />
                    <Label className="text-xs font-bold text-indigo-600 uppercase">Secure Email Alias</Label>
                  </div>
                  <div className="flex justify-between items-center bg-background p-3 rounded-xl border">
                    <span className="font-mono text-sm">{item.aliasEmail}</span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(item.aliasEmail!, 'Alias')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Forwarding all messages to your primary vault address.</p>
                </div>
              )}
              {item.type === 'identity' && (
                <div className="grid grid-cols-1 gap-3">
                  {renderField('Full Name', item.identityName, <User className="w-3 h-3" />)}
                  {renderField('Date of Birth', item.dob, <Calendar className="w-3 h-3" />)}
                  {renderField('Phone', item.phone, <Phone className="w-3 h-3" />)}
                  {renderField('Address', item.address, <MapPin className="w-3 h-3" />)}
                </div>
              )}
              {item.type === 'ssh' && (
                <>
                  {renderField('Host / Server', item.sshHost, <Terminal className="w-3 h-3" />)}
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-2">Private Key</Label>
                    <div className="p-4 rounded-2xl border bg-slate-950 text-slate-50 font-mono text-[10px] overflow-x-auto whitespace-pre leading-tight">
                      {showPassword ? item.sshKey : '••••••••••••••••••••••••••••••••'}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="w-3 h-3 mr-2" /> : <Eye className="w-3 h-3 mr-2" />}
                        {showPassword ? 'Mask Key' : 'Show Key'}
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => copyToClipboard(item.sshKey!, 'SSH Key')}>
                        <Copy className="w-3 h-3 mr-2" /> Copy Key
                      </Button>
                    </div>
                  </div>
                </>
              )}
              {item.notes && (
                <div className="p-6 rounded-3xl bg-secondary/10 border border-border/50 text-sm whitespace-pre-wrap">
                  {item.notes}
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}