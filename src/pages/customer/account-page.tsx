import { ArrowRight, Heart, MapPin, Package, UserRound } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useCustomer } from '../../app/providers/customer-provider'
import { EmptyState } from '../../components/ui/EmptyState'
import { Chip } from '../../components/ui/Chip'
import { formatShortDate } from '../../logic/services/formatters'
import { formatMoney } from '../../logic/services/pricing'
import { useFavoritesStore } from '../../logic/store/favorites'
import { useOrdersStore } from '../../logic/store/orders'
import type { CustomerAccount, Order } from '../../logic/types'

const FLOW = ['Pendiente', 'Confirmado', 'Preparando', 'Listo', 'Entregado'] as const

export const AccountDemoNote = () => (
  <p className="eshop-account-demo t-min">
    Demostración local: los datos se guardan solo en este navegador.
  </p>
)

export const AccountLoading = () => (
  <div className="eshop-account-page container-store">
    <div className="eshop-account-loading" role="status" aria-live="polite">
      <span className="eshop-account-spinner" aria-hidden="true" />
      <p className="t-caption">Preparando tu cuenta…</p>
      <AccountDemoNote />
    </div>
  </div>
)

export const AccountSignInPrompt = () => {
  const location = useLocation()
  return (
    <div className="eshop-account-page container-store">
      <EmptyState
        title="Entra para ver tu cuenta"
        description="Tus pedidos y direcciones te están esperando."
        action={
          <Link className="btn btn--primary" to="/cuenta/ingresar"
            state={{ from: location.pathname + location.search }}>
            Ingresar
          </Link>
        }
      />
      <AccountDemoNote />
    </div>
  )
}

const accountOrders = (account: CustomerAccount, orders: Order[]): Order[] => {
  const email = account.email.toLowerCase()
  const phone = account.telefono.replace(/\D/g, '')
  return orders
    .filter((order) => order.clienteId === account.id
      || (order.cliente.email ?? '').toLowerCase() === email
      || (phone.length >= 10 && order.cliente.telefono.replace(/\D/g, '') === phone))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
}

export const AccountTrackingBar = ({ estado }: { estado: Order['estado'] }) => {
  const index = FLOW.indexOf(estado as (typeof FLOW)[number])
  const progress = estado === 'Cancelado' ? 0 : ((index + 1) / FLOW.length) * 100
  return (
    <div className="eshop-account-progress">
      <div className="eshop-account-progress__track" role="img" aria-label={`Estado del pedido: ${estado}`}>
        <span className="eshop-account-progress__fill" style={{ width: `${Math.max(0, progress)}%` }} />
      </div>
      <div className="eshop-account-progress__steps" aria-hidden="true">
        {FLOW.map((step, position) => (
          <span key={step} className={position <= index && estado !== 'Cancelado' ? 'is-done' : ''}>
            {step}
          </span>
        ))}
      </div>
    </div>
  )
}

const links = [
  { to: '/cuenta/pedidos', label: 'Pedidos', detail: 'Revisa tus compras y repite las que te gustaron.', icon: Package },
  { to: '/cuenta/direcciones', label: 'Direcciones', detail: 'Guarda dónde quieres recibir tus pedidos.', icon: MapPin },
  { to: '/cuenta/perfil', label: 'Perfil', detail: 'Actualiza tus datos y tu contraseña.', icon: UserRound },
  { to: '/favoritos', label: 'Favoritos', detail: 'Vuelve a lo que te guardaste.', icon: Heart },
]

export const AccountPage = () => {
  const { account, isAuthenticated, ready } = useCustomer()
  const orders = useOrdersStore((state) => state.orders)
  const favorites = useFavoritesStore((state) => state.ids.length)

  if (!ready) return <AccountLoading />
  if (!isAuthenticated || !account) return <AccountSignInPrompt />

  const mine = accountOrders(account, orders)
  const last = mine[0]
  const saved = favorites > 0
    ? `${favorites} ${favorites === 1 ? 'producto guardado' : 'productos guardados'}`
    : 'Aún no guardas productos'

  return (
    <div className="eshop-account-page container-store">
      <header className="eshop-account-head">
        <div>
          <p className="eshop-account-eyebrow t-min t-clay">Mi cuenta</p>
          <h1 className="t-section">¡Hola, {account.nombre}!</h1>
          <p className="t-subtitle">Aquí tienes todo lo de tu cuenta en un solo lugar.</p>
        </div>
        <Link className="btn btn--secondary" to="/tienda">Seguir comprando</Link>
      </header>

      <section className="eshop-account-overview card" aria-labelledby="last-order-title">
        <div className="eshop-account-overview__head">
          <div>
            <p className="t-min t-muted">Último pedido</p>
            <h2 id="last-order-title" className="t-ui t-strong">
              {last ? `Pedido ${last.codigo}` : 'Todavía no hiciste pedidos'}
            </h2>
          </div>
          {last && <Chip active={last.estado !== 'Cancelado'}>{last.estado}</Chip>}
        </div>

        {last ? (
          <>
            <p className="t-caption">
              {formatShortDate(last.fecha)} · {formatMoney(last.total, last.moneda)}
            </p>
            <AccountTrackingBar estado={last.estado} />
            <Link className="eshop-account-inline-link t-mid" to={`/cuenta/pedidos/${encodeURIComponent(last.codigo)}`}>
              Ver detalle del pedido <ArrowRight size={15} strokeWidth={1.6} aria-hidden="true" />
            </Link>
          </>
        ) : (
          <>
            <p className="t-caption">Cuando hagas tu primera compra, podrás seguirla desde aquí.</p>
            <Link className="btn btn--primary btn--sm" to="/tienda">Explorar productos</Link>
          </>
        )}
      </section>

      <section aria-labelledby="account-links-title" className="eshop-account-section">
        <h2 id="account-links-title" className="eshop-account-section__title t-ui t-strong">Tus accesos</h2>
        <div className="eshop-account-tiles">
          {links.map(({ to, label, detail, icon: Icon }) => (
            <Link key={to} to={to} className="eshop-account-tile card">
              <span className="eshop-account-tile__icon" aria-hidden="true"><Icon size={22} strokeWidth={1.6} /></span>
              <span className="eshop-account-tile__body">
                <strong className="t-mid">{label}</strong>
                <small className="t-caption">{detail}</small>
              </span>
              {to === '/favoritos' && <small className="eshop-account-tile__extra t-min">{saved}</small>}
              <ArrowRight size={17} strokeWidth={1.6} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <AccountDemoNote />
    </div>
  )
}
