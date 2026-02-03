import { GoogleGenerativeAI } from '@google/generative-ai'
import { GeminiAnalysisResult, AIRecommendation, Clothing } from '@/types'

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY未配置，AI功能将不可用')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// 使用Gemini Vision分析衣服图片
export async function analyzeClothingImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<GeminiAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    const prompt = `请分析这张衣服图片，并以JSON格式返回以下信息：
{
  "category": "类别（top/bottom/outerwear/shoes/accessory之一）",
  "colors": ["主要颜色1", "主要颜色2"],
  "style": ["风格标签，如casual/formal/sport等"],
  "season": ["适合的季节，如spring/summer/fall/winter"],
  "description": "简短描述（中文）"
}

注意：
- category必须是以下之一：top（上装）, bottom（下装）, outerwear（外套）, shoes（鞋子）, accessory（配饰）
- colors用英文单词，如red, blue, black, white等
- style可以是：casual, formal, sport, elegant, vintage, street
- season可以是：spring, summer, fall, winter
- 只返回JSON，不要其他文字`

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
          mimeType,
        },
      },
      prompt,
    ])

    const response = result.response.text()

    // 提取JSON（去掉可能的markdown代码块标记）
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('无法解析Gemini返回的结果')
    }

    const analysis: GeminiAnalysisResult = JSON.parse(jsonMatch[0])
    return analysis
  } catch (error) {
    console.error('Gemini分析失败:', error)
    // 返回默认值
    return {
      category: 'top',
      colors: ['black'],
      style: ['casual'],
      season: ['spring', 'summer', 'fall', 'winter'],
      description: '无法识别，请手动编辑',
    }
  }
}

// 使用Gemini生成搭配推荐
export async function generateOutfitRecommendations(
  clothes: Clothing[],
  count: number = 3
): Promise<AIRecommendation[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    const clothesDescription = clothes.map((c, idx) =>
      `${idx + 1}. ${c.name} (ID:${c._id}, 类别:${c.category}, 颜色:${c.colors.join(',')}, 风格:${c.style.join(',')})`
    ).join('\n')

    const prompt = `我有以下衣服：
${clothesDescription}

请根据这些衣服，推荐${count}套搭配方案。每套搭配应该包含上装、下装等合理组合。

请以JSON数组格式返回，每个搭配包含：
[
  {
    "outfitName": "搭配名称（中文）",
    "description": "搭配描述（中文）",
    "clothingIds": ["衣服ID1", "衣服ID2", ...],
    "reasoning": "推荐理由（中文）",
    "occasion": "适合场合（可选）",
    "season": "适合季节（可选）"
  }
]

注意：
- clothingIds必须使用上面列表中的实际ID
- 每套搭配至少包含2件衣服
- 搭配要合理（比如有上装和下装）
- 只返回JSON数组，不要其他文字`

    const result = await model.generateContent(prompt)
    const response = result.response.text()

    // 提取JSON数组
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('无法解析Gemini返回的搭配推荐')
    }

    const recommendations: AIRecommendation[] = JSON.parse(jsonMatch[0])
    return recommendations.slice(0, count)
  } catch (error) {
    console.error('生成搭配推荐失败:', error)
    return []
  }
}
