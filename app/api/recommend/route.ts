import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { generateOutfitRecommendations } from '@/lib/qwen'
import { normalizeCategory } from '@/lib/utils'
import { Clothing, AIRecommendation } from '@/types'
import { ObjectId } from 'mongodb'

type ClothingCategory = Clothing['category']

const TOP_CATEGORIES: ClothingCategory[] = [
  'tshirt',
  'shirt',
  'knit',
  'sweatshirt',
  'camisole',
]

const FULL_OUTFIT_CATEGORIES: ClothingCategory[] = [
  'dress',
  'set',
  'sportswear',
  'homewear',
]

function buildCategoryIndex(clothes: Clothing[]) {
  const byId = new Map<string, Clothing>()
  const byCategory: Record<ClothingCategory, Clothing[]> = {
    tshirt: [],
    shirt: [],
    knit: [],
    sweatshirt: [],
    camisole: [],
    bottom_pants: [],
    bottom_skirt: [],
    dress: [],
    outerwear: [],
    shoes: [],
    accessory: [],
    set: [],
    innerwear: [],
    homewear: [],
    sportswear: [],
  }

  for (const item of clothes) {
    byId.set(item._id, item)
    byCategory[item.category].push(item)
  }

  return { byId, byCategory }
}

function ensureCompleteOutfit(
  clothingIds: string[],
  clothes: Clothing[],
  byId: Map<string, Clothing>,
  byCategory: Record<ClothingCategory, Clothing[]>
): string[] {
  const allIds = new Set(clothes.map((c) => c._id))
  const used = new Set<string>()

  const normalized: string[] = []
  for (const id of clothingIds || []) {
    if (!allIds.has(id) || used.has(id)) continue
    used.add(id)
    normalized.push(id)
  }

  const hasCategory = (cat: ClothingCategory) =>
    normalized.some((id) => byId.get(id)?.category === cat)

  const hasFullOutfit = FULL_OUTFIT_CATEGORIES.some((cat) => hasCategory(cat))
  const hasTop = TOP_CATEGORIES.some((cat) => hasCategory(cat))
  const hasBottom =
    hasCategory('bottom_pants') ||
    hasCategory('bottom_skirt')

  const pickFromCategory = (cat: ClothingCategory) =>
    byCategory[cat].find((c) => !used.has(c._id))

  const ensureCategory = (cat: ClothingCategory) => {
    if (byCategory[cat].length === 0) return
    if (!hasCategory(cat)) {
      const candidate = pickFromCategory(cat)
      if (candidate) {
        used.add(candidate._id)
        normalized.push(candidate._id)
      }
    }
  }

  if (!hasFullOutfit) {
    if (!hasTop) {
      for (const cat of TOP_CATEGORIES) {
        if (byCategory[cat].length > 0) {
          ensureCategory(cat)
          break
        }
      }
    }
    if (!hasBottom) {
      if (byCategory.bottom_pants.length > 0) {
        ensureCategory('bottom_pants')
      } else if (byCategory.bottom_skirt.length > 0) {
        ensureCategory('bottom_skirt')
      }
    }
  }

  ensureCategory('shoes')
  ensureCategory('accessory')

  if (byCategory.outerwear.length > 0 && !hasCategory('outerwear')) {
    const candidate = pickFromCategory('outerwear')
    if (candidate) {
      used.add(candidate._id)
      normalized.push(candidate._id)
    }
  }

  if (normalized.length < 2) {
    const fallback = clothes.find((c) => !used.has(c._id))
    if (fallback) normalized.push(fallback._id)
  }

  return normalized
}

function normalizeRecommendations(
  recommendations: AIRecommendation[],
  clothes: Clothing[]
): AIRecommendation[] {
  const { byId, byCategory } = buildCategoryIndex(clothes)

  return recommendations
    .map((rec) => ({
      ...rec,
      clothingIds: ensureCompleteOutfit(rec.clothingIds || [], clothes, byId, byCategory),
    }))
    .filter((rec) => rec.clothingIds.length >= 2)
}

export async function POST(request: NextRequest) {
  try {
    // 从 middleware 获取 userId
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { count = 3 } = await request.json()

    console.log('开始生成搭配推荐，数量:', count, 'userId:', userId)

    // 获取当前用户的所有衣服
    const collection = await getCollection('clothes')
    const clothes = await collection.find({
      userId: new ObjectId(userId)
    }).toArray()

    console.log('衣橱中的衣服数量:', clothes.length)

    if (clothes.length < 2) {
      console.warn('衣服数量不足，无法生成推荐')
      return NextResponse.json(
        { error: `衣橱中至少需要2件衣服才能生成推荐（当前只有${clothes.length}件）` },
        { status: 400 }
      )
    }

    // 转换格式
    const formattedClothes: Clothing[] = clothes.map((c) => ({
      ...c,
      _id: c._id.toString(),
      userId: c.userId.toString(),
      category: normalizeCategory(c.category),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    } as Clothing))

    console.log('调用AI生成推荐...')
    const recommendations = await generateOutfitRecommendations(
      formattedClothes,
      count
    )

    console.log('生成推荐成功，数量:', recommendations.length)

    const normalized = normalizeRecommendations(recommendations, formattedClothes)

    if (normalized.length === 0) {
      return NextResponse.json(
        { error: 'AI未能生成有效的搭配推荐，请稍后重试' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      recommendations: normalized.slice(0, count),
    })
  } catch (error) {
    console.error('生成推荐失败 - 详细错误:', error)
    console.error('错误堆栈:', error instanceof Error ? error.stack : 'no stack')
    return NextResponse.json(
      { error: `生成推荐失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    )
  }
}
