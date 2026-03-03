import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, ShieldCheck, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GeneratorTool } from './GeneratorTool';
import { QRScanner } from './QRScanner';
import { PasskeyManager } from './PasskeyManager';
import { VaultItem, VaultItemType } from '@shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
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
  passkeys: z.array(z.any()).optional(),
});
type FormValues = z.infer<typeof schema>;
interface ItemFormProps {
  initialData?: VaultItem;
  onSuccess?: () => void;
  onCancel?: () => void;
}
export function ItemForm({ initialData, onSuccess, onCancel }: ItemFormProps) {
  const queryClient = useQueryClient();
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);
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
      passkeys: initialData?.passkeys ?? [],
    },
  });
  const selectedType = watch('type');
  const title = watch('title');
  const currentTags = watch('tags') || [];
  const currentPasskeys = watch('passkeys') || [];
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
  const onSubmit = (data: FormValues) => {
    if (data.type === 'passkey' && (!data.passkeys || data.passkeys.length === 0)) {
      toast.error('You must register at least one passkey before saving');
      return;
    }
    mutation.mutate(data);
  };

  const handleQRScan = (text: string) => {
    const { parseOtpAuthUri } = require('@/lib/totp-utils');
    const info = parseOtpAuthUri(text);
    if (info) {
      setValue('totpSecret', info.secret);
      if (!watch('title') && info.issuer) setValue('title', info.issuer);
      if (!watch('username') && info.account) setValue('username', info.account);
      toast.success('2FA details imported from QR');
    } else {
      // If not otpauth, maybe it's just a raw secret string
      setValue('totpSecret', text);
      toast.success('Secret imported from QR');
    }
    setIsScannerOpen(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="pt-2 border-t mt-4">
            <PasskeyManager
              passkeys={currentPasskeys}
              title={title}
              onChange={(pk) => setValue('passkeys', pk)}
            />
          </div>
        )}
        {selectedType === 'login' && (
          <div className="space-y-4 pt-2 border-t mt-4">
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
                    <Button type="button" variant="outline" size="icon"><ShieldCheck className="w-4 h-4" /></Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <GeneratorTool onUse={(pw) => setValue('password', pw)} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="flex-1">Two-Step Verification (TOTP)</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-[10px] font-bold uppercase tracking-tighter gap-1 text-primary hover:bg-primary/10 px-2"
                  onClick={() => setIsScannerOpen(true)}
                >
                  <Camera className="w-3 h-3" />
                  Scan QR
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">Enter your 2FA secret key (Base32) or an otpauth:// URL. Sentinel will automatically generate codes.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input 
                {...register('totpSecret')} 
                className="bg-secondary/30 font-mono text-xs" 
                placeholder="e.g. JBSWY3DPEHPK3PXP" 
              />
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
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea {...register('notes')} className="bg-secondary/30 min-h-[100px]" placeholder="Add any secure notes..." />
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