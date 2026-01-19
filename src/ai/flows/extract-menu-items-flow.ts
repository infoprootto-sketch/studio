'use server';
/**
 * @fileOverview A flow for extracting menu items from an image.
 *
 * - extractMenuItems - A function that handles the menu item extraction process.
 * - ExtractMenuItemsInput - The input type for the extractMenuItems function.
 * - ExtractMenuItemsOutput - The return type for the extractMenuItems function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PriceVariantSchema = z.object({
  size: z
    .string()
    .describe('The size of the variant (e.g., "Half", "Full", "Standard").'),
  price: z.number().describe('The price of this specific variant.'),
});

const MenuItemSchema = z.object({
  name: z.string().describe('The name of the menu item.'),
  description: z.string().describe('A brief description of the menu item.'),
  category: z
    .string()
    .describe(
      'The category of the menu item (e.g., Appetizer, Main, Dessert).'
    ),
  variants: z
    .array(PriceVariantSchema)
    .describe(
      'An array of price variants. If there is only one price, use "Standard" as the size.'
    ),
});

const ExtractMenuItemsInputSchema = z.object({
  menuImageUri: z
    .string()
    .describe(
      "A photo of a restaurant menu, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractMenuItemsInput = z.infer<typeof ExtractMenuItemsInputSchema>;

const ExtractMenuItemsOutputSchema = z.object({
  menuItems: z
    .array(MenuItemSchema)
    .describe('An array of menu items extracted from the image.'),
});
export type ExtractMenuItemsOutput = z.infer<typeof ExtractMenuItemsOutputSchema>;

export async function extractMenuItems(
  input: ExtractMenuItemsInput
): Promise<ExtractMenuItemsOutput> {
  return extractMenuItemsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractMenuItemsPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: ExtractMenuItemsInputSchema},
  output: {schema: ExtractMenuItemsOutputSchema},
  prompt: `You are an expert data entry specialist for restaurants. Your task is to analyze an image of a menu and extract all the food and beverage items.

  For each item, identify its name, a brief description (if available), and its category (e.g., Appetizers, Soups, Salads, Main Courses, Desserts, Beverages).

  Crucially, you must also identify price variants. If an item has different prices for different sizes (e.g., "Half" and "Full" plates), extract each as a separate variant. If an item has only a single price, treat it as a "Standard" size variant.

  Ensure all prices are converted to a numerical format.

  Here is the menu image: {{media url=menuImageUri}}`,
});

const extractMenuItemsFlow = ai.defineFlow(
  {
    name: 'extractMenuItemsFlow',
    inputSchema: ExtractMenuItemsInputSchema,
    outputSchema: ExtractMenuItemsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
