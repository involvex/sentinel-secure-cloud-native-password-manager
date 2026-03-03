import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Key, ShieldCheck, Globe, CreditCard, FolderPlus, Tag, X } from 'lucide-react';
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
const schema = z.object({
  type: z.enum(['login', 'card', 'note']),
  title: z.string().min(1, 'Title is required'),
  username: z.string().optional(),
  password: z.string().optional(),
  totpSecret: z.string().optional(),
  url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
  folder: z.string().optional(),
  favorite: z.boolean(),
  tags: z.array(z.string()).default([]),
});
type FormValues = z.infer<typeof schema>;
interface ItemFormProps {
  initialData?: VaultItem;
  onSuccess?: () => void;
  onCancel?: () => void;
}
export function ItemForm({ initialData, onSuccess, onCancel }: ItemFormProps) {
  const queryClient = useQueryClient();
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
    },
  });
  const selectedType = watch('type');
  const currentTags = watch('tags') || [];
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
  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.currentTarget.value.trim().toLowerCase();
      if (val && !currentTags.includes(val)) {
        setValue('tags', [...currentTags, val]);
        e.currentTarget.value = '';
      }
    }
  };
  const removeTag = (tag: string) => {
    setValue('tags', currentTags.filter(t => t !== tag));
  };
  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
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
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="note">Secure Note</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input {...register('title')} placeholder="e.g. GitHub, Personal Visa" className="bg-secondary/30" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Folder</Label>
            <div className="relative">
              <Input {...register('folder')} className="pl-9 bg-secondary/30" placeholder="Personal, Work..." />
              <FolderPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="relative">
              <Input 
                className="pl-9 bg-secondary/30" 
                placeholder="Press Enter to add" 
                onKeyDown={addTag}
              />
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {currentTags.map(tag => (
                <Badge key={tag} variant="secondary" className="pl-2 pr-1 py-0.5 gap-1 text-[10px] uppercase font-bold bg-primary/5 border border-primary/10">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
        {selectedType === 'login' && (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Username</Label>
              <div className="relative">
                <Input {...register('username')} className="pl-9 bg-secondary/30" placeholder="Email or Username" />
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input {...register('password')} className="pl-9 bg-secondary/30" type="password" placeholder="••••••••" />
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 overflow-hidden" align="end">
                    <GeneratorTool onUse={(pw) => setValue('password', pw)} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Two-Factor Secret (TOTP)</Label>
              <Input {...register('totpSecret')} className="bg-secondary/30 font-mono" placeholder="JBSWY3DPEHPK3PXP" />
            </div>
            <div className="space-y-2">
              <Label>Website URL</Label>
              <Input {...register('url')} className="bg-secondary/30" placeholder="https://example.com" />
              {errors.url && <p className="text-xs text-destructive">{errors.url.message}</p>}
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            {...register('notes')}
            placeholder="Add any additional details here..."
            className="min-h-[100px] bg-secondary/30 resize-none"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={mutation.isPending}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="btn-gradient min-w-[120px]" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {initialData ? 'Update Item' : 'Secure Save'}
        </Button>
      </div>
    </form>
  );
}