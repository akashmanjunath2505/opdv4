import http from 'http';

type ContactPayload = {
  name: string;
  email: string;
  phone?: string;
  clinic?: string;
  message: string;
};

const sendEmail = async (payload: ContactPayload) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY');
  }

  const subject = `Premium Inquiry from ${payload.name}`;
  const html = `
    <h2>Premium Contact Request</h2>
    <p><strong>Name:</strong> ${payload.name}</p>
    <p><strong>Email:</strong> ${payload.email}</p>
    ${payload.phone ? `<p><strong>Phone:</strong> ${payload.phone}</p>` : ''}
    ${payload.clinic ? `<p><strong>Clinic:</strong> ${payload.clinic}</p>` : ''}
    <p><strong>Message:</strong></p>
    <p>${payload.message.replace(/\n/g, '<br/>')}</p>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Aivana Health <onboarding@resend.dev>',
      to: ['abhishek@aivanahealth.com'],
      reply_to: payload.email,
      subject,
      html
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend error: ${response.status} ${text}`);
  }
};

const server = http.createServer((req, res) => {
  const url = req.url || '';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && url.startsWith('/api/contact')) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}') as ContactPayload;
        if (!parsed.name || !parsed.email || !parsed.message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing required fields' }));
          return;
        }

        await sendEmail(parsed);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Server error' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const port = process.env.CONTACT_SERVER_PORT ? Number(process.env.CONTACT_SERVER_PORT) : 3001;
server.listen(port, () => {
  console.log(`Contact server listening on http://localhost:${port}`);
});
