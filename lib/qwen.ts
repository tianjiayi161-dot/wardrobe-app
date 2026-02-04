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
  "category": "类别（top/bottom_pants/bottom_skirt/dress/outerwear/shoes/accessory/set/innerwear/homewear/sportswear之一）",
  "colors": ["主要颜色1", "主要颜色2"],
  "style": ["风格标签，如casual/formal/sport等"],
  "season": ["适合的季节，如spring/summer/fall/winter"],
  "description": "简短描述（中文）"
}

注意：
- category必须是以下之一：top（上装）, bottom_pants（裤装）, bottom_skirt（裙装）, dress（连衣裙）, outerwear（外套）, shoes（鞋子）, accessory（配饰）, set（套装）, innerwear（内衣）, homewear（家居服）, sportswear（运动服）
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
      category: 'top',
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
    // 第一轮：详细观察（使用视觉模型）
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
              text: `你是专业的服装分析师。请非常仔细地观察这件衣服，并详细描述：

1. **衣服类型**（请非常具体）：
   - 上装：T恤、衬衫、毛衣、卫衣、背心、吊带等
   - 下装：裤装（牛仔裤、休闲裤、西裤、短裤等）、裙装（半身裙等）
   - 连衣裙：连衣裙、吊带裙等
   - 外套：夹克、大衣、风衣、羽绒服等
   - 鞋子：运动鞋、皮鞋、高跟鞋、靴子等
   - 套装/运动服/家居服：成套或功能性服装
   - 内衣：内衣、内裤、打底等

2. **颜色分析**（非常重要，请精确识别）：
   - 主色调是什么？（请使用精确的颜色名称）
   - 有没有辅助色或图案颜色？
   - 颜色的深浅程度（浅色/中等/深色）
   - 常见颜色参考：黑色、白色、灰色、米色、卡其色、藏青色、深蓝色、浅蓝色、天蓝色、红色、酒红色、粉色、黄色、绿色、军绿色、橙色、紫色、棕色

3. **面料和质感**：
   - 面料类型（棉、麻、丝、针织、牛仔、皮革等）
   - 厚薄程度
   - 光泽度

4. **款式细节**（越详细越好）：
   - 领型：圆领、V领、翻领、高领、方领等
   - 袖型：短袖、长袖、七分袖、无袖、泡泡袖等
   - 版型：修身、宽松、oversize、直筒、A字等
   - 长度：超短、短款、中长、长款等
   - 特殊设计：印花图案、刺绣、拼接、破洞、褶皱等

5. **风格特征**：
   - 这件衣服给人的整体感觉（休闲、正式、运动、优雅、街头、复古等）
   - 适合什么场合穿着

请用结构化的方式详细描述，越详细越好。`,
            },
          ],
        },
      ],
      temperature: 0.1, // 降低温度以获得更一致的结果
    })

    const observationText = observation.choices[0]?.message?.content || ''
    console.log('AI观察结果:', observationText)

    // 第二轮：结构化分类（使用文本模型）
    const classification = await client.chat.completions.create({
      model: 'qwen-plus',
      messages: [
        {
          role: 'user',
          content: `基于以下详细观察结果，请将衣服分类为标准JSON格式：

观察结果：
${observationText}

请返回以下JSON结构（只返回JSON，不要任何其他文字）：
{
  "category": "类别",
  "colors": ["主要颜色1", "辅助颜色2"],
  "style": ["风格标签1", "风格标签2"],
  "season": ["适合季节1", "适合季节2"],
  "description": "简短的中文描述"
}

**分类规则（严格遵守）：**

1. category - 必须选择以下之一：
   - "top": T恤、衬衫、毛衣、卫衣、背心、吊带等所有上身衣物
   - "bottom_pants": 裤子、短裤等所有裤装
   - "bottom_skirt": 半身裙等所有裙装
   - "dress": 连衣裙、吊带裙等
   - "outerwear": 外套、夹克、大衣、风衣、羽绒服等
   - "shoes": 所有鞋类
   - "accessory": 帽子、围巾、包包等配饰
   - "set": 成套搭配（上下装成套）
   - "innerwear": 内衣、打底
   - "homewear": 家居服/睡衣
   - "sportswear": 运动服

2. colors - 使用标准中文颜色名（最多3个，按重要性排序）：
   标准颜色：黑色、白色、灰色、米色、卡其色、藏青色、蓝色、浅蓝色、红色、粉色、黄色、绿色、橙色、紫色、棕色

3. style - 选择最贴切的风格标签（1-3个）：
   - "casual": 日常休闲、舒适随意
   - "formal": 正式、商务、职业
   - "sport": 运动、健身
   - "elegant": 优雅、精致、淑女
   - "vintage": 复古、怀旧
   - "street": 街头、潮流、嘻哈
   - "minimalist": 极简、性冷淡风
   - "preppy": 学院风、清新

4. season - 根据面料厚度判断（可多选）：
   - 薄款、短袖、透气: ["spring", "summer"]
   - 中等厚度、长袖: ["spring", "fall"]
   - 厚款、保暖: ["fall", "winter"]
   - 四季通用: ["spring", "summer", "fall", "winter"]

5. description - 用一句话描述（15-30字）：
   格式："{颜色}{款式}{类型}，{风格}，适合{场合}"
   例如："深蓝色修身牛仔裤，休闲百搭，适合日常穿着"

IMPORTANT: 只返回JSON格式，不要添加任何解释文字。`,
        },
      ],
      temperature: 0.2,
    })

    const response = classification.choices[0]?.message?.content || ''
    console.log('AI分类结果:', response)

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
- 若使用连衣裙/套装/运动服/家居服，可视为完成上装+下装
- 否则应包含上装+下装（裤装或裙装）
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
- 搭配要合理（比如有上装和下装）
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
