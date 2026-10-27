<template>
  <div class="learning-assistant">
    <div v-if="isOpen" class="chat-window">
      <div class="chat-header">
        <div class="chat-header-text">
          <span>{{ i18n.title }}</span>
          <a
            class="chat-header-credit"
            href="https://huggingface.co/collections/XHToken/spark-x26"
            target="_blank"
            rel="noopener noreferrer"
          >
            Powered by Spark-X2.6-4B
          </a>
        </div>
        <button @click="toggleChat" class="close-btn">×</button>
      </div>
      <div class="chat-messages" ref="messagesContainer">
        <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.role]">
          <div :class="['message-content', { loading: msg.isPending }]">{{ msg.content }}</div>
        </div>
      </div>
      <div class="chat-input">
        <input
          v-model="inputText"
          @keyup.enter="sendMessage"
          :placeholder="i18n.placeholder"
          :disabled="isLoading"
        />
        <button
          v-if="isLoading"
          @click="stopMessage"
          class="stop-btn"
        >
          {{ i18n.stop }}
        </button>
        <button
          v-else
          @click="sendMessage"
          :disabled="!inputText.trim()"
        >
          {{ i18n.send }}
        </button>
      </div>
    </div>
    <div v-else class="chat-toggle" @click="toggleChat">
      🤖
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted, computed, watch } from 'vue'
import { useData, withBase } from 'vitepress'

const { lang } = useData()

const isEn = computed(() => lang.value === 'en')
const CHAT_ENDPOINT_FALLBACK = 'https://astronclaw-tutorial.vercel.app/api/chat'
const REQUEST_TIMEOUT = 45000

const i18n = computed(() => {
  return isEn.value ? {
    title: 'Learning Assistant',
    placeholder: 'What tool would you like to know about?...',
    send: 'Send',
    stop: 'Stop',
    welcome: 'Hello! I am your learning assistant. What do you need? Which tool would you like to use (AStudio, Loomy or AstronClaw)? I will recommend and guide you to the next step.',
    systemPrompt: `You are the learning assistant for Astron Harness Tutorial, covering AStudio, Loomy and AstronClaw. Product facts: AstronClaw is iFLYTEK's hosted cloud AI assistant built on OpenClaw; Loomy is a desktop AI companion for office work; AStudio is an AI productivity workspace for planning and executing tasks, previewing deliverables, local projects, plugins and automation. Use current official sources for pricing and legal terms. Your role is to explain these products and guide users through the tutorial. Ask what the user needs or which product they want to use, make a suitable recommendation, and guide them to the next step. Keep answers short and friendly, and use the [Knowledge Base Reference] for specific instructions when available.\n`,
    errorFallback: 'Sorry, I encountered some issues. Please try again later.',
    errorPrefix: 'Request failed: ',
    thinking: 'Thinking...',
    requestCanceled: 'Response stopped.',
    requestTimeout: 'The response timed out. Please try again.',
    replyInEnglish: 'Reply entirely in English. If earlier messages use Chinese, ignore that and continue in English. If you quote Chinese source text, add a brief English explanation.',
    replyInChinese: '请全程使用中文回复。如果引用英文资料，请补充简短中文解释。',
    knowledgeBaseTitle: '\n\n[Knowledge Base Reference]\n',
    chapter: 'Chapter: ',
    content: 'Content: '
  } : {
    title: '学习助手 (Learning Assistant)',
    placeholder: '你想了解什么工具？...',
    send: '发送',
    stop: '停止',
    welcome: '你好！我是你的学习助手。请问你有什么需求？希望使用哪款工具（AStudio、Loomy 或 AstronClaw）？我会为你推荐并引导你进行下一步操作。',
    systemPrompt: `你是 Astron Harness Tutorial（AStudio、Loomy 与 AstronClaw）的学习助手。产品事实：AstronClaw 是基于 OpenClaw 核心能力打造的讯飞云端 AI 助手；Loomy 是面向办公场景的桌面端 AI 工作搭子；AStudio 是支持任务规划执行、成果预览、本地项目、插件与自动化的全场景 AI 生产力工作台。价格和协议以最新官方页面为准。你的职责是讲解这些产品并引导用户学习教程。询问用户需求或想使用哪款产品，给出合适的推荐并引导下一步操作。保持回答简短友好，有【知识库参考信息】时依据其中内容给出具体操作说明。\n`,
    errorFallback: '抱歉，我遇到了一些问题，请稍后再试。',
    errorPrefix: '请求失败: ',
    thinking: '正在思考...',
    requestCanceled: '回答已停止。',
    requestTimeout: '回答超时，请重试。',
    replyInEnglish: 'Please reply entirely in English. Ignore earlier Chinese replies and continue in English. If you quote Chinese source text, add a brief English explanation.',
    replyInChinese: '请全程使用中文回复。如果引用英文资料，请补充简短中文解释。',
    knowledgeBaseTitle: '\n\n【知识库参考信息】\n',
    chapter: '章节: ',
    content: '内容: '
  }
})

