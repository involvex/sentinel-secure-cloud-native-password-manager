import { create } from 'zustand';
import { VaultItemType } from '@shared/types';
interface VaultStore {
  selectedItemId: string | null;
  searchQuery: string;
  activeFilter: VaultItemType | 'all' | 'favorites' | 'trash';
  isCreateDialogOpen: boolean;
  editingItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveFilter: (filter: VaultItemType | 'all' | 'favorites' | 'trash') => void;
  setCreateDialogOpen: (open: boolean) => void;
  setEditingItemId: (id: string | null) => void;
}
export const useVaultStore = create<VaultStore>((set) => ({
  selectedItemId: null,
  searchQuery: '',
  activeFilter: 'all',
  isCreateDialogOpen: false,
  editingItemId: null,
  setSelectedItemId: (id) => set({ selectedItemId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setCreateDialogOpen: (open) => set({ isCreateDialogOpen: open }),
  setEditingItemId: (id) => set({ editingItemId: id }),
}));