require('dotenv').config();
const { prepareChatRequest } = require('./api/_lib/chat-config');

async function test() {
  try {
    const upstream = prepareChatRequest({
      messages: [{ role: 'user', content: 'Reply with a short greeting.' }],
      stream: false
    });
    const response = await fetch(upstream.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${upstream.apiKey}`
      },
      body: JSON.stringify(upstream.payload),
      signal: AbortSignal.timeout(55000)
    });
    const data = await response.json();
    console.log({ status: response.status, model: data.model, content: data.choices?.[0]?.message?.content, error: data.error });
    if (!response.ok || !data.choices?.[0]?.message?.content) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

test();
