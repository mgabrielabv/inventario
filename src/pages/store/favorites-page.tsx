import { Link } from 'react-router-dom'
import { ProductCard } from '../../components/store/ProductCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { Reveal } from '../../motion/components/Reveal'
import { useFavoritesStore } from '../../logic/store/favorites'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import { getAvailable } from '../../logic/services/stock'

export const FavoritesPage = () => {
  const ids = useFavoritesStore((state) => state.ids)
  const products = useInventoryStore((state) => state.products)
  const orders = useOrdersStore((state) => state.orders)

  const favorites = products.filter((product) =>
    product.publicado && !product.archivado && ids.includes(product.id))

  return (
    <div className="favorites-page container-store">
      <header className="favorites-page__head">
        <p className="favorites-page__eyebrow t-min t-clay">Guardados</p>
        <h1 className="t-catalog">Favoritos</h1>
        <p className="t-subtitle">
          {favorites.length === 0
            ? 'Aún no has guardado ningún producto.'
            : `${favorites.length} ${favorites.length === 1 ? 'producto guardado' : 'productos guardados'}`}
        </p>
      </header>

      {favorites.length === 0 ? (
        <EmptyState
          title="Tu lista está vacía"
          description="Toca el corazón en cualquier producto para guardarlo aquí."
          action={<Link className="btn btn--primary" to="/tienda">Explorar catálogo</Link>}
        />
      ) : (
        <Reveal className="favorites-page__grid" as="div">
          {favorites.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              available={getAvailable(product, orders)}
            />
          ))}
        </Reveal>
      )}
    </div>
  )
}
