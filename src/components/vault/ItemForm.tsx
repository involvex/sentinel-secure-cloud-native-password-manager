import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, ShieldCheck, Shield, Key, CreditCard, Mail, Wifi, Terminal, ScanFace, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GeneratorTool } from './GeneratorTool';
import { VaultItem, VaultItemType } from '@shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
const schema = z.object({
  type: z.enum(['login', 'card', 'note', 'passkey', 'alias', 'identity', 'wifi', 'ssh', 'passport', 'monitor']),
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
      type: (initialData?.type as FormValues['type']) ?? 'login',
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
    mutationFn: (values: FormValues) => initialData?.id 
      ? api<VaultItem>(`/api/vault/${initialData.id}`, { method: 'PUT', body: JSON.stringify(values) }) 
      : api<VaultItem>('/api/vault', { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['vault-items'] }); 
      toast.success('Saved'); 
      onSuccess?.(); 
    },
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
    <form onSubmit={handleSubmit((data: FormValues) => mutation.mutate(data))} className="space-y-6">
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-6">
        {types.map((t) => (
          <Button
            key={t.id}
            type="button"
            variant={selectedType === t.id ? 'default' : 'outline'}
            className="flex-col h-16 text-[10px] gap-1 p-0"
            onClick={() => setValue('type', t.id as FormValues['type'])}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </Button>
        ))}
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input {...register('title')} placeholder="GitHub, Home Router..." className="bg-secondary/30" />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        {selectedType === 'login' && (
          <>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input {...register('username')} placeholder="Email/Username" className="bg-secondary/30" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="flex gap-2">
                <Input {...register('password')} type="password" placeholder="Password" className="bg-secondary/30 flex-1" />
                <Popover>
                  <PopoverTrigger asChild><Button variant="outline" type="button"><ShieldCheck className="w-4 h-4" /></Button></PopoverTrigger>
                  <PopoverContent className="w-80 p-0" side="top"><GeneratorTool onUse={(p) => setValue('password', p)} /></PopoverContent>
                </Popover>
              </div>
            </div>
          </>
        )}
        {selectedType === 'wifi' && (
          <>
            <div className="space-y-2">
              <Label>SSID</Label>
              <Input {...register('ssid')} placeholder="Network Name (SSID)" className="bg-secondary/30" />
            </div>
            <div className="space-y-2">
              <Label>WiFi Password</Label>
              <Input {...register('wifiPassword')} type="password" placeholder="WiFi Password" className="bg-secondary/30" />
            </div>
          </>
        )}
        {selectedType === 'alias' && (
          <div className="space-y-2">
            <Label>Generated Alias</Label>
            <Input {...register('aliasEmail')} readOnly className="bg-muted font-mono" />
          </div>
        )}
        {selectedType === 'identity' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input {...register('identityName')} placeholder="Full Name" className="bg-secondary/30" />
            </div>
            <div className="space-y-2">
              <Label>DOB</Label>
              <Input {...register('dob')} type="date" className="bg-secondary/30" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...register('phone')} placeholder="Phone Number" className="bg-secondary/30" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Input {...register('address')} placeholder="Address" className="bg-secondary/30" />
            </div>
          </div>
        )}
        {selectedType === 'ssh' && (
          <>
            <div className="space-y-2">
              <Label>Host</Label>
              <Input {...register('sshHost')} placeholder="SSH Hostname/IP" className="bg-secondary/30" />
            </div>
            <div className="space-y-2">
              <Label>Private Key</Label>
              <Textarea {...register('sshKey')} placeholder="-----BEGIN OPENSSH PRIVATE KEY-----" className="bg-secondary/30 font-mono text-xs h-32" />
            </div>
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
          {mutation.isPending ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : 'Save Securely'}
        </Button>
      </div>
    </form>
  );
}