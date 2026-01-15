// app/api/leaderboard/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient' 
export async function GET() {
  // Fetch top 20 scores, sorted by highest score
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .order('score', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  
  // Save the new score to Supabase
  const { data, error } = await supabase
    .from('scores')
    .insert([{ 
      name: body.name, 
      score: body.score 
    }])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}