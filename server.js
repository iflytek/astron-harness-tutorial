const express = require('express');
const dotenv = require('dotenv');
const { prepareChatRequest } = require('./api/_lib/chat-config');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const REQUEST_TIMEOUT = 55000;
const ALLOWED_ORIGINS = new Set([
  'https://iflytek.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]);

async function pipeStream(response, res) {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const reader = response.body.getReader();

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    res.write(Buffer.from(value));
  }

  res.end();
}

function applyCors(req, res) {
  const requestOrigin = req.headers.origin;

  if (requestOrigin && ALLOWED_ORIGINS.has(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

app.use((req, res, next) => {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  const requestBody = req.body && typeof req.body === 'object' ? req.body : {};

  try {
    const upstream = prepareChatRequest(requestBody);
    const response = await fetch(upstream.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${upstream.apiKey}`
      },
      body: JSON.stringify(upstream.payload),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).send(`API Error: ${response.status} ${errorText}`);
    }

    if (requestBody.stream && response.body) {
      await pipeStream(response, res);
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error('Proxy Error:', error);

    if (res.headersSent) {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
      return;
    }

    if (controller.signal.aborted) {
      res.status(504).json({ error: 'Gateway Timeout', details: 'Upstream request timed out' });
      return;
    }

    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  } finally {
    clearTimeout(timeoutId);
  }
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Proxy server running on port ${PORT}`);
  });
}

module.exports = app;
