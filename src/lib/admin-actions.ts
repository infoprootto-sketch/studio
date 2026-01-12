
'use server';

import { getAuth } from 'firebase-admin/auth';
import { initializeAdminApp } from './firebase-admin-init';
import { z } from 'zod';

export interface AdminSetupState {
  status: 'initial' | 'success' | 'error';
  message: string;
}

const SuperAdminSchema = z.object({
  uid: z.string().min(1, { message: 'User UID is required.' }),
});

const FranchiseOwnerSchema = z.object({
  email: z.string().email({ message: 'A valid email is required.' }),
});


export async function setSuperAdminClaim(
  prevState: AdminSetupState,
  formData: FormData
): Promise<AdminSetupState> {
  try {
    initializeAdminApp();
    const validatedFields = SuperAdminSchema.safeParse({ uid: formData.get('uid') });
    if (!validatedFields.success) {
      return { status: 'error', message: 'Invalid UID provided.' };
    }
    await getAuth().setCustomUserClaims(validatedFields.data.uid, { isSuperAdmin: true });
    return { status: 'success', message: `Super Admin role assigned to user ${validatedFields.data.uid}.` };
  } catch (error: any) {
    return { status: 'error', message: error.message || 'An unexpected error occurred.' };
  }
}

export async function setFranchiseOwnerClaim(
  prevState: AdminSetupState,
  formData: FormData
): Promise<AdminSetupState> {
  try {
    initializeAdminApp();
    const validatedFields = FranchiseOwnerSchema.safeParse({ email: formData.get('email') });
    if (!validatedFields.success) {
      return { status: 'error', message: 'Invalid email provided.' };
    }
    
    const { email } = validatedFields.data;
    const user = await getAuth().getUserByEmail(email);

    await getAuth().setCustomUserClaims(user.uid, { isFranchiseOwner: true });
    return { status: 'success', message: `Franchise Owner role assigned to ${email} (UID: ${user.uid}).` };
  } catch (error: any) {
     if (error.code === 'auth/user-not-found') {
        return { status: 'error', message: 'User not found. Please ask them to register first.' };
    }
    return { status: 'error', message: error.message || 'An unexpected error occurred.' };
  }
}
