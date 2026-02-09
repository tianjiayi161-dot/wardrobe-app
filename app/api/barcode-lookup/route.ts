import { NextRequest, NextResponse } from 'next/server'
import { uploadToOSS } from '@/lib/oss'
import { downloadImage } from '@/lib/wanx'

export const runtime = 'nodejs'

type LookupResult = {
  code: string
  name: string
  brand?: string
  imageUrl?: string
  material?: string
  season?: string[]
}

async function lookupGoUpc(code: string): Promise<LookupResult | null> {
  const apiKey = process.env.GO_UPC_API_KEY
  if (!apiKey) {
    throw new Error('GO_UPC_API_KEY 未配置')
  }
  const res = await fetch(`https://go-upc.com/api/v1/code/${code}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    return null
  }
  const data = await res.json()
  const product = data?.product
  if (!product) return null
  const material =
    product?.specs?.Material ||
    product?.specs?.Fabric ||
    product?.specs?.material ||
    product?.specs?.fabric

  return {
    code,
    name: product.name || product.title || '未命名商品',
    brand: product.brand,
    imageUrl: product.imageUrl || product.image,
    material,
    season: undefined,
  }
}

async function lookupJisu(code: string): Promise<LookupResult | null> {
  const appkey = process.env.JISU_APP_KEY
  if (!appkey) {
    throw new Error('JISU_APP_KEY 未配置')
  }
  const url = new URL('https://api.jisuapi.com/barcode2/query')
  url.searchParams.set('appkey', appkey)
  url.searchParams.set('barcode', code)
  const res = await fetch(url.toString())
  if (!res.ok) return null
  const data = await res.json()
  if (data.status !== 0) return null
  const result = data.result || {}
  return {
    code,
    name: result.name || '未命名商品',
    brand: result.brand || result.trademark,
    imageUrl: result.image || result.imageurl || result.img,
    material: result.material,
    season: result.season ? [result.season] : undefined,
  }
}

async function fetchAndUploadImage(imageUrl: string) {
  const buffer = await downloadImage(imageUrl)
  return uploadToOSS(buffer, `barcode-${Date.now()}.png`, 'image/png')
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: '缺少条码' }, { status: 400 })
    }

    const provider = process.env.BARCODE_PROVIDER || 'jisu'
    let result: LookupResult | null = null
    if (provider === 'jisu') {
      result = await lookupJisu(code)
    } else {
      result = await lookupGoUpc(code)
    }

    if (!result) {
      return NextResponse.json({ error: '未找到条码信息' }, { status: 404 })
    }

    if (result.imageUrl) {
      try {
        const ossUrl = await fetchAndUploadImage(result.imageUrl)
        result.imageUrl = ossUrl
      } catch (error) {
        console.error('条码图片上传失败:', error)
      }
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('条码查询失败:', error)
    return NextResponse.json({ error: '条码查询失败' }, { status: 500 })
  }
}
