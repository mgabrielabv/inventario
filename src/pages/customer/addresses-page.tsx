import { MapPin, Plus, Trash2 } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useCustomer } from '../../app/providers/customer-provider'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field, Input } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import type { Address } from '../../logic/types'
import { AccountDemoNote, AccountLoading, AccountSignInPrompt } from './account-page'

type Form = { alias: string; direccion: string; zona: string; referencia: string; principal: boolean }
type Errors = Partial<Record<keyof Form, string>>

const empty: Form = { alias: '', direccion: '', zona: '', referencia: '', principal: false }

export const AddressesPage = () => {
  const { account, isAuthenticated, ready, addAddress, setDefaultAddress, removeAddress } = useCustomer()
  const { toast } = useToast()
  const [form, setForm] = useState<Form>(empty)
  const [errors, setErrors] = useState<Errors>({})
  const [toDelete, setToDelete] = useState<Address | null>(null)
  const formRef = useRef<HTMLFormElement | null>(null)

  if (!ready) return <AccountLoading />
  if (!isAuthenticated || !account) return <AccountSignInPrompt />

  const addresses = account.direcciones

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const found: Errors = {}
    if (!form.alias.trim()) found.alias = 'Ponle un nombre a esta dirección.'
    if (form.direccion.trim().length < 5) found.direccion = 'Escribe la dirección.'
    if (!form.zona.trim()) found.zona = 'Escribe la zona o ciudad.'
    setErrors(found)
    if (Object.keys(found).length > 0) {
      window.setTimeout(() => {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      }, 0)
      return
    }
    addAddress({
      alias: form.alias.trim(),
      direccion: form.direccion.trim(),
      zona: form.zona.trim(),
      referencia: form.referencia.trim(),
      esPrincipal: form.principal || addresses.length === 0,
    })
    setForm(empty)
    toast('Dirección agregada.')
  }

  return (
    <div className="eshop-account-page container-store">
      <header className="eshop-account-head">
        <div>
          <p className="eshop-account-eyebrow t-min t-clay">Mi cuenta</p>
          <h1 className="t-section">Mis direcciones</h1>
          <p className="t-subtitle">Elige dónde quieres recibir tus pedidos.</p>
        </div>
        <Link className="btn btn--secondary" to="/cuenta">Volver a mi cuenta</Link>
      </header>

      <div className="eshop-account-address-layout">
        <section aria-labelledby="address-list-title">
          <h2 id="address-list-title" className="eshop-account-section__title t-ui t-strong">
            Guardadas ({addresses.length})
          </h2>
          {addresses.length === 0 ? (
            <div className="card">
              <EmptyState
                compact
                title="Aún no tienes direcciones"
                description="Agrega una para tenerla lista en tu próximo pedido."
              />
            </div>
          ) : (
            <div className="eshop-account-addresses">
              {addresses.map((address) => (
                <article key={address.id} className="eshop-account-address card">
                  <div className="eshop-account-address__head">
                    <span className="eshop-account-address__icon" aria-hidden="true"><MapPin size={19} strokeWidth={1.7} /></span>
                    <strong className="t-mid">{address.alias}</strong>
                    {address.esPrincipal && <Chip active>Principal</Chip>}
                  </div>
                  <div className="eshop-account-address__body">
                    <p>{address.direccion}</p>
                    <p className="t-caption">{address.zona}</p>
                    {address.referencia && <p className="t-min t-muted">Referencia: {address.referencia}</p>}
                  </div>
                  <div className="eshop-account-address__actions">
                    {!address.esPrincipal && (
                      <Button size="sm" variant="secondary"
                        onClick={() => { setDefaultAddress(address.id); toast('Dirección principal actualizada.') }}>
                        Hacer principal
                      </Button>
                    )}
                    <Button size="sm" variant="danger" onClick={() => setToDelete(address)}>
                      <Trash2 size={15} strokeWidth={1.7} aria-hidden="true" />
                      Eliminar
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="eshop-account-panel card" aria-labelledby="address-form-title">
          <h2 id="address-form-title" className="t-ui t-strong">
            <Plus size={17} strokeWidth={1.8} aria-hidden="true" /> Agregar dirección
          </h2>
          <form ref={formRef} className="eshop-account-form" onSubmit={onSubmit} noValidate>
            <Field label="Alias" required error={errors.alias} hint="Por ejemplo: Casa o Trabajo">
              {(id, describedBy) => (
                <Input id={id} value={form.alias} placeholder="Casa" maxLength={40}
                  aria-invalid={Boolean(errors.alias)} aria-describedby={describedBy || undefined}
                  onChange={(event) => set('alias', event.target.value)} />
              )}
            </Field>
            <Field label="Dirección" required error={errors.direccion}>
              {(id, describedBy) => (
                <Input id={id} value={form.direccion} autoComplete="street-address"
                  aria-invalid={Boolean(errors.direccion)} aria-describedby={describedBy || undefined}
                  onChange={(event) => set('direccion', event.target.value)} />
              )}
            </Field>
            <Field label="Zona o ciudad" required error={errors.zona}>
              {(id, describedBy) => (
                <Input id={id} value={form.zona}
                  aria-invalid={Boolean(errors.zona)} aria-describedby={describedBy || undefined}
                  onChange={(event) => set('zona', event.target.value)} />
              )}
            </Field>
            <Field label="Referencia" hint="Opcional: entre calles, color de la casa…">
              {(id, describedBy) => (
                <Input id={id} value={form.referencia} aria-describedby={describedBy || undefined}
                  onChange={(event) => set('referencia', event.target.value)} />
              )}
            </Field>
            <label className="eshop-account-check">
              <input type="checkbox" checked={form.principal}
                onChange={(event) => set('principal', event.target.checked)} />
              <span>Hacerla mi dirección principal</span>
            </label>
            <Button type="submit" full>Guardar dirección</Button>
          </form>
        </section>
      </div>

      <Modal open={toDelete !== null} onClose={() => setToDelete(null)} title="Eliminar dirección">
        <p className="t-mid">¿Quieres eliminar «{toDelete?.alias}»?</p>
        <p className="t-caption">No podrás deshacer esta acción.</p>
        <div className="eshop-account-modal-actions">
          <Button variant="secondary" onClick={() => setToDelete(null)}>Cancelar</Button>
          <Button variant="danger" onClick={() => {
            if (!toDelete) return
            removeAddress(toDelete.id)
            setToDelete(null)
            toast('Dirección eliminada.')
          }}>
            Eliminar
          </Button>
        </div>
      </Modal>

      <AccountDemoNote />
    </div>
  )
}
