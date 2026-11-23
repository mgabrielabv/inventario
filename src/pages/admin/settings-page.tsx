import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../components/ui/Field'
import { Sheet } from '../../components/ui/Sheet'
import { Switch } from '../../components/ui/Switch'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../app/providers/auth-provider'
import { backupSummary, buildBackup, validateBackup } from '../../logic/services/backup'
import { getActivity, logActivity } from '../../logic/services/audit'
import { createUser, getUsers, resetPassword, saveUsers } from '../../logic/services/auth'
import { errorMessage } from '../../logic/errors'
import { downloadFile } from '../../logic/services/exportCsv'
import { formatShortDate } from '../../logic/services/formatters'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import { DEFAULT_SETTINGS, useSettingsStore } from '../../logic/store/settings'
import {
  type Coupon, type DeliveryZone, type Settings, type StoredUser, type UserRole,
} from '../../logic/types'

const Seccion = ({ title, description, children }: {
  title: string; description?: string; children: ReactNode
}) => (
  <section className="admin-panel admin-settings-section">
    <div className="admin-panel__head">
      <div>
        <h2 className="t-ui t-strong">{title}</h2>
        {description && <p className="t-min t-muted">{description}</p>}
      </div>
    </div>
    {children}
  </section>
)

const splitList = (value: string): string[] =>
  value.split(',').map((item) => item.trim()).filter(Boolean)

