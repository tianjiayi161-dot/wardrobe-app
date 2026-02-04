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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

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

// 增强版AI分析（更准确的颜色和款式识别）
export async function analyzeClothingImageEnhanced(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<GeminiAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.2, // 降低温度提高一致性
        topK: 40,
        topP: 0.95,
      },
    })

    // 第一轮：详细观察
    const observationPrompt = `You are a professional fashion analyst. Carefully examine this clothing item and describe:
1. The exact type of garment (be specific: t-shirt, dress shirt, jeans, etc.)
2. All visible colors (be precise with color names, note any patterns)
3. Fabric texture and material characteristics
4. Key style elements (collar type, sleeve length, cut, fit)
5. Any distinctive features or patterns

Provide a detailed observation in clear, structured format.`

    const step1 = await model.generateContent([
      { inlineData: { data: imageBase64.replace(/^data:image\/\w+;base64,/, ''), mimeType } },
      observationPrompt,
    ])

    const observation = step1.response.text()

    // 第二轮：结构化分类
    const classificationPrompt = `Based on this observation:
${observation}

Now classify the clothing item into this exact JSON structure:
{
  "category": "选择一个: top/bottom/outerwear/shoes/accessory",
  "colors": ["主要颜色（最多3个，使用精确的英文颜色名）"],
  "style": ["风格标签，从这些选择: casual, formal, sport, elegant, vintage, street, minimalist, preppy"],
  "season": ["适合的季节: spring, summer, fall, winter（可多选）"],
  "description": "简短的中文描述（包含款式、颜色、风格特点）"
}

分类规则：
- category:
  * top: T恤、衬衫、毛衣、背心等上身衣物
  * bottom: 裤子、裙子、短裤等下身衣物
  * outerwear: 外套、夹克、大衣等
  * shoes: 所有鞋类
  * accessory: 帽子、围巾、包等配饰

- colors: 使用标准色彩名（如navy blue, light gray, burgundy等），按从主到次排列

- style: 可多选，根据实际特征判断：
  * casual: 日常休闲风格
  * formal: 正式商务场合
  * sport: 运动风格
  * elegant: 优雅精致
  * vintage: 复古风
  * street: 街头潮流
  * minimalist: 极简主义
  * preppy: 学院风

- season: 根据面料厚度、袖长判断：
  * 薄款、短袖: spring, summer
  * 中等厚度、长袖: spring, fall
  * 厚款、保暖: fall, winter

IMPORTANT: 只返回JSON，不要任何其他文字。`

    const step2 = await model.generateContent(classificationPrompt)
    const response = step2.response.text()

    // 提取JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('无法解析分析结果')
    }

    const analysis: GeminiAnalysisResult = JSON.parse(jsonMatch[0])

    // 标准化颜色名称到预定义集合
    analysis.colors = normalizeColors(analysis.colors)

    return analysis
  } catch (error) {
    console.error('增强分析失败:', error)
    // 降级到基础分析
    return analyzeClothingImage(imageBase64, mimeType)
  }
}

/**
 * 颜色标准化函数：将细分颜色映射到标准色系
 */
function normalizeColors(colors: string[]): string[] {
  const colorMapping: Record<string, string> = {
    'navy': 'blue',
    'navy blue': 'blue',
    'light blue': 'blue',
    'dark blue': 'blue',
    'sky blue': 'blue',
    'beige': 'brown',
    'tan': 'brown',
    'khaki': 'brown',
    'burgundy': 'red',
    'crimson': 'red',
    'maroon': 'red',
    'charcoal': 'gray',
    'silver': 'gray',
    'off-white': 'white',
    'cream': 'white',
    'ivory': 'white',
    'lavender': 'purple',
    'violet': 'purple',
    'olive': 'green',
    'lime': 'green',
    'mint': 'green',
    'coral': 'orange',
    'peach': 'orange',
    'rose': 'pink',
    'magenta': 'pink',
  }

  const standardColors = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'brown', 'pink', 'purple', 'orange']

  return colors
    .map((color) => {
      const lowerColor = color.toLowerCase().trim()
      // 如果有映射，使用映射值
      if (colorMapping[lowerColor]) return colorMapping[lowerColor]
      // 如果已是标准颜色，直接返回
      if (standardColors.includes(lowerColor)) return lowerColor
      // 尝试部分匹配
      for (const std of standardColors) {
        if (lowerColor.includes(std)) return std
      }
      return lowerColor
    })
    .filter((color, index, self) => self.indexOf(color) === index) // 去重
    .slice(0, 3) // 最多3个颜色
}

// 使用Gemini生成搭配推荐
export async function generateOutfitRecommendations(
  clothes: Clothing[],
  count: number = 3
): Promise<AIRecommendation[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

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
