import { create } from 'zustand';
import { VaultItemType } from '@shared/types';
interface VaultStore {
  selectedItemId: string | null;
  searchQuery: string;
  activeFilter: VaultItemType | 'all' | 'favorites' | 'trash';
  setSelectedItemId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveFilter: (filter: VaultItemType | 'all' | 'favorites' | 'trash') => void;
}
export const useVaultStore = create<VaultStore>((set) => ({
  selectedItemId: null,
  searchQuery: '',
  activeFilter: 'all',
  setSelectedItemId: (id) => set({ selectedItemId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
}));