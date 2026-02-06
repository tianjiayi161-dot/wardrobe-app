'use client'

import { useEffect, useState } from 'react'
import { getWeatherEmoji, getClothingAdvice } from '@/lib/weather'
import { User } from 'lucide-react'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'

interface WeatherData {
  temperature: number
  condition: string
  description: string
  icon: string
}

export function DateWeatherHeader() {
  const [date, setDate] = useState<Date>(new Date())
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [loading, setLoading] = useState(true)

  // 更新日期
  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 60000) // 每分钟更新
    return () => clearInterval(timer)
  }, [])

  // 获取地理位置
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Geolocation error:', error)
          // 使用默认位置（北京）
          setLocation({ lat: 39.9042, lon: 116.4074 })
        }
      )
    } else {
      // 浏览器不支持，使用默认位置
      setLocation({ lat: 39.9042, lon: 116.4074 })
    }
  }, [])

  // 获取天气数据
  useEffect(() => {
    if (!location) return

    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `/api/weather?lat=${location.lat}&lon=${location.lon}`
        )
        if (response.ok) {
          const data = await response.json()
          setWeather(data)
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
    // 每30分钟更新一次天气
    const interval = setInterval(fetchWeather, 1800000)
    return () => clearInterval(interval)
  }, [location])

  const formatDate = (d: Date) => {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

    return {
      weekday: weekdays[d.getDay()],
      month: months[d.getMonth()],
      day: d.getDate(),
    }
  }

  const { weekday, month, day } = formatDate(date)

  return (
    <div className="px-4 pt-6 pb-4">
      {/* 顶部标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <BrandLogo className="w-8 h-8" />
          <div>
            <h1 className="text-xl font-bold text-black">vibelog</h1>
            <p className="text-sm text-gray-500">衣序</p>
          </div>
        </div>
        <Link
          href="/account"
          aria-label="账号管理"
          className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-700"
        >
          <User size={18} />
        </Link>
      </div>

      {/* 日期 */}
      <div className="mb-3">
        <h2 className="text-3xl font-bold text-black">
          {month}{day}日
        </h2>
        <p className="text-sm text-gray-600 mt-1">{weekday}</p>
      </div>

      {/* 天气 */}
      {loading ? (
        <div className="flex items-center gap-3 text-gray-400">
          <div className="text-2xl">🌤️</div>
          <div>
            <p className="text-sm">正在和天空对话…</p>
          </div>
        </div>
      ) : weather ? (
        <div className="flex items-center gap-3">
          <div className="text-3xl">
            {getWeatherEmoji(weather.icon)}
          </div>
          <div>
            <p className="text-xl font-semibold text-black">
              {weather.temperature}°C
            </p>
            <p className="text-sm text-gray-600">{weather.description}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-gray-400">
          <div className="text-2xl">🌤️</div>
          <div>
            <p className="text-sm">无法获取天气信息</p>
          </div>
        </div>
      )}

      {/* 穿衣建议 */}
      {weather && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            💡 {getClothingAdvice(weather.temperature, weather.condition)}
          </p>
        </div>
      )}
    </div>
  )
}
