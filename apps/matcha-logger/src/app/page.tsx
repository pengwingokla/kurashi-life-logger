import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import StreakHeatmap from '@/components/StreakHeatmap'
import { MatchaLog } from '@/lib/supabase'

async function getLogs(): Promise<MatchaLog[]> {
  const from = new Date()
  from.setDate(from.getDate() - 84)

  const { data } = await supabase
    .from('matcha_logs')
    .select('*, matcha_collection(id, name, brand, grade)')
    .gte('logged_at', from.toISOString())
    .order('logged_at', { ascending: false })

  return (data as MatchaLog[]) ?? []
}

function calcStreak(logs: MatchaLog[]): number {
  const loggedDays = new Set(
    logs.map((l) => new Date(l.logged_at).toISOString().split('T')[0])
  )
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 84; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    if (loggedDays.has(key)) streak++
    else break
  }
  return streak
}

function getTodayLogs(logs: MatchaLog[]): MatchaLog[] {
  const today = new Date().toISOString().split('T')[0]
  return logs.filter(
    (l) => new Date(l.logged_at).toISOString().split('T')[0] === today
  )
}

export default async function Home() {
  const logs = await getLogs()
  const streak = calcStreak(logs)
  const todayLogs = getTodayLogs(logs)
  const todayGrams = todayLogs.reduce((sum, l) => sum + l.grams, 0)

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100">
      <div className="max-w-md mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Matcha Log</h1>
          <Link href="/settings" className="text-stone-400 hover:text-stone-600 text-sm">
            Settings
          </Link>
        </div>

        {/* Heatmap */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm overflow-x-auto">
          <StreakHeatmap logs={logs} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-stone-400 uppercase tracking-wide">Today</p>
            <p className="text-2xl font-bold mt-1">
              {todayLogs.length}{' '}
              <span className="text-sm font-normal text-stone-400">
                {todayLogs.length === 1 ? 'cup' : 'cups'}
              </span>
            </p>
            {todayGrams > 0 && (
              <p className="text-xs text-stone-400 mt-1">{todayGrams}g total</p>
            )}
          </div>
          <div className="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-stone-400 uppercase tracking-wide">Streak</p>
            <p className="text-2xl font-bold mt-1">
              {streak}{' '}
              <span className="text-sm font-normal text-stone-400">
                {streak === 1 ? 'day' : 'days'}
              </span>
            </p>
          </div>
        </div>

        {/* Log button */}
        <Link
          href="/log"
          className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-center font-semibold py-4 rounded-2xl transition-colors shadow-sm"
        >
          + Log Matcha
        </Link>

        {/* Today's logs */}
        {todayLogs.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-stone-400 uppercase tracking-wide">Today</p>
            {todayLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white dark:bg-stone-800 rounded-xl px-4 py-3 shadow-sm flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-medium">
                    {log.matcha_collection?.name ?? 'Unknown matcha'}
                  </p>
                  {log.notes && (
                    <p className="text-xs text-stone-400 mt-0.5">{log.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{log.grams}g</p>
                  <p className="text-xs text-stone-400">
                    {new Date(log.logged_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
