
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {nextJs} from '@genkit-ai/next/plugin';

export const ai = genkit({
  plugins: [
    nextJs(),
    googleAI(),
  ],
  model: 'googleai/gemini-pro',
});
