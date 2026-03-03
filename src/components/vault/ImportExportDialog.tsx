import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useVaultStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Download, Upload, Shield, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api-client';
import { VaultItem } from '@shared/types';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
export function ImportExportDialog() {
  const isOpen = useVaultStore(s => s.isImportExportOpen);
  const setOpen = useVaultStore(s => s.setImportExportOpen);
  const [loading, setLoading] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const handleExport = async () => {
    setLoading(true);
    try {
      const data = await api<{ items: VaultItem[] }>('/api/vault');
      const blob = new Blob([JSON.stringify(data.items, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sentinel_vault_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Vault exported successfully');
    } catch (err) {
      toast.error('Failed to export vault');
    } finally {
      setLoading(false);
    }
  };
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const items = JSON.parse(event.target?.result as string);
        if (!Array.isArray(items)) throw new Error('Invalid format');
        await api('/api/vault/bulk', {
          method: 'POST',
          body: JSON.stringify(items)
        });
        queryClient.invalidateQueries({ queryKey: ['vault-items'] });
        toast.success(`Successfully imported ${items.length} items`);
        setOpen(false);
      } catch (err) {
        toast.error('Failed to import vault. Ensure the file is a valid Sentinel backup.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold">Data Portability</DialogTitle>
          <DialogDescription>
            Backup your vault to a secure file or restore items from a previous backup.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-6 py-6">
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Download className="w-4 h-4" /> Export
            </h4>
            <div className="p-4 rounded-xl border bg-secondary/20 space-y-3">
              <p className="text-xs text-muted-foreground">Download all logins, cards, and notes as an unencrypted JSON file. Store this backup safely.</p>
              <Button className="w-full btn-gradient" onClick={handleExport} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                Download Backup
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Upload className="w-4 h-4" /> Import
            </h4>
            <div className="p-4 rounded-xl border border-dashed bg-secondary/10 space-y-3">
              <p className="text-xs text-muted-foreground">Select a Sentinel backup file to restore your items. Duplicates will not be automatically merged.</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImport} 
                className="hidden" 
                accept=".json"
              />
              <Button variant="outline" className="w-full border-2 border-primary/20 hover:bg-primary/5" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                Select Backup File
              </Button>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-orange-700 dark:text-orange-400">
              Exported files contain plaintext data. We strongly recommend storing backups in an encrypted drive or a secure physical location.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}