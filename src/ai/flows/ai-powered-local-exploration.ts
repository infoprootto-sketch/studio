'use server';

/**
 * @fileOverview Provides personalized recommendations for nearby points of interest based on user preferences and current location.
 *
 * - `getLocalRecommendations` - A function that retrieves personalized local recommendations.
 * - `LocalRecommendationsInput` - The input type for the `getLocalRecommendations` function.
 * - `LocalRecommendationsOutput` - The return type for the `getLocalRecommendations` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LocalRecommendationsInputSchema = z.object({
  preferences: z
    .string()
    .describe('The preferences of the guest, such as cuisine, activities, and interests.'),
  currentLocation: z
    .string()
    .describe('The current location of the guest, including latitude and longitude.'),
});
export type LocalRecommendationsInput = z.infer<typeof LocalRecommendationsInputSchema>;

const LocalRecommendationsOutputSchema = z.object({
  recommendations: z
    .string()
    .describe('A list of personalized recommendations for nearby points of interest.'),
});
export type LocalRecommendationsOutput = z.infer<typeof LocalRecommendationsOutputSchema>;

export async function getLocalRecommendations(
  input: LocalRecommendationsInput
): Promise<LocalRecommendationsOutput> {
  return localRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'localRecommendationsPrompt',
  model: 'googleai/gemini-pro',
  input: {schema: LocalRecommendationsInputSchema},
  output: {schema: LocalRecommendationsOutputSchema},
  prompt: `You are a local expert providing personalized recommendations to hotel guests.

  Based on the guest's preferences and current location, suggest nearby points of interest.

  Preferences: {{{preferences}}}
  Current Location: {{{currentLocation}}}

  Provide a detailed list of recommendations, including the name of the place, a brief description, and why it matches the guest's preferences.`,
});

const localRecommendationsFlow = ai.defineFlow(
  {
    name: 'localRecommendationsFlow',
    inputSchema: LocalRecommendationsInputSchema,
    outputSchema: LocalRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
