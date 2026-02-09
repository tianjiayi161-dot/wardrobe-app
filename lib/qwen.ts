import OpenAI from 'openai'
import { GeminiAnalysisResult, AIRecommendation, Clothing } from '@/types'

if (!process.env.QWEN_API_KEY) {
  console.warn('⚠️  QWEN_API_KEY未配置，AI功能将不可用')
}

// 初始化通义千问客户端（兼容OpenAI格式）
const client = new OpenAI({
  apiKey: process.env.QWEN_API_KEY || '',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
})

/**
 * 使用通义千问视觉模型分析衣服图片
 */
export async function analyzeClothingImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<GeminiAnalysisResult> {
  try {
    const completion = await client.chat.completions.create({
      model: 'qwen-vl-max',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:')
                  ? imageBase64
                  : `data:${mimeType};base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: `请分析这张衣服图片，并以JSON格式返回以下信息：
{
  "category": "类别（tshirt/shirt/knit/sweatshirt/camisole/bottom_pants/bottom_skirt/dress/outerwear/shoes/accessory/set/innerwear/homewear/sportswear之一）",
  "colors": ["主要颜色1", "主要颜色2"],
  "style": ["风格标签，如casual/formal/sport等"],
  "season": ["适合的季节，如spring/summer/fall/winter"],
  "description": "简短描述（中文）"
}

注意：
- category必须是以下之一：tshirt（T恤）, shirt（衬衫）, knit（针织/毛衣）, sweatshirt（卫衣）, camisole（背心/吊带）, bottom_pants（裤装）, bottom_skirt（裙装）, dress（连衣裙）, outerwear（外套）, shoes（鞋子）, accessory（配饰）, set（套装）, innerwear（内衣）, homewear（家居服）, sportswear（运动服）
- colors用英文单词，如red, blue, black, white等
- style可以是：casual, formal, sport, elegant, vintage, street
- season可以是：spring, summer, fall, winter
- 只返回JSON，不要其他文字`,
            },
          ],
        },
      ],
    })

    const response = completion.choices[0]?.message?.content || ''

    // 提取JSON（去掉可能的markdown代码块标记）
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('无法解析通义千问返回的结果')
    }

    const analysis: GeminiAnalysisResult = JSON.parse(jsonMatch[0])
    return analysis
  } catch (error) {
    console.error('通义千问分析失败:', error)
    // 返回默认值
    return {
      category: 'tshirt',
      colors: ['black'],
      style: ['casual'],
      season: ['spring', 'summer', 'fall', 'winter'],
      description: '无法识别，请手动编辑',
    }
  }
}

/**
 * 增强版AI分析（更准确的颜色和款式识别）
 */
export async function analyzeClothingImageEnhanced(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<GeminiAnalysisResult> {
  try {
    const observation = await client.chat.completions.create({
      model: 'qwen-vl-max',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:')
                  ? imageBase64
                  : `data:${mimeType};base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: `你是专业的服装分析师。请非常仔细地观察这件衣服，并给出结构化描述（衣服类型、颜色、面料、款式细节、风格特征）。`,
            },
          ],
        },
      ],
      temperature: 0.1,
    })

    const observationText = observation.choices[0]?.message?.content || ''
    console.log('AI观察结果:', observationText)

    const classification = await client.chat.completions.create({
      model: 'qwen-plus',
      messages: [
        {
          role: 'user',
          content: `基于以下详细观察结果，请将衣服分类为标准JSON格式（只返回JSON）：

观察结果：
${observationText}

返回结构：
{
  "category": "tshirt/shirt/knit/sweatshirt/camisole/bottom_pants/bottom_skirt/dress/outerwear/shoes/accessory/set/innerwear/homewear/sportswear之一",
  "colors": ["主要颜色1", "辅助颜色2"],
  "style": ["casual/formal/sport/elegant/vintage/street/minimalist/preppy"],
  "season": ["spring","summer","fall","winter"],
  "description": "简短的中文描述"
}

要求：
- 只输出JSON，不要其他文字。
- colors使用中文颜色名（黑色/白色/灰色/米色/卡其色/藏青色/蓝色/浅蓝色/红色/粉色/黄色/绿色/橙色/紫色/棕色）。`,
        },
      ],
      temperature: 0.2,
    })

    const response = classification.choices[0]?.message?.content || ''
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('无法解析分析结果')
    }

    const analysis: GeminiAnalysisResult = JSON.parse(jsonMatch[0])
    analysis.colors = normalizeColors(analysis.colors)
    return analysis
  } catch (error) {
    console.error('增强分析失败:', error)
    return analyzeClothingImage(imageBase64, mimeType)
  }
}

/**
 * 识别细分品类、主色Hex与面料
 */
