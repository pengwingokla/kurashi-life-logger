import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { MatchaLog } from '@/lib/supabase'
import MatchaDashboard from './MatchaDashboard'
import TopBar from '@/components/TopBar'

export default async function MatchaPage() {
  const from = new Date()
  from.setDate(from.getDate() - 90)

  const [{ data: logsData }, { data: collectionData }] = await Promise.all([
    supabase
      .from('matcha_logs')
      .select('*, matcha_collection(id, name, brand, grade)')
      .gte('logged_at', from.toISOString())
      .order('logged_at', { ascending: false }),
    supabase
      .from('matcha_collection')
      .select('id, name, brand, grade'),
  ])

  const logs = (logsData as MatchaLog[]) ?? []
  const collection = collectionData ?? []

  return (
    <main className="min-h-screen text-[#1a1008] font-[var(--font-jetbrains)]">
      <div className="max-w-md mx-auto px-4 py-8 flex flex-col gap-6">

        <TopBar
          title="Matcha Log"
          left={
            <Link href="/" className="text-sm text-gray-500 hover:text-black transition-colors">
              ‹ Home
            </Link>
          }
          right={
            <Link href="/settings" className="hover:opacity-60 transition-opacity">
              <img src="/icons/setting-2.svg" alt="Settings" className="w-5 h-5" />
            </Link>
          }
        />

        <MatchaDashboard logs={logs} collection={collection} />
      </div>
    </main>
  )
}
