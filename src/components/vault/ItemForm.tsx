import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Key, ShieldCheck, Globe, CreditCard, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
  favorite: z.boolean().default(false),
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
    defaultValues: initialData || {
      type: 'login',
      title: '',
      favorite: false,
    },
  });
  const selectedType = watch('type');
  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (initialData?.id) {
        return api<VaultItem>(`/api/vault/${initialData.id}`, {
          method: 'PUT',
          body: JSON.stringify(values),
        });
      }
      return api<VaultItem>('/api/vault', {
        method: 'POST',
        body: JSON.stringify(values),
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
              <SelectTrigger>
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
            <Input {...register('title')} placeholder="e.g. GitHub, Personal Visa" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
        </div>
        {selectedType === 'login' && (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Username</Label>
              <div className="relative">
                <Input {...register('username')} className="pl-9" placeholder="Email or Username" />
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input {...register('password')} className="pl-9" type="password" placeholder="��•••••••" />
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                      <ShieldCheck className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <GeneratorTool onUse={(pw) => setValue('password', pw)} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Website URL</Label>
              <Input {...register('url')} placeholder="https://example.com" />
              {errors.url && <p className="text-xs text-destructive">{errors.url.message}</p>}
            </div>
          </div>
        )}
        {selectedType === 'card' && (
          <div className="space-y-4 pt-2">
             <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-3">
               <CreditCard className="w-5 h-5 text-primary" />
               <p className="text-sm text-muted-foreground">Store card numbers or details in the Notes field for maximum privacy.</p>
             </div>
          </div>
        )}
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea 
            {...register('notes')} 
            placeholder="Add any additional details here..." 
            className="min-h-[120px] resize-none"
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