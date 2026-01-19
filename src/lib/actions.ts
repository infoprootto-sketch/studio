'use server';

import { z } from 'zod';
import { getLocalRecommendations } from '@/ai/flows/ai-powered-local-exploration';
import { extractMenuItems } from '@/ai/flows/extract-menu-items-flow';
import type { LocalRecommendationsOutput } from '@/ai/flows/ai-powered-local-exploration';
import type { ExtractMenuItemsOutput } from '@/ai/flows/extract-menu-items-flow';

// State for Local Recommendations
export interface LocalExplorerState {
  formState: 'initial' | 'loading' | 'success' | 'error';
  message: string;
  data: LocalRecommendationsOutput | null;
}

const localExplorerSchema = z.object({
  preferences: z.string().min(10, 'Preferences must be at least 10 characters'),
});

export async function handleGetLocalRecommendations(
  prevState: LocalExplorerState,
  formData: FormData
): Promise<LocalExplorerState> {
  const validatedFields = localExplorerSchema.safeParse({
    preferences: formData.get('preferences'),
  });

  if (!validatedFields.success) {
    return {
      formState: 'error',
      message: validatedFields.error.flatten().fieldErrors.preferences?.[0] || 'Invalid input.',
      data: null,
    };
  }

  try {
    // A mock location is used as we don't have access to the user's live location.
    const result = await getLocalRecommendations({
      ...validatedFields.data,
      currentLocation: 'San Francisco, CA'
    });
    return {
      formState: 'success',
      message: 'Recommendations found!',
      data: result,
    };
  } catch (error) {
    return {
      formState: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred.',
      data: null,
    };
  }
}

// State for Menu Item Extraction
export interface MenuExtractorState {
  formState: 'initial' | 'loading' | 'success' | 'error';
  message: string;
  data: ExtractMenuItemsOutput | null;
}

// Helper to convert file to data URI
async function fileToDataUri(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return `data:${file.type};base64,${buffer.toString('base64')}`;
}

export async function handleExtractMenuItems(
  prevState: MenuExtractorState,
  formData: FormData
): Promise<MenuExtractorState> {
    
  const menuImage = formData.get('menuImage');
  if (!(menuImage instanceof File) || menuImage.size === 0) {
    return {
      formState: 'error',
      message: 'Please upload a valid menu image.',
      data: null,
    };
  }

  try {
    const menuImageUri = await fileToDataUri(menuImage);
    const result = await extractMenuItems({ menuImageUri });

    return {
      formState: 'success',
      message: 'Successfully extracted menu items.',
      data: result,
    };
  } catch (error) {
    console.error('Menu extraction error:', error);
    return {
      formState: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred during extraction.',
      data: null,
    };
  }
}
