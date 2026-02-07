import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { computeRoundStats } from '@/lib/rounds-storage';
import type { RoundState } from '@/lib/types';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('rounds')
      .select('id, created_at, total_score, total_sg, round_state')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Supabase rounds GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rounds = (data ?? []).map((row) => ({
      date: row.created_at,
      totalScore: row.total_score,
      totalSG: row.total_sg,
      roundState: row.round_state as RoundState,
    }));

    return NextResponse.json(rounds);
  } catch (e) {
    console.error('Rounds API GET error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roundState = (await request.json()) as RoundState;
    const { totalScore, totalSG } = computeRoundStats(roundState);

    const supabase = getSupabaseServer();
    const { error } = await supabase.from('rounds').insert({
      user_id: userId,
      total_score: totalScore,
      total_sg: totalSG,
      round_state: roundState,
    });

    if (error) {
      console.error('Supabase rounds POST error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Rounds API POST error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
