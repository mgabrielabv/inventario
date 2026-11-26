import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { KEYS, safeStorage } from '../services/storage'

interface CustomerSessionStore {
  accountId: string | null
  remember: boolean
  setSession: (accountId: string, remember?: boolean) => void
  clear: () => void
}

/** Sesión de cliente: nunca comparte clave con la sesión del personal. */
export const useCustomerStore = create<CustomerSessionStore>()(
  persist(
    (set) => ({
      accountId: null,
      remember: true,
      setSession: (accountId, remember = true) => set({ accountId, remember }),
      clear: () => set({ accountId: null, remember: false }),
    }),
    {
      name: KEYS.customerSession,
      storage: createJSONStorage(() => safeStorage),
      version: 1,
      partialize: (state) => ({
        accountId: state.remember ? state.accountId : null,
        remember: state.remember,
      }),
    },
  ),
)
