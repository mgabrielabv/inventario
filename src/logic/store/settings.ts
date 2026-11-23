import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { KEYS, safeStorage } from '../services/storage'
import { DEFAULT_CATEGORIES, DEFAULT_LOCATIONS, UNITS, type Settings } from '../types'

export const DEFAULT_SETTINGS: Settings = {
  tienda: {
    nombre: 'Inventario',
    direccion: 'Av. Principal 12, Caracas',
    horario: 'Lun a Vie · 9:00 a 18:00',
    telefono: '0424-1234567',
    whatsapp: '584241234567',
  },
  entrega: {
    retiro: true,
    delivery: true,
    zonas: [
      { nombre: 'Caracas', tarifa: 5 },
      { nombre: 'Miranda', tarifa: 7 },
      { nombre: 'Otras zonas', tarifa: 12 },
    ],
    envioGratisDesde: 150,
  },
  pagos: {
    efectivo: true,
    transferencia: true,
    datosTransferencia: 'Banco: Demostración\nCuenta: 0000-0000-00-0000000000\nTitular: Inventario',
    tarjetaDemo: true,
  },
  moneda: {
    codigo: 'USD', tasaVES: null, fechaTasa: null, mostrarSecundario: false,
  },
  catalogo: {
    categorias: [...DEFAULT_CATEGORIES], unidades: [...UNITS], ubicaciones: [...DEFAULT_LOCATIONS],
  },
  maxPorPedido: 20,
}

interface SettingsStore {
  settings: Settings
  update: (patch: Partial<Settings>) => void
  replace: (settings: Settings) => void
  reset: () => void
}

const merge = (saved: Partial<Settings> | undefined): Settings => ({
  ...DEFAULT_SETTINGS,
  ...saved,
  tienda: { ...DEFAULT_SETTINGS.tienda, ...saved?.tienda },
  entrega: { ...DEFAULT_SETTINGS.entrega, ...saved?.entrega },
  pagos: { ...DEFAULT_SETTINGS.pagos, ...saved?.pagos },
  moneda: { ...DEFAULT_SETTINGS.moneda, ...saved?.moneda },
  catalogo: { ...DEFAULT_SETTINGS.catalogo, ...saved?.catalogo },
})

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      update: (patch) => set((state) => ({ settings: merge({ ...state.settings, ...patch }) })),
      replace: (settings) => set({ settings: merge(settings) }),
      reset: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: KEYS.settings,
      storage: createJSONStorage(() => safeStorage),
      version: 2,
      migrate: (persisted) => ({ settings: merge(persisted as Partial<Settings>) } as SettingsStore),
      partialize: (state) => ({ settings: state.settings }) as SettingsStore,
    },
  ),
)
