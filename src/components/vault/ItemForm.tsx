import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Key, ShieldCheck, Globe, CreditCard, FolderPlus, Tag, X, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GeneratorTool } from './GeneratorTool';
import { VaultItem, VaultItemType } from '@shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { registerPasskey } from '@/lib/webauthn-utils';
const schema = z.object({
  type: z.enum(['login', 'card', 'note', 'passkey']),
  title: z.string().min(1, 'Title is required'),
  username: z.string().optional(),
  password: z.string().optional(),
  totpSecret: z.string().optional(),
  url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
  folder: z.string().optional(),
  favorite: z.boolean(),
  tags: z.array(z.string()),
  passkeyData: z.any().optional(),
});
type FormValues = z.infer<typeof schema>;
interface ItemFormProps {
  initialData?: VaultItem;
  onSuccess?: () => void;
  onCancel?: () => void;
}
export function ItemForm({ initialData, onSuccess, onCancel }: ItemFormProps) {
  const queryClient = useQueryClient();
  const [isRegistering, setIsRegistering] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: initialData?.type ?? 'login',
      title: initialData?.title ?? '',
      username: initialData?.username ?? '',
      password: initialData?.password ?? '',
      totpSecret: initialData?.totpSecret ?? '',
      url: initialData?.url ?? '',
      notes: initialData?.notes ?? '',
      folder: initialData?.folder ?? '',
      favorite: initialData?.favorite ?? false,
      tags: initialData?.tags ?? [],
      passkeyData: initialData?.passkeyData,
    },
  });
  const selectedType = watch('type');
  const currentTags = watch('tags') || [];
  const currentPasskey = watch('passkeyData');
  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = { ...values, updatedAt: Date.now() };
      if (initialData?.id) {
        return api<VaultItem>(`/api/vault/${initialData.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      }
      return api<VaultItem>('/api/vault', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-items'] });
      toast.success(initialData?.id ? 'Item updated' : 'Item created');
      onSuccess?.();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    }
  });
  const handleRegisterPasskey = async () => {
    const title = watch('title');
    if (!title) {
      toast.error('Please enter a title first');
      return;
    }
    setIsRegistering(true);
    try {
      const { challenge } = await api<{ challenge: string }>('/api/auth/challenge', { method: 'POST' });
      const cred = await registerPasskey(title, challenge);
      setValue('passkeyData', {
        ...cred,
        signCount: 0,
        createdAt: Date.now()
      });
      toast.success('Passkey registered successfully on device');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Passkey registration failed');
    } finally {
      setIsRegistering(false);
    }
  };
  const onSubmit = (data: FormValues) => {
    if (data.type === 'passkey' && !data.passkeyData) {
      toast.error('You must register a passkey before saving');
      return;
    }
    mutation.mutate(data);
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Item Type</Label>
            <Select
              defaultValue={selectedType}
              onValueChange={(val) => setValue('type', val as VaultItemType)}
            >
              <SelectTrigger className="bg-secondary/30">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="passkey">Passkey</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="note">Secure Note</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input {...register('title')} placeholder="e.g. GitHub, Google" className="bg-secondary/30" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
        </div>
        {selectedType === 'passkey' && (
          <div className="p-6 rounded-2xl bg-primary/5 border border-dashed border-primary/30 text-center space-y-4">
            <div className="flex justify-center">
              <Fingerprint className="w-12 h-12 text-primary/40" />
            </div>
            {currentPasskey ? (
              <div className="space-y-2">
                <p className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Hardware Credential Linked
                </p>
                <p className="text-[10px] font-mono text-muted-foreground truncate max-w-xs mx-auto">
                  ID: {currentPasskey.credentialId}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={handleRegisterPasskey} disabled={isRegistering}>
                  Replace Passkey
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Register this device or a hardware key as a passkey for this vault item.</p>
                <Button 
                  type="button" 
                  className="btn-gradient" 
                  onClick={handleRegisterPasskey} 
                  disabled={isRegistering}
                >
                  {isRegistering ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Fingerprint className="w-4 h-4 mr-2" />}
                  Register New Passkey
                </Button>
              </div>
            )}
          </div>
        )}
        {selectedType === 'login' && (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input {...register('username')} className="bg-secondary/30" placeholder="Email or Username" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="flex gap-2">
                <Input {...register('password')} className="flex-1 bg-secondary/30" type="password" placeholder="••••••••" />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon"><ShieldCheck className="w-4 h-4" /></Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0"><GeneratorTool onUse={(pw) => setValue('password', pw)} /></PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Folder</Label>
            <Input {...register('folder')} className="bg-secondary/30" placeholder="Personal, Work..." />
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <Input
              className="bg-secondary/30"
              placeholder="Press Enter to add"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const val = e.currentTarget.value.trim().toLowerCase();
                  if (val && !currentTags.includes(val)) {
                    setValue('tags', [...currentTags, val]);
                    e.currentTarget.value = '';
                  }
                }
              }}
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {currentTags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setValue('tags', currentTags.filter(t => t !== tag))} />
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" className="btn-gradient" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {initialData ? 'Update Item' : 'Secure Save'}
        </Button>
      </div>
    </form>
  );
}