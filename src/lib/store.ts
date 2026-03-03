import { create } from 'zustand';
import { VaultItemType } from '@shared/types';
interface VaultStore {
  selectedItemId: string | null;
  searchQuery: string;
  activeFilter: VaultItemType | 'all' | 'favorites' | 'trash' | 'monitor' | string;
  activeTag: string | null;
  isCreateDialogOpen: boolean;
  isImportExportOpen: boolean;
  editingItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveFilter: (filter: VaultItemType | 'all' | 'favorites' | 'trash' | 'monitor' | string) => void;
  setActiveTag: (tag: string | null) => void;
  setCreateDialogOpen: (open: boolean) => void;
  setImportExportOpen: (open: boolean) => void;
  setEditingItemId: (id: string | null) => void;
}
export const useVaultStore = create<VaultStore>((set) => ({
  selectedItemId: null,
  searchQuery: '',
  activeFilter: 'all',
  activeTag: null,
  isCreateDialogOpen: false,
  isImportExportOpen: false,
  editingItemId: null,
  setSelectedItemId: (id) => set({ selectedItemId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveFilter: (filter) => set({
    activeFilter: filter,
    activeTag: null
  }),
  setActiveTag: (tag) => set({
    activeTag: tag,
    activeFilter: 'all'
  }),
  setCreateDialogOpen: (open) => set({ isCreateDialogOpen: open }),
  setImportExportOpen: (open) => set({ isImportExportOpen: open }),
  setEditingItemId: (id) => set({ editingItemId: id }),
}));