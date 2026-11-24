import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field, Input } from '../../components/ui/Field'
import { ResponsiveTable } from '../../components/ui/ResponsiveTable'
import { Switch } from '../../components/ui/Switch'
import { useAuth } from '../../app/providers/auth-provider'
import { useCustomer } from '../../app/providers/customer-provider'
import { formatPhoneDisplay, formatShortDate, normalizeText } from '../../logic/services/formatters'
import { useOrdersStore } from '../../logic/store/orders'
import type { CustomerAccount } from '../../logic/types'

export const AdminCustomersPage = () => {
  const { can } = useAuth()
  // setActive ya registra la acción en auditoría desde el proveedor de clientes.
  const { account, list, ready, setActive } = useCustomer()
  const orders = useOrdersStore((state) => state.orders)
  const [search, setSearch] = useState('')
  const [customers, setCustomers] = useState<CustomerAccount[]>([])

  useEffect(() => {
    if (ready) setCustomers(list())
  }, [ready, list, account])

  const pedidosPorCliente = useMemo(() => {
    const counts = new Map<string, number>()
    for (const order of orders) {
      if (!order.clienteId) continue
      counts.set(order.clienteId, (counts.get(order.clienteId) ?? 0) + 1)
    }
    return counts
  }, [orders])

  const rows = useMemo(() => {
    const needle = normalizeText(search.trim())
    return customers
      .filter((cuenta) => !needle || normalizeText(
        `${cuenta.nombre} ${cuenta.apellido} ${cuenta.email} ${cuenta.telefono}`,
      ).includes(needle))
      .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
  }, [customers, search])

  const activos = customers.filter((cuenta) => cuenta.activo).length
  const gestiona = can('gestionar:clientes')

  const alternar = (cuenta: CustomerAccount, activo: boolean) => {
    if (!gestiona) return
    setActive(cuenta.id, activo)
  }

  return (
    <div className="admin-page container-admin">
      <header className="admin-page-head">
        <div className="col">
          <p className="t-min t-muted">Cuentas de la tienda</p>
          <h1 className="t-ui t-strong">Clientes</h1>
          <p className="t-caption">
            Consulta las cuentas registradas, su estado y los pedidos asociados.
          </p>
        </div>
        <div className="admin-actions">
          <span className="t-min t-muted" role="status">
            {ready ? `${customers.length} cuentas · ${activos} activas` : 'Cargando cuentas…'}
          </span>
        </div>
      </header>

      <div className="admin-toolbar">
        <Field label="Buscar cliente" className="admin-toolbar__search">
          {(id) => (
            <Input id={id} value={search} placeholder="Nombre, correo o teléfono"
              onChange={(event) => setSearch(event.target.value)} />
          )}
        </Field>
      </div>

      {!ready ? (
        <p className="t-min t-muted" role="status">Cargando cuentas…</p>
      ) : customers.length === 0 ? (
        <EmptyState title="Aún no hay cuentas de cliente"
          description="Cuando alguien se registre en la tienda, su cuenta aparecerá aquí." />
      ) : rows.length === 0 ? (
        <EmptyState title="Sin clientes para mostrar"
          description="Prueba con otro nombre, correo o teléfono." />
      ) : (
        <div className="table-wrap">
          <ResponsiveTable className="admin-table">
            <thead>
              <tr>
                <th scope="col">Cliente</th>
                <th scope="col">Correo</th>
                <th scope="col">Teléfono</th>
                <th scope="col">Fecha de ingreso</th>
                <th scope="col">Pedidos asociados</th>
                <th scope="col">Estado</th>
                <th scope="col" className="admin-cell-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((cuenta) => (
                <tr key={cuenta.id}>
                  <td><span className="t-mid">{cuenta.nombre} {cuenta.apellido}</span></td>
                  <td>{cuenta.email}</td>
                  <td>{formatPhoneDisplay(cuenta.telefono)}</td>
                  <td className="t-min t-muted">{formatShortDate(cuenta.creadoEn)}</td>
                  <td>{pedidosPorCliente.get(cuenta.id) ?? 0}</td>
                  <td>
                    <span className={cuenta.activo ? 't-primary t-min' : 't-muted t-min'}>
                      {cuenta.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="admin-cell-right">
                    {gestiona ? (
                      <Switch checked={cuenta.activo}
                        label={`Activar o desactivar la cuenta de ${cuenta.nombre} ${cuenta.apellido}`}
                        onChange={(activo) => alternar(cuenta, activo)} />
                    ) : <span className="t-min t-muted">Sin permiso</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        </div>
      )}

      <p className="t-min t-muted" role="note">
        Las acciones sobre cuentas se registran sin contraseñas ni datos sensibles.
      </p>
    </div>
  )
}
