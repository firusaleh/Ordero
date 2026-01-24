import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'
// Email templates use static translations, not hooks

interface OrderConfirmationEmailProps {
  orderNumber: string
  restaurantName: string
  tableNumber: number
  items: Array<{ name: string; quantity: number; price: number }>
  subtotal: number
  tax: number
  total: number
}

export const OrderConfirmationEmail = ({
  orderNumber,
  restaurantName,
  tableNumber,
  items,
  subtotal,
  tax,
  total
}: OrderConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Ihre Bestellung #{orderNumber} bei {restaurantName} wurde aufgegeben</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={successBox}>
            <Text style={successIcon}>✅</Text>
            <Text style={successText}>Bestellung erfolgreich aufgegeben!</Text>
          </Section>

          <Heading style={h1}>
            {restaurantName}
          </Heading>
          
          <Text style={orderInfo}>
            Bestellnummer: <strong>#{orderNumber}</strong><br />
            Tisch: <strong>{tableNumber}</strong>
          </Text>

          <Hr style={hr} />

          <Section>
            <Text style={sectionTitle}>Ihre Bestellung:</Text>
            <table style={table}>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td style={tableCell}>
                      {item.quantity}x {item.name}
                    </td>
                    <td style={tableCellPrice}>
                      €{(item.quantity * item.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Hr style={hr} />

          <Section>
            <table style={summaryTable}>
              <tbody>
                <tr>
                  <td style={summaryLabel}>Zwischensumme:</td>
                  <td style={summaryValue}>€{subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={summaryLabel}>MwSt. (19%):</td>
                  <td style={summaryValue}>€{tax.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={totalLabel}>Gesamtsumme:</td>
                  <td style={totalValue}>€{total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section style={infoBox}>
            <Text style={infoTitle}>Was passiert als Nächstes?</Text>
            <Text style={infoText}>
              Das Restaurant bestätigt Ihre Bestellung<br />
              Ihre Bestellung wird zubereitet<br />
              Sie erhalten eine Benachrichtigung, wenn Ihre Bestellung fertig ist
            </Text>
          </Section>

          <Text style={footer}>
            Vielen Dank für Ihre Bestellung!<br />
            {restaurantName}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
}

const successBox = {
  backgroundColor: '#d1fae5',
  borderRadius: '6px',
  padding: '16px',
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const successIcon = {
  fontSize: '32px',
  margin: '0',
}

const successText = {
  color: '#065f46',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '8px 0 0 0',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '20px 0 12px 0',
}

const orderInfo = {
  fontSize: '14px',
  color: '#666',
  textAlign: 'center' as const,
  lineHeight: '24px',
  margin: '0 0 24px 0',
}

const sectionTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#333',
  marginBottom: '12px',
}

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
}

const tableCell = {
  padding: '8px 0',
  fontSize: '14px',
  color: '#333',
  borderBottom: '1px solid #e5e7eb',
}

const tableCellPrice = {
  padding: '8px 0',
  fontSize: '14px',
  color: '#333',
  borderBottom: '1px solid #e5e7eb',
  textAlign: 'right' as const,
}

const summaryTable = {
  width: '100%',
  marginTop: '16px',
}

const summaryLabel = {
  padding: '4px 0',
  fontSize: '14px',
  color: '#666',
  textAlign: 'right' as const,
  paddingRight: '16px',
}

const summaryValue = {
  padding: '4px 0',
  fontSize: '14px',
  color: '#333',
  textAlign: 'right' as const,
}

const totalLabel = {
  padding: '8px 0',
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#333',
  textAlign: 'right' as const,
  paddingRight: '16px',
  borderTop: '2px solid #e5e7eb',
}

const totalValue = {
  padding: '8px 0',
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#10b981',
  textAlign: 'right' as const,
  borderTop: '2px solid #e5e7eb',
}

const infoBox = {
  backgroundColor: '#f0f9ff',
  borderRadius: '6px',
  padding: '16px',
  margin: '24px 0',
}

const infoTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#0369a1',
  marginBottom: '8px',
}

const infoText = {
  fontSize: '13px',
  color: '#0c4a6e',
  lineHeight: '20px',
  margin: '0',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '24px 0',
}

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  textAlign: 'center' as const,
  marginTop: '32px',
}

export default OrderConfirmationEmail