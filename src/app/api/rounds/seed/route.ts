import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { computeRoundStats } from '@/lib/rounds-storage';
import { getDemoRoundState } from '@/lib/demo-round';

/** Replaces all rounds for the current user with 10 new demo rounds (68–80 scores). */
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServer();
    // Remove existing rounds so we replace with the new demo set
    const { error: deleteError } = await supabase
      .from('rounds')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Supabase rounds delete error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const rows = [];
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    for (let i = 0; i < 10; i++) {
      const roundState = getDemoRoundState(i);
      const { totalScore, totalSG } = computeRoundStats(roundState);
      // Oldest round 9 days ago, newest today
      const created_at = new Date(now - (9 - i) * oneDayMs).toISOString();
      rows.push({
        user_id: userId,
        total_score: totalScore,
        total_sg: totalSG,
        round_state: roundState,
        created_at,
      });
    }

    const { error } = await supabase.from('rounds').insert(rows);

    if (error) {
      console.error('Supabase rounds seed error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, count: 10 });
  } catch (e) {
    console.error('Rounds seed API error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
