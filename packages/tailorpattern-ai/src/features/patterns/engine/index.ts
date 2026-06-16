import type { GarmentType } from '../types/pattern.types'
import type { EngineInput, EngineOutput } from './types'
import { generateSuitJacket } from './garments/mens/suitJacket'
import { generateTrouser } from './garments/mens/trouser'
import { generateShirt } from './garments/mens/shirt'
import { generateTraditional } from './garments/mens/traditional'
import { generateBlouse } from './garments/womens/blouse'
import { generateSkirt } from './garments/womens/skirt'
import { generateDress } from './garments/womens/dress'
import { generateChildrensGarment } from './garments/childrens/scaled'

export function generatePattern(garmentType: GarmentType, input: EngineInput): EngineOutput {
  switch (garmentType) {
    case 'mens-suit-jacket':
      return generateSuitJacket(input)

    case 'mens-trouser':
      return generateTrouser(input)

    case 'mens-formal-shirt':
    case 'mens-casual-shirt':
    case 'uniform-shirt-m':
    case 'uniform-shirt-f':
      return generateShirt(input)

    case 'mens-agbada':
    case 'mens-senator':
    case 'mens-kaftan':
    case 'mens-dashiki':
      return generateTraditional(garmentType, input)

    case 'womens-blouse':
    case 'womens-suit-jacket':
      return generateBlouse(input)

    case 'womens-aline-skirt':
    case 'womens-straight-skirt':
    case 'womens-flared-skirt':
    case 'uniform-skirt':
      return generateSkirt(garmentType, input)

    case 'womens-shift-dress':
    case 'womens-fit-flare-dress':
    case 'womens-wrap-dress':
      return generateDress(garmentType, input)

    case 'childrens-shirt':
    case 'childrens-dress':
    case 'childrens-trouser':
      return generateChildrensGarment(garmentType, input)

    default:
      return { pieces: [], warnings: [`Garment type '${garmentType}' not yet implemented`] }
  }
}

export type { EngineInput, EngineOutput }
