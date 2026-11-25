const DEFAULT_API_URL = 'https://maas-api.cn-huabei-1.xf-yun.com/v2/chat/completions'
const DEFAULT_MODEL = 'spark-x2.6-4b'
const REASONING_LEVELS = new Set(['none', 'low', 'high'])

function requestError(message, status = 400) {
  return Object.assign(new Error(message), { status })
}

function prepareChatRequest(body = {}, env = process.env) {
  if (!Array.isArray(body.messages) || !body.messages.length) {
    throw requestError('messages must be a non-empty array')
  }
  if (!env.ASTRON_MAAS_API_KEY) {
    throw requestError('Missing server configuration: ASTRON_MAAS_API_KEY', 500)
  }

  const effort = body.reasoning_effort ?? env.ASTRON_MAAS_REASONING_EFFORT ?? 'low'
  if (!REASONING_LEVELS.has(effort)) {
    throw requestError('reasoning_effort must be none, low, or high')
  }
  const configuredTokens = Number.parseInt(env.ASTRON_MAAS_MAX_TOKENS, 10)
  const maxTokens = body.max_tokens ?? (configuredTokens > 0 ? configuredTokens : 4096)
  if (!Number.isInteger(maxTokens) || maxTokens <= 0) {
    throw requestError('max_tokens must be a positive integer')
  }

  // The server owns the model and credentials. Cached browsers may still send
  // astron-code-latest, which must not override the configured Spark model.
  const payload = {
    ...body,
    model: env.ASTRON_MAAS_MODEL || DEFAULT_MODEL,
    max_tokens: maxTokens,
    thinking: { type: effort === 'none' ? 'disabled' : 'enabled' }
  }
  if (effort === 'none') delete payload.reasoning_effort
  else payload.reasoning_effort = effort

  return {
    url: env.ASTRON_MAAS_BASE_URL || DEFAULT_API_URL,
    apiKey: env.ASTRON_MAAS_API_KEY,
    payload
  }
}

module.exports = { prepareChatRequest }
