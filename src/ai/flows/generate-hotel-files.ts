'use server';

/**
 * @fileOverview A flow for generating hotel configuration files based on Hotel ID and preferences.
 *
 * - generateHotelFiles - A function that triggers the file generation process.
 * - GenerateHotelFilesInput - The input type for the generateHotelFiles function, including the Hotel ID.
 * - GenerateHotelFilesOutput - The return type for the generateHotelFiles function, containing the generated file configurations.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHotelFilesInputSchema = z.object({
  hotelId: z.string().describe('The unique identifier for the hotel.'),
  preferences: z
    .string()
    .describe(
      'Specific preferences for the hotel, influencing the content of the configuration files.'
    ),
});
export type GenerateHotelFilesInput = z.infer<typeof GenerateHotelFilesInputSchema>;

const GenerateHotelFilesOutputSchema = z.object({
  roomsConfig: z.string().describe('Configuration file content for rooms.'),
  foodAndBeverageConfig: z.string().describe('Configuration file content for food and beverage.'),
  maintenanceConfig: z.string().describe('Configuration file content for maintenance.'),
  teamConfig: z.string().describe('Configuration file content for the team.'),
});
export type GenerateHotelFilesOutput = z.infer<typeof GenerateHotelFilesOutputSchema>;

export async function generateHotelFiles(input: GenerateHotelFilesInput): Promise<GenerateHotelFilesOutput> {
  return generateHotelFilesFlow(input);
}

const generateFilesPrompt = ai.definePrompt({
  name: 'generateFilesPrompt',
  input: {schema: GenerateHotelFilesInputSchema},
  output: {schema: GenerateHotelFilesOutputSchema},
  prompt: `You are a configuration file generation expert for hotel management systems.

  Based on the Hotel ID: {{{hotelId}}} and the following preferences: {{{preferences}}},
  generate configuration file content for Rooms, Food & Beverage, Maintenance, and the Team.

  Return the configurations as a JSON object with the keys:
  - roomsConfig
  - foodAndBeverageConfig
  - maintenanceConfig
  - teamConfig`,
});

const generateHotelFilesFlow = ai.defineFlow(
  {
    name: 'generateHotelFilesFlow',
    inputSchema: GenerateHotelFilesInputSchema,
    outputSchema: GenerateHotelFilesOutputSchema,
  },
  async input => {
    const {output} = await generateFilesPrompt(input);
    return output!;
  }
);
