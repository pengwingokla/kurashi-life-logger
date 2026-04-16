import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import StreakHeatmap from '@/components/StreakHeatmap'
import { MatchaLog } from '@/lib/supabase'
import { toETDateKey, todayET, formatTimeET } from '@/lib/time'

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
  const loggedDays = new Set(logs.map((l) => toETDateKey(new Date(l.logged_at))))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 84; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (loggedDays.has(toETDateKey(d))) streak++
    else break
  }
  return streak
}

function getTodayLogs(logs: MatchaLog[]): MatchaLog[] {
  const today = todayET()
  return logs.filter((l) => toETDateKey(new Date(l.logged_at)) === today)
}

export default async function MatchaPage() {
  const logs = await getLogs()
  const streak = calcStreak(logs)
  const todayLogs = getTodayLogs(logs)
  const todayGrams = todayLogs.reduce((sum, l) => sum + l.grams, 0)

  return (
    <main className="min-h-screen text-[#1a1008] font-[var(--font-jetbrains)]">
      <div className="max-w-md mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm border-2 border-black rounded-full px-3 py-1 hover:bg-black hover:text-white transition-colors"
            >
              ← Home
            </Link>
            <h1 className="text-3xl font-bold">Matcha Log</h1>
          </div>
          <Link
            href="/settings"
            className="text-sm border-2 border-black rounded-full px-3 py-1 hover:bg-black hover:text-white transition-colors"
          >
            Settings
          </Link>
        </div>

        {/* Heatmap */}
        <div className="washi-card p-4 overflow-x-auto">
          <StreakHeatmap logs={logs} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="washi-card p-4">
            <p className="text-xs uppercase tracking-widest text-gray-400">Today</p>
            <p className="text-4xl font-bold mt-1">
              {todayLogs.length}
              <span className="text-lg font-normal text-gray-400 ml-1">
                {todayLogs.length === 1 ? 'cup' : 'cups'}
              </span>
            </p>
            {todayGrams > 0 && (
              <p className="text-sm text-gray-400 mt-1">{todayGrams}g total</p>
            )}
          </div>
          <div className="washi-card p-4">
            <p className="text-xs uppercase tracking-widest text-gray-400">Streak</p>
            <p className="text-4xl font-bold mt-1">
              {streak}
              <span className="text-lg font-normal text-gray-400 ml-1">
                {streak === 1 ? 'day' : 'days'}
              </span>
            </p>
          </div>
        </div>

        {/* Log button */}
        <Link
          href="/log"
          className="bg-black text-white text-center font-bold text-xl py-4 rounded-full border-2 border-black shadow-[4px_4px_0px_#666] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
        >
          + Log Matcha
        </Link>

        {/* Today's logs */}
        {todayLogs.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-widest text-gray-400">Today&apos;s logs</p>
            {todayLogs.map((log) => (
              <div
                key={log.id}
                className="washi-card px-4 py-3 flex justify-between items-center"
              >
                <div>
                  <p className="text-lg font-semibold">
                    {log.matcha_collection?.name ?? 'Unknown matcha'}
                  </p>
                  {log.notes && (
                    <p className="text-sm text-gray-400">{log.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{log.grams}g</p>
                  <p className="text-sm text-gray-400">{formatTimeET(log.logged_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
