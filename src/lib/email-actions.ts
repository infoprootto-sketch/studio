'use server';

// This file is temporarily disabled to aid in project stabilization.
// Email functionality can be re-enabled once the core application is running.

export type EmailState = {
  status: 'initial' | 'sending' | 'success' | 'error';
  message: string;
};

export async function sendInvoiceEmail(
  prevState: EmailState,
  formData: FormData
): Promise<EmailState> {
  console.error("Email functionality is temporarily disabled.");
  return {
    status: 'error',
    message: 'Email functionality is temporarily disabled pending project stabilization.',
  };
}
