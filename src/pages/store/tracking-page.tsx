import { Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { Field, Input } from '../../components/ui/Field'
import { formatShortDate, formatTime } from '../../logic/services/formatters'
import { useOrdersStore } from '../../logic/store/orders'
import type { Order } from '../../logic/types'

const Timeline = ({ items }: { items: Order['historial'] }) => (
  <ol className="tracking-timeline">
    {items.map((item, index) => (
      <li className="tracking-timeline__item" key={`${item.fecha}-${index}`}>
        <span className="tracking-timeline__dot" aria-hidden="true" />
        <div>
          <p className="t-mid">{item.estado}</p>
          <p className="t-min">{formatShortDate(item.fecha)} · {formatTime(item.fecha)}</p>
          {item.nota && <p className="t-caption">{item.nota}</p>}
        </div>
      </li>
    ))}
  </ol>
)

type Result = Order | 'missing' | null

export const TrackingPage = () => {
  const [params] = useSearchParams()
  const [code, setCode] = useState(() =>
    params.get('codigo') ?? params.get('code') ?? '')
  const [dato, setDato] = useState(() =>
    params.get('telefono') ?? params.get('dato') ?? params.get('correo') ?? '')
  const [result, setResult] = useState<Result>(null)
  const [error, setError] = useState('')
  const findByCode = useOrdersStore((state) => state.findByCode)

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (!code.trim() || !dato.trim()) {
      setResult(null)
      setError('Completa el código y tu teléfono o correo.')
      return
    }
    const found = findByCode(code, dato)
    setResult(found ?? 'missing')
  }

  return (
    <div className="tracking-page container-store">
      <header className="tracking-page__head">
        <p className="tracking-page__eyebrow t-min t-clay">Tu pedido</p>
        <h1 className="t-catalog">Seguimiento</h1>
        <p className="t-subtitle">Ingresa el código del pedido y el teléfono o correo usados al comprar.</p>
      </header>

      <div className="tracking-layout">
        <form className="tracking-form card" onSubmit={onSubmit} noValidate>
          <h2 className="t-ui t-strong">Buscar pedido</h2>
          <Field label="Código del pedido" required>
            {(id, describedBy) => (
              <Input
                id={id}
                className="code"
                value={code}
                placeholder="INV-2026-000001"
                aria-describedby={describedBy || undefined}
                onChange={(event) => setCode(event.target.value)}
              />
            )}
          </Field>
          <Field label="Teléfono o correo" required>
            {(id, describedBy) => (
              <Input
                id={id}
                value={dato}
                placeholder="04xx-xxxxxxx o tu correo"
                aria-describedby={describedBy || undefined}
                onChange={(event) => setDato(event.target.value)}
              />
            )}
          </Field>
          {error && (
            <p className="field__hint is-error tracking-form__error" role="alert">{error}</p>
          )}
          <Button type="submit" full>
            <Search size={17} strokeWidth={1.5} aria-hidden="true" />
            Consultar
          </Button>
          <p className="tracking-form__note t-min">
            Consulta local de demostración. Solo aparecen pedidos registrados en este equipo.
          </p>
        </form>

        <div className="tracking-result">
          {result === 'missing' && (
            <div className="tracking-result__missing card" role="alert">
              <p className="t-ui t-strong">No encontramos ese pedido</p>
              <p className="t-caption">
                Revisa el código y usa exactamente el teléfono o correo con el que se realizó.
              </p>
            </div>
          )}

          {result && result !== 'missing' && (
            <article className="tracking-result__card card" aria-labelledby="tracking-result-title">
              <header className="tracking-result__head">
                <div>
                  <p className="t-min t-clay">Pedido</p>
                  <h2 id="tracking-result-title" className="t-ui t-strong order-code">{result.codigo}</h2>
                </div>
                <Chip active>{result.estado}</Chip>
              </header>
              <p className="t-caption">
                {formatShortDate(result.fecha)} · {result.lineas.length}{' '}
                {result.lineas.length === 1 ? 'producto' : 'productos'}
              </p>
              <Timeline items={result.historial ?? []} />
              <Link className="tracking-result__link t-mid" to={`/pedido/${result.codigo}`}>
                Ver detalle del pedido
              </Link>
            </article>
          )}

          {!result && (
            <div className="tracking-result__idle">
              <p className="t-caption">Aquí verás el estado del pedido después de consultarlo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
