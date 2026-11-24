import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react'
import {
  addAddress as addCustomerAddress, associateGuestOrders, authenticateCustomer,
  changePassword as changeCustomerPassword, deleteCustomer, ensureDemoCustomer,
  findByEmail, registerCustomer, removeAddress as removeCustomerAddress,
  setCustomerActive, setDefaultAddress as setCustomerDefaultAddress,
  updateProfile as updateCustomerProfile, type CustomerAuthResult,
  type RegisterCustomerInput,
} from '../../logic/services/customer-auth'
import { getCustomers } from '../../logic/services/customer-auth'
import { logActivity } from '../../logic/services/audit'
import { useCustomerStore } from '../../logic/store/customer'
import { useOrdersStore } from '../../logic/store/orders'
import type { Address, CustomerAccount } from '../../logic/types'

type ProfilePatch = Partial<Pick<CustomerAccount,
  'nombre' | 'apellido' | 'email' | 'telefono' | 'documento' | 'aceptaOfertas'>>

interface CustomerContextValue {
  account: CustomerAccount | null
  isAuthenticated: boolean
  ready: boolean
  signIn: (identifier: string, password: string, remember?: boolean) => Promise<CustomerAuthResult>
  signUp: (input: RegisterCustomerInput) => Promise<{ ok: boolean; error?: string }>
  signOut: () => void
  refresh: () => void
  update: (patch: ProfilePatch) => void
  changePassword: (current: string, next: string) => Promise<void>
  addAddress: (address: Omit<Address, 'id'>) => void
  removeAddress: (addressId: string) => void
  setDefaultAddress: (addressId: string) => void
  deleteAccount: () => void
  setActive: (id: string, activo: boolean) => void
  emailExists: (email: string) => boolean
  list: () => CustomerAccount[]
}

const CustomerContext = createContext<CustomerContextValue | null>(null)

export const useCustomer = (): CustomerContextValue => {
  const context = useContext(CustomerContext)
  if (!context) throw new Error('useCustomer debe usarse dentro de CustomerProvider')
  return context
}

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const accountId = useCustomerStore((state) => state.accountId)
  const setSession = useCustomerStore((state) => state.setSession)
  const clearSession = useCustomerStore((state) => state.clear)
  const [account, setAccount] = useState<CustomerAccount | null>(null)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(() => {
    const id = useCustomerStore.getState().accountId
    setAccount(id ? getCustomers().find((item) => item.id === id) ?? null : null)
  }, [])

  useEffect(() => {
    let mounted = true
    const boot = async () => {
      await ensureDemoCustomer()
      if (!mounted) return
      refresh()
      setReady(true)
    }
    void boot()
    return () => { mounted = false }
  }, [refresh])

  useEffect(() => {
    if (!accountId) { setAccount(null); return }
    const found = getCustomers().find((item) => item.id === accountId && item.activo)
    if (!found) { clearSession(); setAccount(null); return }
    setAccount(found)
  }, [accountId, clearSession])

  const signIn = useCallback(async (identifier: string, password: string, remember = true) => {
    const result = await authenticateCustomer(identifier, password)
    if (result.account) {
      setSession(result.account.id, remember)
      setAccount(result.account)
      const orders = useOrdersStore.getState().orders
      const linked = associateGuestOrders(result.account, orders)
      if (linked.some((order, index) => order !== orders[index])) useOrdersStore.getState().replace(linked)
    }
    return result
  }, [setSession])

  const signUp = useCallback(async (input: RegisterCustomerInput) => {
    try {
      const created = await registerCustomer(input)
      setSession(created.id)
      setAccount(created)
      const orders = useOrdersStore.getState().orders
      useOrdersStore.getState().replace(associateGuestOrders(created, orders))
      logActivity('cliente', 'Alta de cliente', 'Nueva cuenta registrada')
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'No se pudo crear la cuenta.' }
    }
  }, [setSession])

  const signOut = useCallback(() => { clearSession(); setAccount(null) }, [clearSession])

  const mutate = useCallback((run: (id: string) => void) => {
    if (!account) return
    run(account.id)
    refresh()
  }, [account, refresh])

  const value = useMemo<CustomerContextValue>(() => ({
    account,
    isAuthenticated: account !== null,
    ready,
    signIn,
    signUp,
    signOut,
    refresh,
    update: (patch) => mutate((id) => { updateCustomerProfile(id, patch) }),
    changePassword: async (current, next) => {
      if (account) await changeCustomerPassword(account.id, current, next)
    },
    addAddress: (address) => mutate((id) => { addCustomerAddress(id, address) }),
    removeAddress: (addressId) => mutate((id) => { removeCustomerAddress(id, addressId) }),
    setDefaultAddress: (addressId) => mutate((id) => { setCustomerDefaultAddress(id, addressId) }),
    deleteAccount: () => {
      if (account) {
        deleteCustomer(account.id)
        logActivity('cliente', 'Baja de cliente', 'Cuenta eliminada')
      }
      signOut()
    },
    setActive: (id, activo) => {
      setCustomerActive(id, activo)
      logActivity('personal', activo ? 'Cliente restablecido' : 'Cliente desactivado', 'Cambio de estado')
      refresh()
    },
    emailExists: (email) => findByEmail(email) !== null,
    list: getCustomers,
  }), [account, ready, signIn, signUp, signOut, refresh, mutate])

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>
}
