import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Free tier: get an API key at https://aistudio.google.com/app/apikey
const geminiApiKey = process.env.GEMINI_API_KEY;

export const ai = genkit({
  plugins: [
    googleAI(
      geminiApiKey ? {apiKey: geminiApiKey} : undefined,
    ),
  ],
  model: 'googleai/gemini-2.5-flash',
});
