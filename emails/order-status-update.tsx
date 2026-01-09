import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface OrderStatusUpdateEmailProps {
  orderNumber: string
  restaurantName: string
  status: 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
  statusText: string
  estimatedTime?: number
}

export const OrderStatusUpdateEmail = ({
  orderNumber,
  restaurantName,
  status,
  statusText,
  estimatedTime
}: OrderStatusUpdateEmailProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'CONFIRMED': return '#3b82f6'
      case 'PREPARING': return '#f59e0b'
      case 'READY': return '#10b981'
      case 'DELIVERED': return '#6b7280'
      case 'CANCELLED': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'CONFIRMED': return '✓'
      case 'PREPARING': return '👨‍🍳'
      case 'READY': return '🔔'
      case 'DELIVERED': return '✅'
      case 'CANCELLED': return '❌'
      default: return '📋'
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'CONFIRMED':
        return 'Ihre Bestellung wurde vom Restaurant bestätigt und wird nun vorbereitet.'
      case 'PREPARING':
        return 'Ihre Bestellung wird gerade zubereitet. Nicht mehr lange!'
      case 'READY':
        return 'Ihre Bestellung ist fertig und wird gleich serviert!'
      case 'DELIVERED':
        return 'Ihre Bestellung wurde serviert. Guten Appetit!'
      case 'CANCELLED':
        return 'Ihre Bestellung wurde leider storniert. Bei Fragen wenden Sie sich bitte an das Personal.'
      default:
        return 'Der Status Ihrer Bestellung wurde aktualisiert.'
    }
  }

  return (
    <Html>
      <Head />
      <Preview>Bestellung #{orderNumber} {statusText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{
            ...statusBox,
            backgroundColor: `${getStatusColor()}15`,
            borderColor: getStatusColor()
          }}>
            <Text style={statusIcon}>{getStatusIcon()}</Text>
            <Text style={{
              ...statusTextStyle,
              color: getStatusColor()
            }}>
              Bestellung {statusText}
            </Text>
          </Section>

          <Heading style={h1}>
            {restaurantName}
          </Heading>
          
          <Text style={orderInfo}>
            Bestellnummer: <strong>#{orderNumber}</strong>
          </Text>

          <Section style={messageBox}>
            <Text style={message}>
              {getStatusMessage()}
            </Text>
            
            {estimatedTime && status === 'PREPARING' && (
              <Text style={timeEstimate}>
                ⏱ Geschätzte Zeit: {estimatedTime} Minuten
              </Text>
            )}
          </Section>

          {status === 'READY' && (
            <Section style={alertBox}>
              <Text style={alertText}>
                🔔 Ihre Bestellung ist abholbereit!
              </Text>
            </Section>
          )}

          <Text style={footer}>
            Diese E-Mail wurde automatisch von Oriido gesendet.<br />
            Bei Fragen wenden Sie sich bitte an das Restaurant-Personal.
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

const statusBox = {
  borderRadius: '6px',
  padding: '16px',
  textAlign: 'center' as const,
  marginBottom: '24px',
  border: '2px solid',
}

const statusIcon = {
  fontSize: '32px',
  margin: '0',
}

const statusTextStyle = {
  fontSize: '18px',
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
  margin: '0 0 24px 0',
}

const messageBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '6px',
  padding: '20px',
  margin: '24px 0',
}

const message = {
  fontSize: '16px',
  color: '#333',
  lineHeight: '24px',
  margin: '0',
}

const timeEstimate = {
  fontSize: '14px',
  color: '#666',
  marginTop: '12px',
  fontWeight: 'bold',
}

const alertBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '6px',
  padding: '16px',
  textAlign: 'center' as const,
  marginBottom: '24px',
  border: '2px solid #fbbf24',
}

const alertText = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  marginTop: '32px',
}

export default OrderStatusUpdateEmail