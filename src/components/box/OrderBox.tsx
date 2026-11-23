import { motion, useReducedMotion } from 'framer-motion'
import { BoxStack } from './BoxStack'
import { spring } from '../../motion/tokens'

/** Ensamblaje de cajas de la confirmación, con la etiqueta del pedido. */
export const OrderBox = ({ code, size = 260 }: { code: string; size?: number }) => {
  const reduce = useReducedMotion()
  return (
    <div className="order-box" style={{ maxWidth: size }}>
      <BoxStack size={size} float={false} />
      <motion.div
        className="order-box__label card"
        initial={reduce ? false : { opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...spring.soft, delay: reduce ? 0 : 0.35 }}
      >
        <span className="t-min t-muted">Código del pedido</span>
        <span className="order-code t-mid t-strong">{code}</span>
      </motion.div>
    </div>
  )
}
