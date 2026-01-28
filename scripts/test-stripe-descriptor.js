#!/usr/bin/env node

const Stripe = require('stripe');

// Use your test key
const stripe = new Stripe('sk_test_51SnM1lFKsQG9Heb2eSepCsK4b4NIEp6KmqolVcySX2kNB0qHVPqZFnoUNsuWu6ufGM5gQ9jV6RItqMJJumSrqrX700Q5hLx86m', {
  apiVersion: '2024-11-20.acacia',
});

async function testStatementDescriptor() {
  console.log('====== TESTING STRIPE STATEMENT DESCRIPTOR ======\n');

  try {
    // Test 1: Create a simple payment intent
    console.log('Test 1: Creating simple payment intent...');
    const simpleIntent = await stripe.paymentIntents.create({
      amount: 100, // 1 EUR
      currency: 'eur',
      description: 'Test payment to check descriptor',
    });
    
    console.log('Simple Intent Created:');
    console.log('- ID:', simpleIntent.id);
    console.log('- Statement Descriptor:', simpleIntent.statement_descriptor || 'NOT SET');
    console.log('- Statement Descriptor Suffix:', simpleIntent.statement_descriptor_suffix || 'NOT SET');
    console.log('\n');

    // Test 2: Create payment intent with custom descriptor
    console.log('Test 2: Creating payment intent with custom descriptor...');
    const customIntent = await stripe.paymentIntents.create({
      amount: 100,
      currency: 'eur',
      description: 'Test with custom descriptor',
      statement_descriptor_suffix: 'TestRest',
    });
    
    console.log('Custom Intent Created:');
    console.log('- ID:', customIntent.id);
    console.log('- Statement Descriptor:', customIntent.statement_descriptor || 'NOT SET');
    console.log('- Statement Descriptor Suffix:', customIntent.statement_descriptor_suffix || 'NOT SET');
    console.log('\n');

    // Test 3: Get account info to see default descriptor
    console.log('Test 3: Getting account information...');
    const account = await stripe.accounts.retrieve();
    
    console.log('Account Information:');
    console.log('- Account ID:', account.id);
    console.log('- Statement Descriptor:', account.settings?.payments?.statement_descriptor || 'NOT SET');
    console.log('- Statement Descriptor Prefix:', account.settings?.payments?.statement_descriptor_prefix || 'NOT SET');
    console.log('- Card Payments Statement Descriptor:', account.settings?.card_payments?.statement_descriptor_prefix || 'NOT SET');
    console.log('\n');

    // Test 4: Create with both descriptor and suffix
    console.log('Test 4: Creating payment intent with full descriptor...');
    const fullIntent = await stripe.paymentIntents.create({
      amount: 100,
      currency: 'eur',
      description: 'Test full descriptor',
      statement_descriptor: 'ORIIDO',
      statement_descriptor_suffix: 'DEMOREST',
    });
    
    console.log('Full Intent Created:');
    console.log('- ID:', fullIntent.id);
    console.log('- Statement Descriptor:', fullIntent.statement_descriptor || 'NOT SET');
    console.log('- Statement Descriptor Suffix:', fullIntent.statement_descriptor_suffix || 'NOT SET');
    console.log('\n');

    console.log('====== IMPORTANT FINDINGS ======');
    console.log('The platform account statement descriptor is:', account.settings?.payments?.statement_descriptor || 'NOT SET');
    console.log('This is what appears on bank statements by default.');
    console.log('\nTo fix "Setup F" appearing:');
    console.log('1. Go to Stripe Dashboard -> Settings -> Business settings -> Public business information');
    console.log('2. Update the "Statement descriptor" field to just "ORIIDO"');
    console.log('3. Save the changes');
    console.log('\nAlternatively, we can force override it in code by setting statement_descriptor explicitly.');
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.raw) {
      console.error('Raw error:', error.raw);
    }
  }
}

// Run the test
testStatementDescriptor();