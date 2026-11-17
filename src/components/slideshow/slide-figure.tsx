import type { SlideId } from '../../logic/types'
import { BarcodeScan } from '../illustrations/barcode-scan'
import { BoxStack } from '../illustrations/box-stack'
import { PalletArrows } from '../illustrations/pallet-arrows'
import { WarehouseShelf } from '../illustrations/warehouse-shelf'

interface SlideFigureProps {
  id: SlideId
  reducedMotion: boolean
}

export const SlideFigure = ({ id, reducedMotion }: SlideFigureProps) => {
  switch (id) {
    case 'boxes':
      return <BoxStack reducedMotion={reducedMotion} />
    case 'shelf':
      return <WarehouseShelf reducedMotion={reducedMotion} />
    case 'scanner':
      return <BarcodeScan reducedMotion={reducedMotion} />
    case 'pallet':
      return <PalletArrows reducedMotion={reducedMotion} />
  }
}
