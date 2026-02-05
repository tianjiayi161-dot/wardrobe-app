// 天气服务 - 使用OpenWeatherMap API
// 免费额度：每分钟60次，每天1000次

interface WeatherData {
  temperature: number
  condition: string
  description: string
  icon: string
  humidity: number
  windSpeed: number
}

interface ForecastDay {
  date: string
  temperature: {
    min: number
    max: number
  }
  condition: string
  icon: string
}

// 根据天气提供穿衣建议
export function getClothingAdvice(temp: number, condition: string): string {
  // 温度建议
  if (temp < 10) return '建议穿厚外套、毛衣'
  if (temp < 15) return '建议穿外套或针织衫'
  if (temp < 20) return '建议穿薄外套或长袖'
  if (temp < 25) return '适合T恤、衬衫'
  return '适合短袖、短裤'
}

// 获取当前天气
export async function getCurrentWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY || process.env.WEATHER_API_KEY

    if (!apiKey) {
      console.warn('Weather API key not configured')
      return null
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=zh_cn`,
      { next: { revalidate: 1800 } } // 缓存30分钟
    )

    if (!response.ok) {
      console.error('Weather API error:', response.status)
      return null
    }

    const data = await response.json()

    return {
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].main,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
    }
  } catch (error) {
    console.error('Failed to fetch weather:', error)
    return null
  }
}

// 获取7天预报
export async function getWeeklyForecast(lat: number, lon: number): Promise<ForecastDay[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY || process.env.WEATHER_API_KEY

    if (!apiKey) {
      console.warn('Weather API key not configured')
      return []
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=zh_cn`,
      { next: { revalidate: 3600 } } // 缓存1小时
    )

    if (!response.ok) {
      console.error('Forecast API error:', response.status)
      return []
    }

    const data = await response.json()

    // 处理数据，获取每天的预报（每3小时一次，取中午12点的数据）
    const dailyForecasts: ForecastDay[] = []
    const processedDates = new Set<string>()

    data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000)
      const dateStr = date.toISOString().split('T')[0]

      // 只取每天12点的数据
      if (date.getHours() === 12 && !processedDates.has(dateStr) && dailyForecasts.length < 7) {
        processedDates.add(dateStr)
        dailyForecasts.push({
          date: dateStr,
          temperature: {
            min: Math.round(item.main.temp_min),
            max: Math.round(item.main.temp_max),
          },
          condition: item.weather[0].main,
          icon: item.weather[0].icon,
        })
      }
    })

    return dailyForecasts
  } catch (error) {
    console.error('Failed to fetch forecast:', error)
    return []
  }
}

// 天气图标映射到emoji
export function getWeatherEmoji(icon: string): string {
  const iconMap: Record<string, string> = {
    '01d': '☀️', // 晴天
    '01n': '🌙', // 晴夜
    '02d': '⛅', // 多云
    '02n': '☁️',
    '03d': '☁️', // 云
    '03n': '☁️',
    '04d': '☁️', // 阴天
    '04n': '☁️',
    '09d': '🌧️', // 小雨
    '09n': '🌧️',
    '10d': '🌦️', // 雨
    '10n': '🌧️',
    '11d': '⛈️', // 雷雨
    '11n': '⛈️',
    '13d': '❄️', // 雪
    '13n': '❄️',
    '50d': '🌫️', // 雾
    '50n': '🌫️',
  }
  return iconMap[icon] || '🌤️'
}
