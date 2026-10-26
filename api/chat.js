const { prepareChatRequest } = require('./_lib/chat-config')
const REQUEST_TIMEOUT = 55000

async function pipeStream(response, res) {
  res.status(200)
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  const reader = response.body.getReader()

  while (true) {
    const { value, done } = await reader.read()

    if (done) {
      break
    }

    res.write(Buffer.from(value))
  }

  res.end()
}

module.exports = async function handler(req, res) {
  const ALLOWED_ORIGINS = new Set([
    'https://iflytek.github.io',
    'https://astronclaw-tutorial.space',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ]);
  
  const requestOrigin = req.headers.origin;

  if (requestOrigin && (ALLOWED_ORIGINS.has(requestOrigin) || requestOrigin.endsWith('.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin)
    res.setHeader('Vary', 'Origin')
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  const requestBody = req.body && typeof req.body === 'object' ? req.body : {}

  try {
    const upstream = prepareChatRequest(requestBody)
    const response = await fetch(upstream.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${upstream.apiKey}`
      },
      body: JSON.stringify(upstream.payload),
      signal: controller.signal
    })

    if (!response.ok) {
      const errorText = await response.text()
      return res.status(response.status).send(`API Error: ${response.status} ${errorText}`)
    }

    if (requestBody.stream && response.body) {
      await pipeStream(response, res)
      return
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message })
    console.error('Proxy Error:', error)

    if (res.headersSent) {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
        res.end()
      }
      return
    }

    if (controller.signal.aborted) {
      return res.status(504).json({ error: 'Gateway Timeout', details: 'Upstream request timed out' })
    }

    return res.status(500).json({ error: 'Internal Server Error', details: error.message })
  } finally {
    clearTimeout(timeoutId)
  }
}
