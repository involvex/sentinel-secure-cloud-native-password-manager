import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ItemForm } from './ItemForm';
import { useVaultStore } from '@/lib/store';
import { Shield } from 'lucide-react';
export function CreateItemDialog() {
  const isOpen = useVaultStore(s => s.isCreateDialogOpen);
  const setOpen = useVaultStore(s => s.setCreateDialogOpen);
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Add New Secret</DialogTitle>
          <DialogDescription>
            Enter the details of your sensitive data. It will be encrypted before storage.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ItemForm 
            onSuccess={() => setOpen(false)} 
            onCancel={() => setOpen(false)} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}