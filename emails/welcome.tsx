import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface WelcomeEmailProps {
  name: string
  restaurantName: string
  email?: string
  password?: string
  loginUrl?: string
}

export const WelcomeEmail = ({ 
  name, 
  restaurantName,
  email,
  password,
  loginUrl
}: WelcomeEmailProps) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oriido.de'
  const finalLoginUrl = loginUrl || `${appUrl}/login`
  
  return (
    <Html>
      <Head />
      <Preview>Willkommen bei Oriido - Ihr digitales Restaurant ist bereit!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            Willkommen bei Oriido! 🎉
          </Heading>
          
          <Text style={text}>
            Hallo {name},
          </Text>
          
          <Text style={text}>
            Herzlichen Glückwunsch! Ihr Restaurant <strong>{restaurantName}</strong> ist jetzt auf Oriido aktiv
            und bereit für digitale Bestellungen.
          </Text>

          {email && password && (
            <Section style={credentialsBox}>
              <Text style={credentialsTitle}>🔐 Ihre Zugangsdaten:</Text>
              <Text style={credentialsText}>
                <strong>E-Mail:</strong> {email}<br />
                <strong>Passwort:</strong> {password}
              </Text>
              <Text style={warningText}>
                ⚠️ Bitte ändern Sie Ihr Passwort nach der ersten Anmeldung!
              </Text>
            </Section>
          )}

          <Section style={boxSection}>
            <Text style={boxTitle}>🚀 Nächste Schritte:</Text>
            <Text style={boxText}>
              1. ✅ Vervollständigen Sie Ihre Speisekarte<br />
              2. 🎯 Richten Sie Ihre Tische ein<br />
              3. 📱 Drucken Sie die QR-Codes aus<br />
              4. 💰 Optional: Verbinden Sie Ihr Kassensystem
            </Text>
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={finalLoginUrl}>
              Jetzt anmelden →
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footerText}>
            Bei Fragen stehen wir Ihnen gerne zur Verfügung:
          </Text>
          
          <Text style={footerText}>
            📧 E-Mail: <Link href="mailto:support@oriido.de">support@oriido.de</Link><br />
            📚 Dokumentation: <Link href={`${appUrl}/help`}>oriido.de/help</Link>
          </Text>

          <Text style={footer}>
            Mit freundlichen Grüßen<br />
            Ihr Oriido Team
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

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '30px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const boxSection = {
  backgroundColor: '#f4f7ff',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
}

const boxTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#333',
  marginBottom: '12px',
}

const boxText = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#555',
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
  margin: '40px 0',
}

const footerText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  marginTop: '32px',
}

const credentialsBox = {
  backgroundColor: '#fff3cd',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  border: '1px solid #ffc107',
}

const credentialsTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#856404',
  marginBottom: '12px',
}

const credentialsText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#856404',
  fontFamily: 'monospace',
}

const warningText = {
  fontSize: '13px',
  color: '#dc3545',
  marginTop: '12px',
  fontWeight: 'bold',
}

export default WelcomeEmail