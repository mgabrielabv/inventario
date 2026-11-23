import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { emptyDraft, type CheckoutDraft } from '../services/checkout'
import { KEYS, safeStorage } from '../services/storage'

interface CheckoutDraftStore extends CheckoutDraft {
  step: number
  reached: number
  patch: (value: Partial<CheckoutDraft>) => void
  goTo: (step: number) => void
  advance: (step: number) => void
  reset: () => void
}

/** El borrador sobrevive recargas: nadie pierde lo ya escrito al pagar. */
export const useCheckoutDraftStore = create<CheckoutDraftStore>()(
  persist(
    (set) => ({
      ...emptyDraft(),
      step: 0,
      reached: 0,
      patch: (value) => set(value),
      goTo: (step) => set({ step }),
      advance: (step) => set((state) => ({
        step, reached: Math.max(state.reached, step),
      })),
      reset: () => set({ ...emptyDraft(), step: 0, reached: 0 }),
    }),
    {
      name: KEYS.checkoutDraft,
      storage: createJSONStorage(() => safeStorage),
      version: 1,
      partialize: (state) => ({
        ...emptyDraft(),
        nombre: state.nombre, telefono: state.telefono, email: state.email,
        documento: state.documento, entrega: state.entrega, direccion: state.direccion,
        zona: state.zona, referencia: state.referencia, notas: state.notas,
        metodo: state.metodo, pagoReferencia: state.pagoReferencia,
        vuelto: state.vuelto, comprobante: state.comprobante,
        cupon: state.cupon, ventana: state.ventana, acepta: state.acepta,
        step: state.step, reached: state.reached,
      }) as CheckoutDraftStore,
    },
  ),
)
