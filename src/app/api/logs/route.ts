import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = supabase
    .from('matcha_logs')
    .select('*, matcha_collection(id, name, brand, grade)')
    .order('logged_at', { ascending: false })

  if (from) query = query.gte('logged_at', from)
  if (to) query = query.lte('logged_at', to)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { matcha_id, grams, notes, logged_at } = body

  if (!grams) return NextResponse.json({ error: 'grams is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('matcha_logs')
    .insert({
      matcha_id: matcha_id ?? null,
      grams,
      notes: notes ?? null,
      logged_at: logged_at ?? new Date().toISOString(),
    })
    .select('*, matcha_collection(id, name, brand, grade)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
