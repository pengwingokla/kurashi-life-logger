import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { error } = await supabase.from('matcha_logs').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { grams, matcha_id, notes, logged_at } = body

  const updates: Record<string, unknown> = {}
  if (grams !== undefined) updates.grams = grams
  if (matcha_id !== undefined) updates.matcha_id = matcha_id
  if (notes !== undefined) updates.notes = notes
  if (logged_at !== undefined) updates.logged_at = logged_at

  const { data, error } = await supabase
    .from('matcha_logs')
    .update(updates)
    .eq('id', id)
    .select('*, matcha_collection(id, name, brand, grade)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
