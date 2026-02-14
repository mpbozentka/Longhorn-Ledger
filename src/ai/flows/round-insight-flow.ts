'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';

export type RoundInsightInput = {
  holeByHole: { hole: number; par: number; score: number; strokesGained: number }[];
  strokesGainedByCategory: { Tee: number; Approach: number; 'Short Game': number; Putting: number };
  totalScore: number;
  totalPar: number;
  totalStrokesGained: number;
  puttCount: number;
  onePuttCount: number;
  threePuttCount: number;
  sandShotCount: number;
  puttDistancesFeet: number[];
};

const INSIGHT_STYLE_EXAMPLES = `
Examples of the exact style (short, specific, one sentence, second person):
- "You made every putt from inside 6 feet."
- "You made par on every odd-numbered hole today."
- "You made par on every even-numbered hole today."
- "You birdied or better on every par 3."
- "You went under par on every par 5."
- "All of your putts today started from 10 feet or in."
- "You one-putted 7 greens today."
- "No three-putts this round."
- "You stayed out of the sand all round."
- "Your standout today was off the tee — you gained 1.2 strokes there."
- "You were par or better on every hole on the front nine."
- "You were par or better on every hole on the back nine."
Do NOT give generic advice like "You gained X strokes" or "Your score was Y." Pick one specific, interesting, non-obvious fact that the data supports. If the round is very short or data is thin, give one factual line about score or strokes gained. Reply with only the single insight sentence, no quotes or prefix.`;

export async function generateRoundInsight(data: RoundInsightInput): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) return null;

  const prompt = `You are a golf round insight generator. Your job is to write ONE short, punchy, specific insight about this round in the style of the examples below. Use only the data provided. Be factual. Write in second person ("You ..."). One sentence only.

${INSIGHT_STYLE_EXAMPLES}

Round data (JSON):
${JSON.stringify(data, null, 0)}

Generate exactly one insight sentence:`;

  try {
    const response = await ai.generate({
      prompt,
      model: googleAI.model('gemini-2.5-flash'),
    });
    const text = response?.text?.trim();
    return text && text.length > 0 ? text : null;
  } catch {
    return null;
  }
}
