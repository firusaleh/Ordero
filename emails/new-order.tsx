import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from '@react-email/components'
import * as React from 'react'

interface NewOrderEmailProps {
  orderNumber: string
  tableNumber: number
  items: Array<{ name: string; quantity: number; price: number }>
  total: number
  customerName?: string
  notes?: string
}

export const NewOrderEmail = ({
  orderNumber,
  tableNumber,
  items,
  total,
  customerName,
  notes
}: NewOrderEmailProps) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oriido.de'
  
  return (
    <Html>
      <Head />
      <Preview>Neue Bestellung #{orderNumber} von Tisch {tableNumber.toString()}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={alertBox}>
            <Text style={alertText}>🔔 NEUE BESTELLUNG</Text>
          </Section>

          <Heading style={h1}>
            Bestellung #{orderNumber}
          </Heading>
          
          <Section style={infoSection}>
            <Row>
              <Column>
                <Text style={labelText}>Tisch:</Text>
                <Text style={valueText}>{tableNumber}</Text>
              </Column>
              {customerName && (
                <Column>
                  <Text style={labelText}>Gast:</Text>
                  <Text style={valueText}>{customerName}</Text>
                </Column>
              )}
            </Row>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={sectionTitle}>Bestellte Artikel:</Text>
            <table style={table}>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td style={tableCell}>
                      <strong>{item.quantity}x</strong>
                    </td>
                    <td style={tableCellMain}>
                      {item.name}
                    </td>
                    <td style={tableCellPrice}>
                      €{(item.quantity * item.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section style={totalSection}>
            <Text style={totalLabel}>Gesamtsumme:</Text>
            <Text style={totalAmount}>€{total.toFixed(2)}</Text>
          </Section>

          {notes && (
            <Section style={notesSection}>
              <Text style={notesTitle}>📝 Notizen vom Gast:</Text>
              <Text style={notesText}>{notes}</Text>
            </Section>
          )}

          <Section style={buttonSection}>
            <Button style={button} href={`${appUrl}/dashboard/orders`}>
              Bestellung im Dashboard ansehen →
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Diese E-Mail wurde automatisch von Oriido gesendet.<br />
            Bitte antworten Sie nicht auf diese E-Mail.
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

const alertBox = {
  backgroundColor: '#fbbf24',
  borderRadius: '6px',
  padding: '12px',
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const alertText = {
  color: '#000',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '20px 0',
}

const infoSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '6px',
  padding: '16px',
  margin: '16px 0',
}

const labelText = {
  fontSize: '12px',
  color: '#666',
  margin: '0',
  textTransform: 'uppercase' as const,
}

const valueText = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#333',
  margin: '4px 0',
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
  padding: '8px 12px',
  fontSize: '14px',
  color: '#666',
  borderBottom: '1px solid #e5e7eb',
  width: '60px',
}

const tableCellMain = {
  padding: '8px 12px',
  fontSize: '14px',
  color: '#333',
  borderBottom: '1px solid #e5e7eb',
}

const tableCellPrice = {
  padding: '8px 12px',
  fontSize: '14px',
  color: '#333',
  borderBottom: '1px solid #e5e7eb',
  textAlign: 'right' as const,
  fontWeight: 'bold',
}

const totalSection = {
  backgroundColor: '#f0f9ff',
  borderRadius: '6px',
  padding: '16px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const totalLabel = {
  fontSize: '14px',
  color: '#666',
  margin: '0',
}

const totalAmount = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#10b981',
  margin: '8px 0',
}

const notesSection = {
  backgroundColor: '#fffbeb',
  borderRadius: '6px',
  padding: '16px',
  margin: '16px 0',
}

const notesTitle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#92400e',
  marginBottom: '8px',
}

const notesText = {
  fontSize: '14px',
  color: '#78350f',
  margin: '0',
  fontStyle: 'italic',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
}

export default NewOrderEmail