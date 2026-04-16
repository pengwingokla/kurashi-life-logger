import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// iOS Shortcut hits this endpoint with a simple POST
// Accepts: { matcha_name?: string, grams?: number }
// Falls back to default matcha + 3g if nothing provided
export async function POST(request: Request) {
  let matcha_id: string | null = null
  let grams = 3

  try {
    const body = await request.json()
    if (body.grams) grams = Number(body.grams)

    if (body.matcha_name) {
      // Match by name (case-insensitive, partial match)
      const { data } = await supabase
        .from('matcha_collection')
        .select('id')
        .ilike('name', `%${body.matcha_name}%`)
        .limit(1)
        .single()
      matcha_id = data?.id ?? null
    } else if (body.matcha_id) {
      matcha_id = body.matcha_id
    }
  } catch {
    // Empty body is fine — use defaults
  }

  // Fall back to default matcha
  if (!matcha_id) {
    const { data } = await supabase
      .from('matcha_collection')
      .select('id')
      .eq('is_default', true)
      .single()
    matcha_id = data?.id ?? null
  }

  const { data, error } = await supabase
    .from('matcha_logs')
    .insert({ matcha_id, grams, logged_at: new Date().toISOString() })
    .select('*, matcha_collection(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    message: `Logged ${data.grams}g of ${data.matcha_collection?.name ?? 'matcha'}`,
    log: data,
  }, { status: 201 })
}
