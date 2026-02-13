import { create } from 'zustand';

interface SearchState {
  isSearchOpen: boolean;
  setSearchOpen: (isOpen: boolean) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  isSearchOpen: false,
  setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
}));