const isOpen = ref(false)
const isLoading = ref(false)
const inputText = ref('')
const messagesContainer = ref(null)
const currentController = ref(null)

const messages = ref([
  {
    role: 'assistant',
    content: i18n.value.welcome
  }
])

watch(lang, () => {
  if (messages.value.length === 1 && messages.value[0].role === 'assistant') {
    messages.value[0].content = i18n.value.welcome
  } else {
    messages.value.push({
      role: 'assistant',
      content: i18n.value.welcome
    })
    scrollToBottom()
  }
})

let docsIndex = []

onMounted(async () => {
  scrollToBottom()
  try {
    const res = await fetch(withBase('/docs-index.json'))
    if (res.ok) {
      docsIndex = await res.json()
    }
  } catch (e) {
    console.error('Failed to load docs index', e)
  }
})

const toggleChat = () => {
  isOpen.value = !isOpen.value
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function searchDocs(query) {
  if (!docsIndex.length) return ''
  const currentLang = isEn.value ? 'en' : 'zh'
  const currentLangDocs = docsIndex.filter(doc => doc.lang === currentLang)

  if (!currentLangDocs.length) return ''
  const keywords = query.toLowerCase().match(/[a-z0-9]+|[\u4e00-\u9fa5]/g) || []
  if (!keywords.length) return ''

  const results = currentLangDocs.map(doc => {
    let score = 0
    const text = (doc.heading + ' ' + doc.content).toLowerCase()

    if (text.includes(query.toLowerCase())) {
      score += 50
    }

    for (let i = 0; i < keywords.length; i += 1) {
      if (text.includes(keywords[i])) score += 1
      if (i < keywords.length - 1) {
        const bigram = keywords[i] + keywords[i + 1]
        if (text.includes(bigram)) score += 5
      }
      if (i < keywords.length - 2) {
        const trigram = keywords[i] + keywords[i + 1] + keywords[i + 2]
        if (text.includes(trigram)) score += 10
      }
    }

    if (doc.heading.toLowerCase().includes(query.toLowerCase())) score += 30

    return { ...doc, score }
  }).filter(doc => doc.score > 5).sort((a, b) => b.score - a.score).slice(0, 3)

  if (results.length === 0) return ''

  return i18n.value.knowledgeBaseTitle + results.map(r => `${i18n.value.chapter}${r.heading}\n${i18n.value.content}${r.content}`).join('\n\n')
}

function detectPreferredLanguage(text) {
  const englishCount = (text.match(/[A-Za-z]/g) || []).length
  const chineseCount = (text.match(/[\u3400-\u9fff]/g) || []).length

  if (isEn.value) {
    return 'en'
  }

  // An English product name must not override a Chinese question.
  if (chineseCount === 0 && englishCount >= 3) {
    return 'en'
  }

  return 'zh'
}

function buildSystemPrompt(text, context) {
  const languageInstruction = detectPreferredLanguage(text) === 'en'
    ? i18n.value.replyInEnglish
    : i18n.value.replyInChinese

  return `${i18n.value.systemPrompt}\n${context}\n\n${languageInstruction}`
}

function getChatEndpoints() {
  if (typeof window === 'undefined') {
    return ['/api/chat', CHAT_ENDPOINT_FALLBACK]
  }

  const currentOrigin = window.location.origin
  const fallbackOrigin = CHAT_ENDPOINT_FALLBACK.replace('/api/chat', '')
  const endpoints = ['/api/chat']

  if (currentOrigin !== fallbackOrigin) {
    endpoints.push(CHAT_ENDPOINT_FALLBACK)
  }

  return endpoints
}

const updateAssistantMessage = async (message, content, isPending = false) => {
  message.content = content
  message.isPending = isPending
  await scrollToBottom()
}

const requestChat = async (payload, signal) => {
  const endpoints = getChatEndpoints()
  let lastError = null

  for (const endpoint of endpoints) {
    if (signal.aborted) {
      throw lastError || new Error('Request aborted')
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal,
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`API error: ${response.status} ${errText}`)
      }

      return response
    } catch (error) {
      if (signal.aborted) {
        throw error
      }

      lastError = new Error(`${endpoint}: ${error.message}`)
      console.error(`Error calling AI endpoint ${endpoint}:`, error)
    }
  }

  throw lastError ?? new Error('No chat endpoint available')
}

const readStreamResponse = async (response, assistantMessage) => {
  if (!response.body) {
    throw new Error('Empty response body')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let content = ''

  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done })

    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmedLine = line.trim()

      if (!trimmedLine || !trimmedLine.startsWith('data:')) {
        continue
      }

      const data = trimmedLine.slice(5).trim()

      if (data === '[DONE]') {
        if (!content) {
          await updateAssistantMessage(assistantMessage, i18n.value.errorFallback)
        }
        return
      }

      const parsed = JSON.parse(data)
      const delta = parsed.choices?.[0]?.delta?.content ?? parsed.choices?.[0]?.message?.content ?? ''

      if (delta) {
        content += delta
        await updateAssistantMessage(assistantMessage, content, true)
      }
    }

    if (done) {
      break
    }
  }

  if (buffer.trim().startsWith('data:')) {
    const data = buffer.trim().slice(5).trim()

    if (data && data !== '[DONE]') {
      const parsed = JSON.parse(data)
      const delta = parsed.choices?.[0]?.delta?.content ?? parsed.choices?.[0]?.message?.content ?? ''

      if (delta) {
        content += delta
      }
    }
  }

  if (content) {
    await updateAssistantMessage(assistantMessage, content)
    return
  }

  await updateAssistantMessage(assistantMessage, i18n.value.errorFallback)
}