export async function analyzeClothingAttributes(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<{
  category: string
  subcategory: string
  colorsHex: string[]
  material: string
  colors: string[]
  style: string[]
  season: string[]
  description: string
}> {
  try {
    const completion = await client.chat.completions.create({
      model: 'qwen-vl-max',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:')
                  ? imageBase64
                  : `data:${mimeType};base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: `请识别衣物并返回 JSON：
{
  "category": "标准类别（tshirt/shirt/knit/sweatshirt/camisole/bottom_pants/bottom_skirt/dress/outerwear/shoes/accessory/set/innerwear/homewear/sportswear之一）",
  "subcategory": "更细分品类（如连帽卫衣/直筒牛仔裤/西装外套）",
  "colorsHex": ["#RRGGBB", "#RRGGBB"],
  "material": "面料质感（如棉/牛仔/羊毛/真丝/皮革/针织等）",
  "colors": ["主色中文", "辅色中文"],
  "style": ["风格标签，如casual/formal/sport/elegant/vintage/street"],
  "season": ["spring","summer","fall","winter"],
  "description": "简短中文描述"
}
注意：只返回 JSON，不要其他文字。`,
            },
          ],
        },
      ],
      temperature: 0.2,
    })

    const response = completion.choices[0]?.message?.content || ''
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('无法解析通义千问返回的结果')
    }
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('属性识别失败:', error)
    return {
      category: 'tshirt',
      subcategory: '基础款',
      colorsHex: ['#000000'],
      material: '棉',
      colors: ['黑色'],
      style: ['casual'],
      season: ['spring', 'summer', 'fall', 'winter'],
      description: '无法识别，请手动编辑',
    }
  }
}

/**
 * 颜色标准化函数：将细分颜色映射到标准色系
 */
function normalizeColors(colors: string[]): string[] {
  const colorMapping: Record<string, string> = {
    // 中文颜色映射
    '黑色': 'black',
    '白色': 'white',
    '灰色': 'gray',
    '米色': 'brown',
    '卡其色': 'brown',
    '藏青色': 'blue',
    '蓝色': 'blue',
    '深蓝色': 'blue',
    '浅蓝色': 'blue',
    '天蓝色': 'blue',
    '红色': 'red',
    '酒红色': 'red',
    '粉色': 'pink',
    '粉红色': 'pink',
    '黄色': 'yellow',
    '绿色': 'green',
    '军绿色': 'green',
    '橙色': 'orange',
    '紫色': 'purple',
    '棕色': 'brown',
    '咖啡色': 'brown',
    // 英文颜色映射
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

/**
 * 使用通义千问生成搭配推荐
 */
export async function generateOutfitRecommendations(
  clothes: Clothing[],
  count: number = 3
): Promise<AIRecommendation[]> {
  try {
    const clothesDescription = clothes.map((c, idx) =>
      `${idx + 1}. ${c.name} (ID:${c._id}, 类别:${c.category}, 颜色:${c.colors.join(',')}, 风格:${c.style.join(',')})`
    ).join('\n')

    const completion = await client.chat.completions.create({
      model: 'qwen-plus',
      messages: [
        {
          role: 'user',
          content: `我有以下衣服：
${clothesDescription}

请根据这些衣服，推荐${count}套搭配方案。每套搭配应尽量完整：
- 若使用连衣裙/套装/运动服/家居服，可视为完成上身+下装
- 否则应包含上身类+下装（裤装或裙装）
- 如果衣橱中有鞋子/配饰/外套，请尽量包含（若某类别不存在则无需强行补齐）。

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
- 搭配要合理（比如有上身类和下装）
- 只返回JSON数组，不要其他文字`,
        },
      ],
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content || ''

    // 提取JSON数组
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('无法解析通义千问返回的搭配推荐')
    }

    const recommendations: AIRecommendation[] = JSON.parse(jsonMatch[0])
    return recommendations.slice(0, count)
  } catch (error) {
    console.error('生成搭配推荐失败:', error)
    return []
  }
}

export async function generateImagePromptFromDescription(
  description: string
): Promise<string> {
  const baseTemplate =
    'A professional, clean, flat-lay product photography of [描述], centered on a pure white background, minimal style, 8k resolution, soft studio lighting.'
  try {
    const completion = await client.chat.completions.create({
      model: 'qwen-plus',
      messages: [
        {
          role: 'system',
          content:
            '你是资深产品摄影提示词专家。只输出一行英文提示词，不要加引号、不加解释。',
        },
        {
          role: 'user',
          content: `请将用户描述转为高质量图像提示词，并严格使用如下格式：
A professional, clean, flat-lay product photography of [用户描述], centered on a pure white background, minimal style, 8k resolution, soft studio lighting.

用户描述：${description}

只输出最终提示词。`,
        },
      ],
      temperature: 0.4,
    })

    const text = completion.choices[0]?.message?.content?.trim() || ''
    if (!text) {
      return baseTemplate.replace('[描述]', description)
    }
    return text
  } catch (error) {
    console.error('生成提示词失败:', error)
    return baseTemplate.replace('[描述]', description)
  }
}
