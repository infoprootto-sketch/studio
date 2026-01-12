import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Row,
  Column,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { BilledOrder } from '@/lib/types';
import { Currency } from '@/lib/countries-currencies';

interface InvoiceEmailProps {
  clientName: string;
  orders: BilledOrder[];
  hotelDetails: {
    legalName: string;
    address: string;
  };
  currency: Currency;
}

const formatPrice = (price: number, currency: Currency) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.code,
    }).format(price);
};

export const InvoiceEmail = ({ clientName, orders, hotelDetails, currency }: InvoiceEmailProps) => {
    const totalAmount = orders.reduce((sum, order) => sum + order.amount, 0);

    return (
        <Html>
        <Head />
        <Preview>Your Invoice from {hotelDetails.legalName}</Preview>
        <Body style={main}>
            <Container style={container}>
            <Heading style={heading}>Invoice Summary</Heading>
            <Text style={paragraph}>Dear {clientName},</Text>
            <Text style={paragraph}>
                Please find attached the invoice summary for your recent stays with {hotelDetails.legalName}.
            </Text>
            
            <Section style={table}>
                <Row style={tableHeader}>
                    <Column>Guest Name</Column>
                    <Column>Room</Column>
                    <Column style={textRight}>Amount</Column>
                </Row>
                {orders.map((order) => (
                    <Row key={order.id} style={tableRow}>
                        <Column>{order.guestName}</Column>
                        <Column>{order.roomNumber}</Column>
                        <Column style={textRight}>{formatPrice(order.amount, currency)}</Column>
                    </Row>
                ))}
            </Section>

            <Hr style={hr} />

            <Row style={totalRow}>
                <Column style={totalLabel}>Total Amount</Column>
                <Column style={{ ...textRight, ...totalAmountStyle }}>
                    {formatPrice(totalAmount, currency)}
                </Column>
            </Row>

            <Hr style={hr} />

            <Text style={paragraph}>
                Thank you for your business. We look forward to welcoming you and your guests back soon.
            </Text>
            <Text style={footer}>
                {hotelDetails.legalName} | {hotelDetails.address}
            </Text>
            </Container>
        </Body>
        </Html>
    );
};

export default InvoiceEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  border: '1px solid #f0f0f0',
  borderRadius: '4px',
};

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  marginTop: '48px',
  textAlign: 'center' as const,
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  padding: '0 20px',
};

const table = {
  width: '100%',
  padding: '0 20px',
  marginTop: '32px',
};

const tableHeader = {
  fontWeight: 'bold',
  fontSize: '12px',
  color: '#999',
  borderBottom: '1px solid #eaeaea',
  paddingBottom: '8px',
};

const tableRow = {
  fontSize: '14px',
  lineHeight: '24px',
};

const hr = {
  borderColor: '#eaeaea',
  margin: '20px 0',
};

const textRight = {
  textAlign: 'right' as const,
};

const totalRow = {
    padding: '0 20px',
    fontWeight: 'bold',
};

const totalLabel = {
    fontSize: '16px',
};

const totalAmountStyle = {
    fontSize: '18px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  marginTop: '32px',
};