const stopMessage = () => {
  if (currentController.value) {
    currentController.value.abort('user-stop')
  }
}

const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || isLoading.value) return

  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  isLoading.value = true
  scrollToBottom()

  const context = searchDocs(text)
  const systemPrompt = buildSystemPrompt(text, context)
  const requestMessages = messages.value
    .filter(m => !m.isPending)
    .filter(m => m.role !== 'assistant' || (m.content !== i18n.value.errorFallback && !m.content.startsWith(i18n.value.errorPrefix)))
    .map(m => ({ role: m.role, content: m.content }))
  const assistantMessage = reactive({
    role: 'assistant',
    content: i18n.value.thinking,
    isPending: true
  })
  const controller = new AbortController()
  let isTimedOut = false
  const timeoutId = window.setTimeout(() => {
    isTimedOut = true
    controller.abort('timeout')
  }, REQUEST_TIMEOUT)

  currentController.value = controller
  messages.value.push(assistantMessage)
  await scrollToBottom()

  try {
    const response = await requestChat({
      stream: true,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        ...requestMessages
      ]
    }, controller.signal)

    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('text/event-stream')) {
      await readStreamResponse(response, assistantMessage)
    } else {
      const data = await response.json()
      const content = data.choices?.[0]?.message?.content
      await updateAssistantMessage(assistantMessage, content || i18n.value.errorFallback)
    }
  } catch (error) {
    console.error('Error calling AI:', error)
    if (controller.signal.aborted) {
      if (isTimedOut) {
        await updateAssistantMessage(assistantMessage, i18n.value.requestTimeout)
      } else if (!assistantMessage.content || assistantMessage.content === i18n.value.thinking) {
        await updateAssistantMessage(assistantMessage, i18n.value.requestCanceled)
      } else {
        assistantMessage.isPending = false
      }
    } else {
      await updateAssistantMessage(assistantMessage, `${i18n.value.errorPrefix}${error.message}`)
    }
  } finally {
    window.clearTimeout(timeoutId)
    currentController.value = null
    isLoading.value = false
    assistantMessage.isPending = false
    scrollToBottom()
  }
}
</script>

<style scoped>
.learning-assistant {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  font-family: var(--vp-font-family-base);
}

.chat-toggle {
  width: 60px;
  height: 60px;
  background-color: var(--vp-c-brand-1);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30px;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s, box-shadow 0.3s;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--vp-c-brand-1-rgb), 0.7);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(var(--vp-c-brand-1-rgb), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--vp-c-brand-1-rgb), 0);
  }
}

.chat-toggle:hover {
  transform: scale(1.1);
  animation: none;
}

.chat-window {
  width: 380px;
  height: 550px;
  max-width: calc(100vw - 48px);
  max-height: calc(100vh - 48px);
  background-color: var(--vp-c-bg);
  border: 2px solid var(--vp-c-brand-1);
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease-out forwards;
}

@media (max-width: 768px) {
  .learning-assistant {
    bottom: 16px;
    right: 16px;
    z-index: 1000;
  }

  .chat-toggle {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }

  .chat-window {
    position: fixed;
    bottom: 0;
    right: 0;
    width: 100vw;
    max-width: none;
    height: 70vh;
    max-height: calc(100vh - 60px);
    border-radius: 16px 16px 0 0;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--vp-c-brand-1), var(--vp-c-brand-2));
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
}

.chat-header-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-header-credit {
  color: rgba(255, 255, 255, 0.88);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.2;
  text-decoration: none;
}

.chat-header-credit:hover {
  color: white;
  text-decoration: underline;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: var(--vp-c-bg-soft);
}

.message {
  display: flex;
  flex-direction: column;
}

.message.user {
  align-items: flex-end;
}

.message.assistant {
  align-items: flex-start;
}

.message-content {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.message.user .message-content {
  background-color: var(--vp-c-brand-1);
  color: white;
  border-bottom-right-radius: 2px;
}

.message.assistant .message-content {
  background-color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  border-bottom-left-radius: 2px;
}

.loading {
  font-style: italic;
  color: var(--vp-c-text-2);
}

.chat-input {
  display: flex;
  padding: 12px;
  border-top: 1px solid var(--vp-c-divider);
  background-color: var(--vp-c-bg);
  gap: 8px;
}

.chat-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  outline: none;
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.chat-input input:focus {
  border-color: var(--vp-c-brand-1);
}

.chat-input button {
  padding: 8px 16px;
  background-color: var(--vp-c-brand-1);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.chat-input .stop-btn {
  background-color: #d93025;
}

.chat-input button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

</style>
