import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { KEYS, safeStorage } from '../services/storage'

interface RecentStore {
  ids: string[]
  visit: (productoId: string) => void
  clear: () => void
}

/** Productos vistos en esta sesión, más reciente primero. */
export const useRecentStore = create<RecentStore>()(
  persist(
    (set) => ({
      ids: [],
      visit: (productoId) => set((state) => ({
        ids: [productoId, ...state.ids.filter((id) => id !== productoId)].slice(0, 12),
      })),
      clear: () => set({ ids: [] }),
    }),
    {
      name: KEYS.recent,
      storage: createJSONStorage(() => safeStorage),
      version: 1,
      partialize: (state) => ({ ids: state.ids }) as RecentStore,
    },
  ),
)
