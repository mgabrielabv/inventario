import { CartContent } from '../../components/store/StoreChrome'

/** Carrito a pantalla completa: reutiliza la misma lógica que la hoja lateral. */
export const CartPage = () => (
  <div className="cart-page container-store">
    <header className="cart-page__head">
      <p className="cart-page__eyebrow t-min t-clay">Tu selección</p>
      <h1 className="t-catalog">Tu carrito</h1>
      <p className="t-subtitle">Revisa los productos y continúa cuando quieras.</p>
    </header>

    <div className="cart-page__panel card">
      <CartContent />
    </div>

    <p className="cart-page__note t-caption">
      Las unidades se apartan al confirmar el pedido. Hasta entonces la disponibilidad puede cambiar.
    </p>
  </div>
)
