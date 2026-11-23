import { useState } from 'react'
import { ProductArt, type ArtView } from '../../components/art/ProductArt'
import { Segmented } from '../../components/ui/Segmented'
import { useInventoryStore } from '../../logic/store/inventory'

const VIEWS: ArtView[] = ['solo', 'hero', 'abierto', 'detalle']

/** Hoja de contacto: permite revisar los 25 arquetipos a 120 y 480 px. */
export const ArtSheetPage = () => {
  const products = useInventoryStore((state) => state.products)
  const [view, setView] = useState<ArtView>('hero')

  return (
    <div className="art-sheet container-store">
      <header className="art-sheet__head">
        <p className="t-min t-clay">Verificación visual</p>
        <h1 className="t-catalog">Arte de producto</h1>
        <p className="t-subtitle">Los 25 arquetipos a 120 px y 480 px, en cuatro vistas.</p>
        <Segmented
          label="Vista"
          value={view}
          options={VIEWS.map((item) => ({ value: item, label: item }))}
          onChange={(value) => setView(value as ArtView)}
        />
      </header>

      <section aria-label="Arquetipos a 120 píxeles">
        <h2 className="t-ui t-strong">120 px</h2>
        <div className="art-sheet__group" data-art-sheet="small">
          {products.map((product) => (
            <div className="art-sheet__item" key={product.id}>
              <ProductArt product={product} size={120} view={view} />
              <span>{product.codigo} · {product.arquetipo}</span>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Arquetipos a 480 píxeles">
        <h2 className="t-ui t-strong">480 px</h2>
        <div className="art-sheet__large" data-art-sheet="large">
          {products.map((product) => (
            <div className="art-sheet__item" key={product.id}>
              <ProductArt product={product} size={480} view={view} />
              <span>{product.codigo} · {product.nombre}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
