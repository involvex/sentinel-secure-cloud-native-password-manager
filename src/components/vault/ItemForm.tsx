import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, ShieldCheck, Shield, X, Camera, ShieldAlert, Key, CreditCard, Mail, Wifi, Terminal, ScanFace, FileText, User, MapPin, Calendar, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { GeneratorTool } from './GeneratorTool';
import { PasskeyManager } from './PasskeyManager';
import { VaultItem, VaultItemType } from '@shared/types';
import { getStrengthData } from '@/lib/security-utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
const schema = z.object({
  type: z.enum(['login', 'card', 'note', 'passkey', 'alias', 'identity', 'wifi', 'ssh', 'passport']),
  title: z.string().min(1, 'Title is required'),
  username: z.string().optional(),
  password: z.string().optional(),
  totpSecret: z.string().optional(),
  url: z.string().url('Invalid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
  folder: z.string().optional(),
  favorite: z.boolean(),
  tags: z.array(z.string()),
  passkeys: z.array(z.any()).optional(),
  aliasEmail: z.string().optional(),
  identityName: z.string().optional(),
  dob: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  ssid: z.string().optional(),
  wifiPassword: z.string().optional(),
  sshHost: z.string().optional(),
  sshKey: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;
export function ItemForm({ initialData, onSuccess, onCancel }: { initialData?: VaultItem; onSuccess?: () => void; onCancel?: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: initialData?.type ?? 'login',
      title: initialData?.title ?? '',
      username: initialData?.username ?? '',
      password: initialData?.password ?? '',
      favorite: initialData?.favorite ?? false,
      tags: initialData?.tags ?? [],
      ssid: initialData?.ssid ?? '',
      wifiPassword: initialData?.wifiPassword ?? '',
      identityName: initialData?.identityName ?? '',
      dob: initialData?.dob ?? '',
      phone: initialData?.phone ?? '',
      address: initialData?.address ?? '',
      sshHost: initialData?.sshHost ?? '',
      sshKey: initialData?.sshKey ?? '',
      aliasEmail: initialData?.aliasEmail ?? (initialData?.type === 'alias' ? initialData.aliasEmail : `sentinel_${Math.random().toString(36).slice(2, 7)}@vault.internal`),
    },
  });
  const selectedType = watch('type');
  const mutation = useMutation({
    mutationFn: (values: FormValues) => initialData?.id ? api(`/api/vault/${initialData.id}`, { method: 'PUT', body: JSON.stringify(values) }) : api('/api/vault', { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vault-items'] }); toast.success('Saved'); onSuccess?.(); },
    onError: (err: any) => toast.error(err.message)
  });
  const types = [
    { id: 'login', icon: Key, label: 'Login' },
    { id: 'card', icon: CreditCard, label: 'Card' },
    { id: 'wifi', icon: Wifi, label: 'WiFi' },
    { id: 'alias', icon: Mail, label: 'Alias' },
    { id: 'identity', icon: Shield, label: 'Identity' },
    { id: 'ssh', icon: Terminal, label: 'SSH Key' },
    { id: 'passport', icon: ScanFace, label: 'Passport' },
    { id: 'note', icon: FileText, label: 'Note' },
  ];
  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-6">
        {types.map((t) => (
          <Button
            key={t.id}
            type="button"
            variant={selectedType === t.id ? 'default' : 'outline'}
            className="flex-col h-16 text-[10px] gap-1 p-0"
            onClick={() => setValue('type', t.id as VaultItemType)}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </Button>
        ))}
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input {...register('title')} placeholder="GitHub, Home Router..." className="bg-secondary/30" />
        </div>
        {selectedType === 'login' && (
          <>
            <Input {...register('username')} placeholder="Email/Username" className="bg-secondary/30" />
            <div className="flex gap-2">
              <Input {...register('password')} type="password" placeholder="Password" className="bg-secondary/30 flex-1" />
              <Popover>
                <PopoverTrigger asChild><Button variant="outline"><ShieldCheck className="w-4 h-4" /></Button></PopoverTrigger>
                <PopoverContent className="w-80 p-0"><GeneratorTool onUse={(p) => setValue('password', p)} /></PopoverContent>
              </Popover>
            </div>
          </>
        )}
        {selectedType === 'wifi' && (
          <>
            <Input {...register('ssid')} placeholder="Network Name (SSID)" className="bg-secondary/30" />
            <Input {...register('wifiPassword')} type="password" placeholder="WiFi Password" className="bg-secondary/30" />
          </>
        )}
        {selectedType === 'alias' && (
          <Input {...register('aliasEmail')} readOnly className="bg-muted font-mono" />
        )}
        {selectedType === 'identity' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input {...register('identityName')} placeholder="Full Name" className="bg-secondary/30" />
            <Input {...register('dob')} type="date" className="bg-secondary/30" />
            <Input {...register('phone')} placeholder="Phone Number" className="bg-secondary/30" />
            <Input {...register('address')} placeholder="Address" className="bg-secondary/30 md:col-span-2" />
          </div>
        )}
        {selectedType === 'ssh' && (
          <>
            <Input {...register('sshHost')} placeholder="SSH Hostname/IP" className="bg-secondary/30" />
            <Textarea {...register('sshKey')} placeholder="-----BEGIN OPENSSH PRIVATE KEY-----" className="bg-secondary/30 font-mono text-xs h-32" />
          </>
        )}
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea {...register('notes')} className="bg-secondary/30 h-24" placeholder="Encrypted notes..." />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="btn-gradient px-8" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="animate-spin mr-2" /> : 'Save Securely'}
        </Button>
      </div>
    </form>
  );
}