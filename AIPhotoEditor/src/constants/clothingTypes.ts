/**
 * Clothing Type Definitions
 * Used for virtual try-on to specify what type of clothing each item is
 */

export enum ClothingType {
  SHIRT = 'shirt',
  PANTS = 'pants',
  DRESS = 'dress',
  JACKET = 'jacket',
  SHOES = 'shoes',
  SKIRT = 'skirt',
  SHORTS = 'shorts',
  SWEATER = 'sweater',
  ACCESSORY = 'accessory',
  OTHER = 'other',
}

export interface ClothingTypeData {
  id: ClothingType;
  name: string;
  description: string;
  icon: string;
}

export const CLOTHING_TYPES: Record<ClothingType, ClothingTypeData> = {
  [ClothingType.SHIRT]: {
    id: ClothingType.SHIRT,
    name: 'Shirt/Top',
    description: 'Upper body garment',
    icon: '👕',
  },
  [ClothingType.PANTS]: {
    id: ClothingType.PANTS,
    name: 'Pants/Jeans',
    description: 'Lower body garment',
    icon: '👖',
  },
  [ClothingType.DRESS]: {
    id: ClothingType.DRESS,
    name: 'Dress',
    description: 'One-piece garment',
    icon: '👗',
  },
  [ClothingType.JACKET]: {
    id: ClothingType.JACKET,
    name: 'Jacket/Coat',
    description: 'Outer layer',
    icon: '🧥',
  },
  [ClothingType.SHOES]: {
    id: ClothingType.SHOES,
    name: 'Shoes',
    description: 'Footwear',
    icon: '👟',
  },
  [ClothingType.SKIRT]: {
    id: ClothingType.SKIRT,
    name: 'Skirt',
    description: 'Lower body garment',
    icon: '🩱',
  },
  [ClothingType.SHORTS]: {
    id: ClothingType.SHORTS,
    name: 'Shorts',
    description: 'Lower body garment',
    icon: '🩳',
  },
  [ClothingType.SWEATER]: {
    id: ClothingType.SWEATER,
    name: 'Sweater',
    description: 'Upper body garment',
    icon: '🧶',
  },
  [ClothingType.ACCESSORY]: {
    id: ClothingType.ACCESSORY,
    name: 'Accessory',
    description: 'Hat, bag, jewelry, etc.',
    icon: '👜',
  },
  [ClothingType.OTHER]: {
    id: ClothingType.OTHER,
    name: 'Other',
    description: 'Other clothing item',
    icon: '👔',
  },
};

export function getClothingTypeById(id: ClothingType): ClothingTypeData | undefined {
  return CLOTHING_TYPES[id];
}

export function getAllClothingTypes(): ClothingTypeData[] {
  return Object.values(CLOTHING_TYPES);
}


