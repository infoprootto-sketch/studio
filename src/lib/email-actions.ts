'use server';

import { z } from 'zod';
import { Resend } from 'resend';
import { InvoiceEmail } from '@/emails/invoice-email';
import type { CorporateClient, BilledOrder } from './types';
import { Country, countries, allCurrencies } from './countries-currencies';

const EmailSchema = z.object({
  to: z.string().email(),
  cc: z.string().optional(),
  clientName: z.string(),
  orders: z.array(z.any()), // Simplified for server action
  hotelDetails: z.object({
      legalName: z.string(),
      address: z.string(),
  }),
  currencyCode: z.string(),
});

export type EmailState = {
  status: 'initial' | 'sending' | 'success' | 'error';
  message: string;
};

export async function sendInvoiceEmail(
  prevState: EmailState,
  formData: FormData
): Promise<EmailState> {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const ordersData = formData.get('orders');
  const hotelDetailsData = formData.get('hotelDetails');

  const validatedFields = EmailSchema.safeParse({
    to: formData.get('to'),
    cc: formData.get('cc'),
    clientName: formData.get('clientName'),
    orders: ordersData ? JSON.parse(ordersData as string) : [],
    hotelDetails: hotelDetailsData ? JSON.parse(hotelDetailsData as string) : {},
    currencyCode: formData.get('currencyCode'),
  });

  if (!validatedFields.success) {
    return {
      status: 'error',
      message: 'Invalid data provided. Please check the fields and try again.',
    };
  }

  const { to, cc, clientName, orders, hotelDetails, currencyCode } = validatedFields.data;
  
  const currency = allCurrencies[currencyCode] || allCurrencies['USD'];

  try {
    const { data, error } = await resend.emails.send({
      from: 'StayCentral <onboarding@resend.dev>', // Replace with your verified domain
      to: [to],
      cc: cc ? [cc] : undefined,
      subject: `Your Invoices from ${hotelDetails.legalName}`,
      react: InvoiceEmail({
        clientName,
        orders: orders as BilledOrder[],
        hotelDetails,
        currency,
      }) as React.ReactElement,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return { status: 'error', message: error.message };
    }

    return { status: 'success', message: 'Email sent successfully!' };
  } catch (error) {
    console.error("Email Sending Error:", error);
    return {
      status: 'error',
      message: 'An unknown error occurred while sending the email.',
    };
  }
}
