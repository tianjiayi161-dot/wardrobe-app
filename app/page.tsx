import { DateWeatherHeader } from '@/components/home/DateWeatherHeader'
import { TodaysFocus } from '@/components/home/TodaysFocus'
import { RecentFavorites } from '@/components/home/RecentFavorites'
import { UpcomingSchedule } from '@/components/home/UpcomingSchedule'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 日期和天气 */}
      <DateWeatherHeader />

      {/* 即将到来 */}
      <UpcomingSchedule />

      {/* 最近收藏的衣服 */}
      <RecentFavorites />

      {/* 今日焦点搭配 */}
      <TodaysFocus />

      
    </div>
  )
}
