const { http, HttpResponse } = require('msw');

module.exports.handlers = [
  // Mock OpenAI API for receipt extraction
  http.post('https://api.openai.com/v1/chat/completions', async ({ request }) => {
    const body = await request.json() as any;
    
    // Check if it's an extraction request
    if (body.messages?.[0]?.content?.includes('Extrahiere')) {
      return HttpResponse.json({
        choices: [{
          message: {
            content: JSON.stringify({
              shopName: 'Test Restaurant',
              shopAddress: 'Teststraße 123, 12345 Berlin',
              date: '2024-01-15',
              time: '14:30',
              items: [
                { description: 'Hauptgericht', quantity: 2, price: 25.90 },
                { description: 'Getränk', quantity: 2, price: 4.50 }
              ],
              tax: {
                rate: 19,
                amount: 5.18
              },
              total: 35.58
            })
          }
        }]
      });
    }
    
    // Check if it's a classification request
    if (body.messages?.[0]?.content?.includes('Klassifiziere')) {
      return HttpResponse.json({
        choices: [{
          message: {
            content: 'Kundenbewirtung'
          }
        }]
      });
    }
    
    return HttpResponse.json({
      choices: [{
        message: {
          content: 'Mocked response'
        }
      }]
    });
  }),
  
  // Mock health check endpoint
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' });
  }),
];