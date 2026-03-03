import React, { useState, useEffect, useMemo } from 'react';
import { useVaultStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { generateTOTP } from '@/lib/totp-utils';
import { getStrengthData, checkPasswordBreach } from '@/lib/security-utils';
import type { VaultItem } from '@shared/types';
import { Button } from '@/components/ui/button';
import { ItemForm } from './ItemForm';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import {
  Copy, Edit, ShieldCheck, Check, Laptop, Eye, EyeOff, Mail, Wifi, Terminal, User, MapPin, Phone, Calendar, CreditCard, Globe, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { getFaviconUrl, maskCardNumber } from '@/lib/utils';
export function ItemDetail() {
  const selectedItemId = useVaultStore(s => s.selectedItemId);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copyState, setCopyState] = useState<Record<string, boolean>>({});
  const [totp, setTotp] = useState({ code: '------', secondsRemaining: 30 });
  const [breachInfo, setBreachInfo] = useState<{ isBreached: boolean; count: number } | null>(null);
  const { data: itemsData } = useQuery({
    queryKey: ['vault-items'],
    queryFn: () => api<{ items: VaultItem[] }>('/api/vault')
  });
  const item = itemsData?.items.find(i => i.id === selectedItemId);
  useEffect(() => {
    if (item?.password) {
      checkPasswordBreach(item.password).then(setBreachInfo);
    } else {
      setBreachInfo(null);
    }
  }, [item?.password, item?.id]);
  useEffect(() => {
    if (item?.totpSecret) {
      const updateTotp = () => {
        if (item.totpSecret) setTotp(generateTOTP(item.totpSecret));
      };
      updateTotp();
      const interval = setInterval(updateTotp, 1000);
      return () => clearInterval(interval);
    }
  }, [item?.totpSecret, item?.id]);
  useEffect(() => {
    setIsEditing(false);
    setShowPassword(false);
    setCopyState({});
  }, [selectedItemId]);

  const copyAllCardInfo = () => {
    if (!item || item.type !== 'card') return;
    const details = item as any;
    const text = `Cardholder: ${details.cardholderName}\nNumber: ${details.cardNumber}\nExpiry: ${details.expiryDate}\nCVV: ${details.cvv}`;
    navigator.clipboard.writeText(text);
    toast.success("All card details copied to clipboard");
  };

  const copyToClipboard = (text: string | undefined, label: string) => {
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
    if (!value || value.trim() === '') return null;
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
      <header className="p-6 border-b flex justify-between items-center bg-card/5 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          {item.url ? (
            <div className="w-12 h-12 rounded-xl bg-white border flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
              <img src={getFaviconUrl(item.url)} alt="" className="w-8 h-8 object-contain" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center text-primary-foreground font-bold text-xl shrink-0">
              {item.title[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-2xl font-bold truncate tracking-tight">{item.title}</h2>
            <Badge variant="secondary" className="text-[10px] uppercase px-1.5 py-0 bg-primary/10 text-primary">{item.type}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)} className={cn(isEditing && "bg-accent text-accent-foreground")}>
            <Edit className="w-5 h-5" />
          </Button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ItemForm initialData={item} onSuccess={() => setIsEditing(false)} onCancel={() => setIsEditing(false)} />
            </motion.div>
          ) : (
            <div className="max-w-xl mx-auto space-y-6 pb-12">
              {item.type === 'login' && (
                <>
                  {renderField('Username', item.username, <User className="w-3 h-3" />)}
                  {renderField('Password', item.password, <ShieldCheck className="w-3 h-3" />, true)}
                  {item.url && (
                    <div className="space-y-2">
                      {renderField('URL', item.url, <Globe className="w-3 h-3" />)}
                      <Button 
                        variant="outline" 
                        className="w-full gap-2 text-xs h-9 font-bold"
                        onClick={() => window.open(item.url?.startsWith('http') ? item.url : `https://${item.url}`, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" /> Visit Website
                      </Button>
                    </div>
                  )}
                </>
              )}
              {item.type === 'card' && (
                <div className="space-y-6">
                  <div className="relative aspect-[1.586/1] w-full max-w-sm mx-auto p-8 rounded-3xl bg-slate-900 text-white shadow-2xl overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <CreditCard className="w-10 h-10 text-slate-400" />
                        <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">Sentinel Card</span>
                      </div>
                      <div className="space-y-4">
                        <div className="text-2xl font-mono tracking-[0.2em]">
                          {showPassword ? (item as any).cardNumber : maskCardNumber((item as any).cardNumber)}
                        </div>
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <p className="text-[8px] uppercase tracking-tighter text-slate-500">Cardholder</p>
                            <p className="text-sm font-bold uppercase">{(item as any).cardholderName || '---'}</p>
                          </div>
                          <div className="space-y-1 text-right">
                            <p className="text-[8px] uppercase tracking-tighter text-slate-500">Expires</p>
                            <p className="text-sm font-bold font-mono">{(item as any).expiryDate || '--/--'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {renderField('Card Number', (item as any).cardNumber, <CreditCard className="w-3 h-3" />, true)}
                    {renderField('Cardholder', (item as any).cardholderName, <User className="w-3 h-3" />)}
                    <div className="grid grid-cols-2 gap-3">
                      {renderField('Expiry', (item as any).expiryDate, <Calendar className="w-3 h-3" />)}
                      {renderField('CVV', (item as any).cvv, <ShieldCheck className="w-3 h-3" />, true)}
                    </div>
                  </div>
                  <Button variant="secondary" className="w-full h-11 font-bold gap-2" onClick={copyAllCardInfo}>
                    <Copy className="w-4 h-4" /> Copy All Card Info
                  </Button>
                </div>
              )}
              {item.type === 'passport' && (
                <>
                  {renderField('Passport Number', (item as any).passportNumber, <ShieldCheck className="w-3 h-3" />, true)}
                  {renderField('Issuing Country', (item as any).issuingCountry, <Globe className="w-3 h-3" />)}
                </>
              )}
              {item.type === 'wifi' && (
                <>
                  {renderField('SSID', item.ssid, <Wifi className="w-3 h-3" />)}
                  {renderField('WiFi Password', item.wifiPassword, <ShieldCheck className="w-3 h-3" />, true)}
                  <div className="p-6 rounded-3xl border bg-primary/5 flex flex-col items-center gap-4">
                    <Label className="text-xs font-bold uppercase text-primary">Quick Share</Label>
                    <div className="bg-white p-3 rounded-xl border shadow-sm">
                      <QRCodeSVG value={`WIFI:T:WPA;S:${item.ssid};P:${item.wifiPassword};;`} size={160} />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">Scan with a phone to join network</p>
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
                    <span className="font-mono text-sm truncate mr-2">{item.aliasEmail}</span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(item.aliasEmail, 'Alias')} className="shrink-0">
                      {copyState['Alias'] ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
              {item.type === 'identity' && (
                <div className="grid grid-cols-1 gap-3">
                  {renderField('Full Name', item.identityName, <User className="w-3 h-3" />)}
                  {renderField('DOB', item.dob, <Calendar className="w-3 h-3" />)}
                  {renderField('Phone', item.phone, <Phone className="w-3 h-3" />)}
                  {renderField('Address', item.address, <MapPin className="w-3 h-3" />)}
                </div>
              )}
              {item.type === 'ssh' && (
                <>
                  {renderField('Host', item.sshHost, <Terminal className="w-3 h-3" />)}
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-2">Private Key</Label>
                    <div className="p-4 rounded-2xl border bg-slate-950 text-slate-50 font-mono text-[10px] overflow-x-auto whitespace-pre leading-relaxed max-h-48">
                      {showPassword ? item.sshKey : '••••••••••••••••••••••••••••••••'}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 h-9" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="w-3 h-3 mr-2" /> : <Eye className="w-3 h-3 mr-2" />}
                        {showPassword ? 'Mask Key' : 'Reveal Key'}
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 h-9" onClick={() => copyToClipboard(item.sshKey, 'SSH Key')}>
                        <Copy className="w-3 h-3 mr-2" /> Copy Key
                      </Button>
                    </div>
                  </div>
                </>
              )}
              {item.notes && (
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-2">Secure Notes</Label>
                  <div className="p-6 rounded-3xl bg-secondary/10 border border-border/50 text-sm whitespace-pre-wrap leading-relaxed">
                    {item.notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}