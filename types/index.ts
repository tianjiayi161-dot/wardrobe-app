// 衣服类型定义
export interface Clothing {
  _id: string
  name: string
  category:
    | 'tshirt'
    | 'shirt'
    | 'knit'
    | 'sweatshirt'
    | 'camisole'
    | 'bottom_pants'
    | 'bottom_skirt'
    | 'dress'
    | 'outerwear'
    | 'shoes'
    | 'accessory'
    | 'set'
    | 'innerwear'
    | 'homewear'
    | 'sportswear'
  colors: string[]  // 主要颜色标签
  season: string[]  // ['spring', 'summer', 'fall', 'winter']
  style: string[]   // ['casual', 'formal', 'sport']
  imageUrl: string  // OSS URL
  thumbnail: string // 缩略图URL
  tags: string[]    // 自定义标签
  wearCount: number // 穿着次数
  brand?: string    // 品牌（可选）
  price?: number    // 价格（可选）
  createdAt: Date
  updatedAt: Date
}

// 创建衣服时的输入类型
export interface CreateClothingInput {
  name: string
  category:
    | 'tshirt'
    | 'shirt'
    | 'knit'
    | 'sweatshirt'
    | 'camisole'
    | 'bottom_pants'
    | 'bottom_skirt'
    | 'dress'
    | 'outerwear'
    | 'shoes'
    | 'accessory'
    | 'set'
    | 'innerwear'
    | 'homewear'
    | 'sportswear'
  colors: string[]
  season: string[]
  style: string[]
  imageUrl: string
  thumbnail: string
  tags?: string[]
  brand?: string
  price?: number
  wearCount?: number
}

// 搭配类型定义
export interface Outfit {
  _id: string
  name: string
  description?: string
  clothingIds: string[]  // 关联的衣服ID
  occasion?: string      // 场合标签
  season?: string
  isAIGenerated: boolean // 是否由AI生成
  tags: string[]
  createdAt: Date
}

// 创建搭配时的输入类型
export interface CreateOutfitInput {
  name: string
  description?: string
  clothingIds: string[]
  occasion?: string
  season?: string
  isAIGenerated?: boolean
  tags?: string[]
}

// Gemini分析结果
export interface GeminiAnalysisResult {
  category:
    | 'tshirt'
    | 'shirt'
    | 'knit'
    | 'sweatshirt'
    | 'camisole'
    | 'bottom_pants'
    | 'bottom_skirt'
    | 'dress'
    | 'outerwear'
    | 'shoes'
    | 'accessory'
    | 'set'
    | 'innerwear'
    | 'homewear'
    | 'sportswear'
  colors: string[]
  style: string[]
  season: string[]
  description: string
}

// AI推荐结果
export interface AIRecommendation {
  outfitName: string
  description: string
  clothingIds: string[]
  reasoning: string
  occasion?: string
  season?: string
}
