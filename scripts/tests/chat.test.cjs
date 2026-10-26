const test = require('node:test')
const assert = require('node:assert/strict')
const { once } = require('node:events')
const { prepareChatRequest } = require('../../api/_lib/chat-config')
const handler = require('../../api/chat')

const messages = [{ role: 'system', content: 'Reply in English.' }, { role: 'user', content: 'Introduce AstronClaw.' }]
const env = { ASTRON_MAAS_API_KEY: 'test-key' }

function serverEnv(t, values = env) {
  const keys = ['ASTRON_MAAS_API_KEY', 'ASTRON_MAAS_MODEL', 'ASTRON_MAAS_BASE_URL', 'ASTRON_MAAS_REASONING_EFFORT', 'ASTRON_MAAS_MAX_TOKENS', 'VITE_API_KEY']
  const original = Object.fromEntries(keys.map(key => [key, process.env[key]]))
  for (const key of keys) delete process.env[key]
  Object.assign(process.env, values)
  t.after(() => { for (const key of keys) { if (original[key] === undefined) delete process.env[key]; else process.env[key] = original[key] } })
}

function mockResponse() {
  return {
    headers: {}, chunks: [], headersSent: false, writableEnded: false,
    status(code) { this.statusCode = code; return this },
    setHeader(key, value) { this.headers[key] = value },
    flushHeaders() { this.headersSent = true },
    write(value) { this.chunks.push(Buffer.from(value).toString()) },
    end() { this.writableEnded = true; return this },
    json(value) { this.body = value; return this.end() },
    send(value) { this.body = value; return this.end() }
  }
}

test('server controls the Spark model and preserves the streaming conversation', () => {
  const body = { model: 'astron-code-latest', stream: true, messages }
  const result = prepareChatRequest(body, env)
  assert.equal(result.url, 'https://maas-api.cn-huabei-1.xf-yun.com/v2/chat/completions')
  assert.equal(result.payload.model, 'spark-x2.6-4b')
  assert.equal(result.payload.stream, true)
  assert.deepEqual(result.payload.messages, messages)
  assert.equal(result.payload.reasoning_effort, 'low')
  assert.equal(result.payload.max_tokens, 4096)
  assert.equal(body.model, 'astron-code-latest')
})

test('configured endpoint/model and thinking modes remain available server-side', () => {
  const config = { ...env, ASTRON_MAAS_MODEL: 'served-spark', ASTRON_MAAS_BASE_URL: 'https://inference.example/v1/chat/completions', ASTRON_MAAS_MAX_TOKENS: '8192' }
  const result = prepareChatRequest({ messages, reasoning_effort: 'none' }, config)
  assert.equal(result.url, config.ASTRON_MAAS_BASE_URL)
  assert.equal(result.payload.model, 'served-spark')
  assert.equal(result.payload.thinking.type, 'disabled')
  assert.equal(result.payload.reasoning_effort, undefined)
  assert.equal(result.payload.max_tokens, 8192)
  assert.equal(prepareChatRequest({ messages, reasoning_effort: 'high' }, env).payload.reasoning_effort, 'high')
})

test('invalid requests and frontend-prefixed credentials are rejected', () => {
  assert.throws(() => prepareChatRequest({ messages: [] }, env), { status: 400 })
  assert.throws(() => prepareChatRequest({ messages, reasoning_effort: 'invalid' }, env), { status: 400 })
  assert.throws(() => prepareChatRequest({ messages, max_tokens: -1 }, env), { status: 400 })
  assert.throws(() => prepareChatRequest({ messages }, { VITE_API_KEY: 'not-a-server-key' }), { status: 500 })
})

test('Vercel handler replaces cached model IDs in non-streaming requests', async t => {
  serverEnv(t)
  let captured
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    captured = { url, headers: options.headers, body: JSON.parse(options.body) }
    return new Response(JSON.stringify({ model: 'spark-x2.6-4b', choices: [{ message: { content: 'Hello' } }] }))
  })
  const res = mockResponse()
  await handler({ method: 'POST', headers: {}, body: { messages, model: 'astron-code-latest' } }, res)
  assert.equal(res.statusCode, 200)
  assert.equal(captured.body.model, 'spark-x2.6-4b')
  assert.equal(captured.headers.Authorization, 'Bearer test-key')
  assert.equal(res.body.choices[0].message.content, 'Hello')
})

test('Vercel handler preserves SSE chunks and Pages CORS', async t => {
  serverEnv(t)
  const chunks = [
    'data: {"model":"spark-x2.6-4b","choices":[{"delta":{"reasoning_content":"internal"}}]}\n\n',
    'data: {"model":"spark-x2.6-4b","choices":[{"delta":{"content":"Hello"}}]}\n\n',
    'data: [DONE]\n\n'
  ]
  t.mock.method(globalThis, 'fetch', async () => new Response(new ReadableStream({ start(controller) { for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk)); controller.close() } })))
  const res = mockResponse()
  await handler({ method: 'POST', headers: { origin: 'https://iflytek.github.io' }, body: { messages, stream: true } }, res)
  assert.equal(res.statusCode, 200)
  assert.match(res.headers['Content-Type'], /text\/event-stream/)
  assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://iflytek.github.io')
  assert.equal(res.chunks.join(''), chunks.join(''))
  assert.equal(res.writableEnded, true)
})

test('local Express endpoint uses the same server model configuration', async t => {
  serverEnv(t)
  const realFetch = globalThis.fetch
  const app = require('../../server')
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections() }))
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const body = JSON.parse(options.body)
    return new Response(JSON.stringify({ model: body.model, stream: body.stream }))
  })
  const response = await realFetch(`http://127.0.0.1:${server.address().port}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages, model: 'old-model', stream: false }) })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { model: 'spark-x2.6-4b', stream: false })
})
