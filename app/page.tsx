import { DateWeatherHeader } from '@/components/home/DateWeatherHeader'
import { TomorrowPreview } from '@/components/home/TomorrowPreview'
import { TodaysFocus } from '@/components/home/TodaysFocus'
import { RecentFavorites } from '@/components/home/RecentFavorites'
import { UpcomingSchedule } from '@/components/home/UpcomingSchedule'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 日期和天气 */}
      <DateWeatherHeader />

      {/* 明日预告 */}
      <TomorrowPreview />

      {/* 最近收藏的衣服 */}
      <RecentFavorites />

      {/* 今日焦点搭配 */}
      <TodaysFocus />

      {/* 即将到来的日程 */}
      <UpcomingSchedule />
    </div>
  )
}
