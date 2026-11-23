import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { KEYS, safeStorage } from '../services/storage'

interface FavoritesStore {
  ids: string[]
  toggle: (id: string) => void
  remove: (id: string) => void
  clear: () => void
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) => set((state) => ({
        ids: state.ids.includes(id) ? state.ids.filter((item) => item !== id) : [...state.ids, id],
      })),
      remove: (id) => set((state) => ({ ids: state.ids.filter((item) => item !== id) })),
      clear: () => set({ ids: [] }),
    }),
    {
      name: KEYS.favorites,
      storage: createJSONStorage(() => safeStorage),
      version: 1,
      partialize: (state) => ({ ids: state.ids }) as FavoritesStore,
    },
  ),
)
