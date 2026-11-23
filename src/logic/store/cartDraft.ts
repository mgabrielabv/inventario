import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { KEYS, safeStorage } from '../services/storage'

export interface CartDraft {
  cupon: string
  nota: string
  entrega: 'retiro' | 'delivery'
  zona: string
  direccion: string
}

interface CartDraftStore extends CartDraft {
  patch: (value: Partial<CartDraft>) => void
  reset: () => void
}

const initial: CartDraft = {
  cupon: '', nota: '', entrega: 'retiro', zona: '', direccion: '',
}

/** Preferencias del carrito que sobreviven a recargas y alimentan el checkout. */
export const useCartDraftStore = create<CartDraftStore>()(
  persist(
    (set) => ({
      ...initial,
      patch: (value) => set(value),
      reset: () => set(initial),
    }),
    {
      name: KEYS.cartDraft,
      storage: createJSONStorage(() => safeStorage),
      version: 1,
      partialize: (state) => ({
        cupon: state.cupon, nota: state.nota, entrega: state.entrega,
        zona: state.zona, direccion: state.direccion,
      }) as CartDraftStore,
    },
  ),
)
