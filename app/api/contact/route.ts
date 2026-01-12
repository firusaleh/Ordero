import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const restaurant = formData.get('restaurant') as string
    const tables = formData.get('tables') as string
    const message = formData.get('message') as string

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Oriido Contact Form <onboarding@resend.dev>', // You'll need to verify your domain with Resend to use info@oriido.com
      to: ['info@oriido.com'],
      subject: `New Contact Form Submission from ${firstName} ${lastName}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Restaurant:</strong> ${restaurant}</p>
        <p><strong>Number of Tables:</strong> ${tables || 'Not specified'}</p>
        <p><strong>Message:</strong></p>
        <p>${message || 'No message provided'}</p>
        <hr>
        <p><small>This email was sent from the Oriido contact form.</small></p>
      `,
      text: `
        New Contact Form Submission
        
        Name: ${firstName} ${lastName}
        Email: ${email}
        Phone: ${phone || 'Not provided'}
        Restaurant: ${restaurant}
        Number of Tables: ${tables || 'Not specified'}
        
        Message:
        ${message || 'No message provided'}
        
        ---
        This email was sent from the Oriido contact form.
      `
    })

    if (error) {
      console.error('Error sending email:', error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    // Return success response - redirect back with success message
    return NextResponse.redirect(new URL('/?contact=success', request.url))
    
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}