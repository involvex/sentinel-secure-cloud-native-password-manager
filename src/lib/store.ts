import { create } from 'zustand';
import { VaultItemType } from '@shared/types';
interface VaultStore {
  selectedItemId: string | null;
  searchQuery: string;
  activeFilter: VaultItemType | 'all' | 'favorites' | 'trash' | string; // string allows folder/tag names
  activeTag: string | null;
  isCreateDialogOpen: boolean;
  editingItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveFilter: (filter: VaultItemType | 'all' | 'favorites' | 'trash' | string) => void;
  setActiveTag: (tag: string | null) => void;
  setCreateDialogOpen: (open: boolean) => void;
  setEditingItemId: (id: string | null) => void;
}
export const useVaultStore = create<VaultStore>((set) => ({
  selectedItemId: null,
  searchQuery: '',
  activeFilter: 'all',
  activeTag: null,
  isCreateDialogOpen: false,
  editingItemId: null,
  setSelectedItemId: (id) => set({ selectedItemId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveFilter: (filter) => set({ 
    activeFilter: filter,
    activeTag: null // Clear specific tag filter when switching categories/folders
  }),
  setActiveTag: (tag) => set({ 
    activeTag: tag,
    activeFilter: 'all' // Reset to 'all' to ensure the tag filter is dominant
  }),
  setCreateDialogOpen: (open) => set({ isCreateDialogOpen: open }),
  setEditingItemId: (id) => set({ editingItemId: id }),
}));