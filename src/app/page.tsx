import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { MatchaLog } from '@/lib/supabase'
import { toETDateKey, todayET } from '@/lib/time'

async function getMatchaStats() {
  const from = new Date()
  from.setDate(from.getDate() - 84)
  const { data } = await supabase
    .from('matcha_logs')
    .select('logged_at, grams')
    .gte('logged_at', from.toISOString())
    .order('logged_at', { ascending: false })

  const logs = (data ?? []) as Pick<MatchaLog, 'logged_at' | 'grams'>[]
  const today = todayET()
  const todayLogs = logs.filter((l) => toETDateKey(new Date(l.logged_at)) === today)

  const loggedDays = new Set(logs.map((l) => toETDateKey(new Date(l.logged_at))))
  let streak = 0
  const now = new Date()
  for (let i = 0; i < 84; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    if (loggedDays.has(toETDateKey(d))) streak++
    else break
  }

  return {
    todayCups: todayLogs.length,
    todayGrams: todayLogs.reduce((s, l) => s + l.grams, 0),
    streak,
  }
}

export default async function HomePage() {
  const { todayCups, todayGrams, streak } = await getMatchaStats()

  const dateLabel = new Date().toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <main className="min-h-screen text-[#1a1008] font-[var(--font-jetbrains)]">
      <div className="max-w-md mx-auto px-4 py-10 flex flex-col gap-6">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1 uppercase tracking-widest">{dateLabel}</p>
        </div>

        {/* Matcha Log module card */}
        <Link href="/matcha" className="block group">
          <div className="washi-card p-5 flex flex-col gap-4 transition-all group-hover:shadow-[6px_6px_0px_#1a1008] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400">Module</p>
                <p className="text-2xl font-bold mt-0.5">Matcha Log</p>
              </div>
              <span className="text-xl font-bold">→</span>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t-2 border-black pt-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400">Today</p>
                <p className="text-3xl font-bold mt-0.5">
                  {todayCups}
                  <span className="text-base font-normal text-gray-400 ml-1">
                    {todayCups === 1 ? 'cup' : 'cups'}
                  </span>
                </p>
                {todayGrams > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">{todayGrams}g total</p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400">Streak</p>
                <p className="text-3xl font-bold mt-0.5">
                  {streak}
                  <span className="text-base font-normal text-gray-400 ml-1">
                    {streak === 1 ? 'day' : 'days'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </Link>

      </div>
    </main>
  )
}
