import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: NextRequest) {
  try {
    let firstName: string, lastName: string, email: string, phone: string, restaurant: string, tables: string, message: string
    
    const contentType = request.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      // Handle JSON submission
      const body = await request.json()
      firstName = body.firstName
      lastName = body.lastName
      email = body.email
      phone = body.phone
      restaurant = body.restaurant
      tables = body.tables
      message = body.message
    } else {
      // Handle form data submission
      const formData = await request.formData()
      firstName = formData.get('firstName') as string
      lastName = formData.get('lastName') as string
      email = formData.get('email') as string
      phone = formData.get('phone') as string
      restaurant = formData.get('restaurant') as string
      tables = formData.get('tables') as string
      message = formData.get('message') as string
    }

    // Check if Resend is configured
    if (!resend || !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_test_123456789') {
      // Log the form submission for development
      console.log('Contact Form Submission (Email not configured):')
      console.log('Name:', firstName, lastName)
      console.log('Email:', email)
      console.log('Phone:', phone || 'Not provided')
      console.log('Restaurant:', restaurant)
      console.log('Tables:', tables || 'Not specified')
      console.log('Message:', message || 'No message provided')
      
      // In development, treat as success
      const isAjax = request.headers.get('x-requested-with') === 'XMLHttpRequest' || 
                     request.headers.get('content-type')?.includes('application/json')

      if (isAjax) {
        return NextResponse.json(
          { success: true, message: 'Form submission received (email service not configured)' },
          { status: 200 }
        )
      } else {
        // Use 303 See Other to force GET request after POST
        return NextResponse.redirect(new URL('/?contact=success', request.url), 303)
      }
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Oriido Contact Form <onboarding@resend.dev>',
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
        { error: 'Failed to send email', details: error.message },
        { status: 500 }
      )
    }

    // Check if this is an AJAX request
    const isAjax = request.headers.get('x-requested-with') === 'XMLHttpRequest' || 
                   request.headers.get('content-type')?.includes('application/json')

    if (isAjax) {
      // Return JSON for AJAX requests
      return NextResponse.json(
        { success: true, message: 'Email sent successfully' },
        { status: 200 }
      )
    } else {
      // Use 303 See Other to force GET request after POST
      return NextResponse.redirect(new URL('/?contact=success', request.url), 303)
    }
    
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}