const dinero = (value: string): number | null => {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

export const AdminSettingsPage = () => {
  const { can, user } = useAuth()
  const { toast } = useToast()
  const settings = useSettingsStore((state) => state.settings)
  const update = useSettingsStore((state) => state.update)
  const reset = useSettingsStore((state) => state.reset)
  const [draft, setDraft] = useState<Settings>(settings)
  const [users, setUsers] = useState<StoredUser[]>(() => can('gestionar:usuarios') ? getUsers() : [])
  const [nuevo, setNuevo] = useState({ username: '', name: '', role: 'Operador' as UserRole, password: '' })
  const [resetFor, setResetFor] = useState<string | null>(null)
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [importError, setImportError] = useState('')

  const gestionaUsuarios = can('gestionar:usuarios')

  const patchTienda = (patch: Partial<Settings['tienda']>) =>
    setDraft((prev) => ({ ...prev, tienda: { ...prev.tienda, ...patch } }))
  const patchEntrega = (patch: Partial<Settings['entrega']>) =>
    setDraft((prev) => ({ ...prev, entrega: { ...prev.entrega, ...patch } }))
  const patchPagos = (patch: Partial<Settings['pagos']>) =>
    setDraft((prev) => ({ ...prev, pagos: { ...prev.pagos, ...patch } }))
  const patchPromociones = (patch: Partial<Settings['promociones']>) =>
    setDraft((prev) => ({ ...prev, promociones: { ...prev.promociones, ...patch } }))
  const patchMoneda = (patch: Partial<Settings['moneda']>) =>
    setDraft((prev) => ({ ...prev, moneda: { ...prev.moneda, ...patch } }))
  const patchCatalogo = (patch: Partial<Settings['catalogo']>) =>
    setDraft((prev) => ({ ...prev, catalogo: { ...prev.catalogo, ...patch } }))

  const guardar = (patch: Partial<Settings>, seccion: string) => {
    update(patch)
    logActivity(user?.name ?? 'sistema', 'Configuración actualizada', seccion)
    toast(`${seccion} guardada`)
  }

  const actualizarZona = (index: number, patch: Partial<DeliveryZone>) =>
    patchEntrega({ zonas: draft.entrega.zonas.map((zona, i) => (i === index ? { ...zona, ...patch } : zona)) })

  const actualizarCupon = (index: number, patch: Partial<Coupon>) =>
    patchPromociones({
      cupones: draft.promociones.cupones.map((cupon, i) => (i === index ? { ...cupon, ...patch } : cupon)),
    })

  const exportarRespaldo = () => {
    const state = useInventoryStore.getState()
    const respaldo = buildBackup({
      products: state.products,
      movements: state.movements,
      orders: useOrdersStore.getState().orders,
      settings: useSettingsStore.getState().settings,
      users: getUsers(),
      activity: getActivity(),
    })
    downloadFile(`respaldo-${respaldo.exportedAt.slice(0, 10)}.json`,
      JSON.stringify(respaldo, null, 2), 'application/json')
    logActivity(user?.name ?? 'sistema', 'Respaldo exportado', backupSummary(respaldo))
    toast('Respaldo descargado')
  }

  const importarRespaldo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setImportError('')
    try {
      const contenido: unknown = JSON.parse(await file.text())
      const resultado = validateBackup(contenido)
      if (!resultado.ok) {
        setImportError(resultado.error)
        toast(resultado.error, { tone: 'critical' })
        return
      }
      const data = resultado.data
      useInventoryStore.getState().replaceAll(data.products, data.movements)
      useOrdersStore.getState().replace(data.orders)
      useSettingsStore.getState().replace(data.settings)
      setDraft(data.settings)
      saveUsers(data.users)
      setUsers(getUsers())
      logActivity(user?.name ?? 'sistema', 'Respaldo restaurado', backupSummary(data))
      toast(`Respaldo restaurado: ${backupSummary(data)}`)
    } catch (cause) {
      setImportError(errorMessage(cause))
      toast(errorMessage(cause), { tone: 'critical' })
    }
  }

  const restaurarAjustes = () => {
    reset()
    setDraft(DEFAULT_SETTINGS)
    logActivity(user?.name ?? 'sistema', 'Configuración restablecida', 'Valores predeterminados')
    toast('Configuración restablecida')
  }

  const crearCuenta = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!gestionaUsuarios) return
    if (!nuevo.username.trim() || !nuevo.name.trim()) { setError('Completa usuario y nombre'); return }
    if (nuevo.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    try {
      const creado = await createUser(nuevo.username, nuevo.name, nuevo.role, nuevo.password)
      saveUsers([...getUsers(), creado])
      setUsers(getUsers())
      setNuevo({ username: '', name: '', role: 'Operador', password: '' })
      setError('')
      logActivity(user?.name ?? 'sistema', 'Usuario creado', creado.username)
      toast('Usuario creado')
    } catch (cause) {
      setError(errorMessage(cause))
      toast(errorMessage(cause), { tone: 'critical' })
    }
  }

  const alternarUsuario = (cuenta: StoredUser) => {
    saveUsers(getUsers().map((item) => item.id === cuenta.id ? { ...item, active: !item.active } : item))
    setUsers(getUsers())
    logActivity(user?.name ?? 'sistema', cuenta.active ? 'Usuario desactivado' : 'Usuario activado', cuenta.username)
    toast(cuenta.active ? 'Usuario desactivado' : 'Usuario activado')
  }

  const cambiarClave = async () => {
    if (!resetFor) return
    if (clave.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    try {
      await resetPassword(resetFor, clave)
      setError('')
      setResetFor(null)
      setClave('')
      logActivity(user?.name ?? 'sistema', 'Contraseña restablecida',
        users.find((item) => item.id === resetFor)?.username ?? '')
      toast('Contraseña actualizada')
    } catch (cause) {
      setError(errorMessage(cause))
      toast(errorMessage(cause), { tone: 'critical' })
    }
  }

  const cuentaReset = users.find((item) => item.id === resetFor)

  return (
    <div className="admin-page container-admin">
      <header className="admin-page-head">
        <div className="col">
          <p className="t-min t-muted">Solo administradores</p>
          <h1 className="t-ui t-strong">Configuración</h1>
          <p className="t-caption">Datos de la tienda, entrega, pagos, catálogo y copias de seguridad.</p>
        </div>
        <div className="admin-actions">
          <Button size="sm" variant="secondary" onClick={restaurarAjustes}>Restablecer ajustes</Button>
        </div>
      </header>

      <div className="admin-settings-grid">
        <Seccion title="Datos de la tienda" description="Aparecen en el encabezado y en los comprobantes.">
          <div className="admin-form-grid">
            <Field label="Nombre">
              {(id) => <Input id={id} value={draft.tienda.nombre}
                onChange={(event) => patchTienda({ nombre: event.target.value })} />}
            </Field>
            <Field label="Teléfono">
              {(id) => <Input id={id} value={draft.tienda.telefono}
                onChange={(event) => patchTienda({ telefono: event.target.value })} />}
            </Field>
            <Field label="Dirección" className="admin-form-grid__full">
              {(id) => <Input id={id} value={draft.tienda.direccion}
                onChange={(event) => patchTienda({ direccion: event.target.value })} />}
            </Field>
            <Field label="Horario">
              {(id) => <Input id={id} value={draft.tienda.horario}
                onChange={(event) => patchTienda({ horario: event.target.value })} />}
            </Field>
            <Field label="WhatsApp (número)">
              {(id) => <Input id={id} value={draft.tienda.whatsapp}
                onChange={(event) => patchTienda({ whatsapp: event.target.value })} />}
            </Field>
          </div>
          <div className="admin-sheet-actions">
            <Button size="sm" onClick={() => guardar({ tienda: draft.tienda }, 'Tienda')}>Guardar tienda</Button>
          </div>
        </Seccion>

        <Seccion title="Entrega" description="Zonas con tarifa y monto desde el cual el envío es gratis.">
          <div className="admin-switch-row">
            <div className="col"><span className="t-mid">Retiro en tienda</span><span className="t-min t-muted">Disponible como opción</span></div>
            <Switch checked={draft.entrega.retiro} label="Retiro en tienda"
              onChange={(value) => patchEntrega({ retiro: value })} />
          </div>
          <div className="admin-switch-row">
            <div className="col"><span className="t-mid">Delivery</span><span className="t-min t-muted">Calcula la tarifa por zona</span></div>
            <Switch checked={draft.entrega.delivery} label="Delivery"
              onChange={(value) => patchEntrega({ delivery: value })} />
          </div>
          <Field label="Envío gratis desde" hint="Deja vacío para no aplicar este beneficio.">
            {(id, describedBy) => (
              <Input id={id} type="number" min={0} step="0.01" aria-describedby={describedBy || undefined}
                value={draft.entrega.envioGratisDesde ?? ''}
                onChange={(event) => patchEntrega({ envioGratisDesde: dinero(event.target.value) })} />
            )}
          </Field>
          <Field label="Ventanas horarias" hint="Separadas por coma. Aparecen al elegir delivery.">
            {(id, describedBy) => (
              <Input id={id} aria-describedby={describedBy || undefined}
                value={draft.entrega.ventanas.join(', ')}
                onChange={(event) => patchEntrega({ ventanas: splitList(event.target.value) })} />
            )}
          </Field>
          <div className="admin-zones">
            {draft.entrega.zonas.map((zona, index) => (
              <div className="admin-zone-row" key={`${index}-${zona.nombre}`}>
                <Input aria-label={`Nombre de la zona ${index + 1}`} value={zona.nombre}
                  onChange={(event) => actualizarZona(index, { nombre: event.target.value })} />
                <Input aria-label={`Tarifa de ${zona.nombre}`} type="number" min={0} step="0.01"
                  value={zona.tarifa}
                  onChange={(event) => actualizarZona(index, { tarifa: dinero(event.target.value) ?? 0 })} />
                <Button size="sm" variant="tertiary"
                  onClick={() => patchEntrega({ zonas: draft.entrega.zonas.filter((_, i) => i !== index) })}>
                  Quitar
                </Button>
              </div>
            ))}
            <Button size="sm" variant="secondary"
              onClick={() => patchEntrega({ zonas: [...draft.entrega.zonas, { nombre: '', tarifa: 0 }] })}>
              Agregar zona
            </Button>
          </div>
          <div className="admin-sheet-actions">
            <Button size="sm" onClick={() => guardar({ entrega: draft.entrega }, 'Entrega')}>Guardar entrega</Button>
          </div>
        </Seccion>

        <Seccion title="Métodos de pago" description="Activa los medios que acepta la tienda.">
          <div className="admin-switch-row">
            <div className="col"><span className="t-mid">Efectivo</span></div>
            <Switch checked={draft.pagos.efectivo} label="Efectivo"
              onChange={(value) => patchPagos({ efectivo: value })} />
          </div>
          <div className="admin-switch-row">
            <div className="col"><span className="t-mid">Transferencia</span></div>
            <Switch checked={draft.pagos.transferencia} label="Transferencia"
              onChange={(value) => patchPagos({ transferencia: value })} />
          </div>
          <div className="admin-switch-row">
            <div className="col"><span className="t-mid">Pago móvil</span><span className="t-min t-muted">Datos copiables en el checkout</span></div>
            <Switch checked={draft.pagos.movil} label="Pago móvil"
              onChange={(value) => patchPagos({ movil: value })} />
          </div>
          <div className="admin-switch-row">
            <div className="col"><span className="t-mid">Tarjeta de demostración</span><span className="t-min t-muted">Sin procesador real</span></div>
            <Switch checked={draft.pagos.tarjetaDemo} label="Tarjeta de demostración"
              onChange={(value) => patchPagos({ tarjetaDemo: value })} />
          </div>
          <Field label="Datos para transferencia">
            {(id) => <Textarea id={id} rows={4} value={draft.pagos.datosTransferencia}
              onChange={(event) => patchPagos({ datosTransferencia: event.target.value })} />}
          </Field>
          <Field label="Datos para pago móvil">
            {(id) => <Textarea id={id} rows={4} value={draft.pagos.datosMovil}
              onChange={(event) => patchPagos({ datosMovil: event.target.value })} />}
          </Field>
          <div className="admin-sheet-actions">
            <Button size="sm" onClick={() => guardar({ pagos: draft.pagos }, 'Pagos')}>Guardar pagos</Button>
          </div>
        </Seccion>

        <Seccion title="Promociones" description="Cupones de demostración: BIENVENIDO10 y ENVIOGRATIS vienen activos.">
          <div className="admin-zones">
            {draft.promociones.cupones.map((cupon, index) => (
              <div className="admin-coupon-row" key={`${index}-${cupon.codigo}`}>
                <Input aria-label={`Código del cupón ${index + 1}`} value={cupon.codigo}
                  placeholder="CÓDIGO" onChange={(event) => actualizarCupon(index, { codigo: event.target.value.toUpperCase() })} />
                <Select aria-label={`Tipo del cupón ${index + 1}`} value={cupon.tipo}
                  onChange={(event) => actualizarCupon(index, { tipo: event.target.value as Coupon['tipo'] })}>
                  <option value="porcentaje">Porcentaje</option>
                  <option value="monto">Monto</option>
                  <option value="envio">Envío</option>
                </Select>
                <Input aria-label={`Valor del cupón ${index + 1}`} type="number" min={0} step="0.01"
                  value={cupon.valor}
                  onChange={(event) => actualizarCupon(index, { valor: dinero(event.target.value) ?? 0 })} />
                <Switch checked={cupon.activo} label={`Cupón ${cupon.codigo || index + 1} activo`}
                  onChange={(activo) => actualizarCupon(index, { activo })} />
                <Button size="sm" variant="tertiary"
                  onClick={() => patchPromociones({
                    cupones: draft.promociones.cupones.filter((_, i) => i !== index),
                  })}>
                  Quitar
                </Button>
              </div>
            ))}
            <Button size="sm" variant="secondary"
              onClick={() => patchPromociones({
                cupones: [...draft.promociones.cupones, { codigo: '', tipo: 'porcentaje', valor: 0, activo: true }],
              })}>
              Agregar cupón
            </Button>
          </div>
          <div className="admin-sheet-actions">
            <Button size="sm" onClick={() => guardar({ promociones: draft.promociones }, 'Promociones')}>
              Guardar promociones
            </Button>
          </div>
        </Seccion>

        <Seccion title="Moneda" description="Tasa manual de referencia; no se consulta ningún servicio externo.">
          <div className="admin-form-grid">
            <Field label="Código">
              {(id) => <Input id={id} value={draft.moneda.codigo}
                onChange={(event) => patchMoneda({ codigo: event.target.value.toUpperCase() })} />}
            </Field>
            <Field label="Tasa manual (Bs. por USD)" hint="Vacío para desactivar la referencia.">
              {(id, describedBy) => (
                <Input id={id} type="number" min={0} step="0.01" aria-describedby={describedBy || undefined}
                  value={draft.moneda.tasaVES ?? ''}
                  onChange={(event) => patchMoneda({ tasaVES: dinero(event.target.value) })} />
              )}
            </Field>
          </div>
          <div className="admin-switch-row">
            <div className="col"><span className="t-mid">Mostrar referencia en bolívares</span></div>
            <Switch checked={draft.moneda.mostrarSecundario} label="Mostrar referencia en bolívares"
              onChange={(value) => patchMoneda({ mostrarSecundario: value })} />
          </div>
          {draft.moneda.fechaTasa && (
            <p className="t-min t-muted">Tasa registrada el {formatShortDate(draft.moneda.fechaTasa)}.</p>
          )}
          <div className="admin-sheet-actions">
            <Button size="sm" onClick={() => guardar({
              moneda: {
                ...draft.moneda,
                fechaTasa: draft.moneda.tasaVES !== settings.moneda.tasaVES
                  ? new Date().toISOString() : draft.moneda.fechaTasa,
              },
            }, 'Moneda')}>Guardar moneda</Button>
          </div>
        </Seccion>

        <Seccion title="Catálogo" description="Categorías, ubicaciones y límite de unidades por pedido.">
          <div className="admin-form-grid">
            <Field label="Categorías" hint="Separadas por coma.">
              {(id, describedBy) => (
                <Input id={id} aria-describedby={describedBy || undefined}
                  value={draft.catalogo.categorias.join(', ')}
                  onChange={(event) => patchCatalogo({ categorias: splitList(event.target.value) })} />
              )}
            </Field>
            <Field label="Ubicaciones" hint="Separadas por coma.">
              {(id, describedBy) => (
                <Input id={id} aria-describedby={describedBy || undefined}
                  value={draft.catalogo.ubicaciones.join(', ')}
                  onChange={(event) => patchCatalogo({ ubicaciones: splitList(event.target.value) })} />
              )}
            </Field>
            <Field label="Máximo por pedido" hint="Cero para no limitar.">
              {(id, describedBy) => (
                <Input id={id} type="number" min={0} aria-describedby={describedBy || undefined}
                  value={draft.maxPorPedido}
                  onChange={(event) => setDraft((prev) => ({
                    ...prev, maxPorPedido: dinero(event.target.value) ?? 0,
                  }))} />
              )}
            </Field>
          </div>
          <div className="admin-sheet-actions">
            <Button size="sm" onClick={() => guardar({
              catalogo: draft.catalogo, maxPorPedido: draft.maxPorPedido,
            }, 'Catálogo')}>Guardar catálogo</Button>
          </div>
        </Seccion>

        <Seccion title="Respaldo de datos" description="Todo se guarda en este navegador; conserva una copia fuera de él.">
          <div className="admin-backup-actions">
            <Button size="sm" onClick={exportarRespaldo}>Exportar respaldo</Button>
            <label htmlFor="admin-importar-respaldo" className="btn btn--secondary btn--sm">Importar respaldo</label>
            <input id="admin-importar-respaldo" className="sr-only" type="file" accept="application/json,.json"
              onChange={importarRespaldo} />
          </div>
          {importError && <p className="inline-alert" role="alert">{importError}</p>}
          <p className="t-min t-muted">Al importar se reemplazan productos, movimientos, pedidos, ajustes y usuarios.</p>
        </Seccion>

        {gestionaUsuarios && (
          <Seccion title="Usuarios" description="Crea accesos, restablece claves y desactiva cuentas.">
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Usuario</th><th>Nombre</th><th>Perfil</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {users.map((cuenta) => (
                    <tr key={cuenta.id}>
                      <td className="code">{cuenta.username}</td>
                      <td>{cuenta.name}</td>
                      <td>{cuenta.role}</td>
                      <td>
                        <span className={cuenta.active ? 't-primary t-min' : 't-muted t-min'}>
                          {cuenta.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <Button size="sm" variant="secondary"
                            onClick={() => { setResetFor(cuenta.id); setClave(''); setError('') }}>
                            Restablecer clave
                          </Button>
                          <Switch checked={cuenta.active} label={`Activar o desactivar ${cuenta.username}`}
                            disabled={cuenta.id === user?.id} onChange={() => alternarUsuario(cuenta)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <form className="admin-form-grid admin-user-form" onSubmit={crearCuenta} noValidate>
              <Field label="Usuario" required>
                {(id) => <Input id={id} value={nuevo.username} autoComplete="off"
                  onChange={(event) => setNuevo({ ...nuevo, username: event.target.value })} />}
              </Field>
              <Field label="Nombre" required>
                {(id) => <Input id={id} value={nuevo.name}
                  onChange={(event) => setNuevo({ ...nuevo, name: event.target.value })} />}
              </Field>
              <Field label="Perfil">
                {(id) => (
                  <Select id={id} value={nuevo.role}
                    onChange={(event) => setNuevo({ ...nuevo, role: event.target.value as UserRole })}>
                    <option value="Operador">Operador</option>
                    <option value="Administrador">Administrador</option>
                  </Select>
                )}
              </Field>
              <Field label="Contraseña" required hint="Mínimo 6 caracteres.">
                {(id, describedBy) => (
                  <Input id={id} type="password" autoComplete="new-password"
                    aria-describedby={describedBy || undefined} value={nuevo.password}
                    onChange={(event) => setNuevo({ ...nuevo, password: event.target.value })} />
                )}
              </Field>
              {error && <p className="inline-alert admin-form-grid__full" role="alert">{error}</p>}
              <div className="admin-sheet-actions admin-form-grid__full">
                <Button type="submit" size="sm">Crear usuario</Button>
              </div>
            </form>
          </Seccion>
        )}
      </div>

      <Sheet open={Boolean(resetFor)} onClose={() => setResetFor(null)}
        title={`Restablecer clave · ${cuentaReset?.username ?? ''}`}>
        <form className="admin-sheet-form" onSubmit={(event) => { event.preventDefault(); void cambiarClave() }} noValidate>
          <p className="t-caption">La contraseña se guarda con sal y SHA-256 en este navegador.</p>
          <Field label="Nueva contraseña" required hint="Mínimo 6 caracteres.">
            {(id, describedBy) => (
              <Input id={id} type="password" autoComplete="new-password"
                aria-describedby={describedBy || undefined} value={clave}
                onChange={(event) => { setClave(event.target.value); setError('') }} />
            )}
          </Field>
          {error && <p className="inline-alert" role="alert">{error}</p>}
          <div className="admin-sheet-actions">
            <Button type="submit" size="sm">Actualizar contraseña</Button>
            <Button size="sm" variant="secondary" onClick={() => setResetFor(null)}>Cancelar</Button>
          </div>
        </form>
      </Sheet>
    </div>
  )
}
