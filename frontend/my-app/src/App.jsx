import './App.css'
import { useEffect, useRef, useState } from 'react'
import { ClothingRenderer } from './components/ClothingRenderer'
import { HtmlBalancerStream } from 'html-balancer-stream'

const STORAGE_KEY = 'dynamic-react-component.messages'
const THREAD_KEY = 'dynamic-react-component.thread-id'
const STREAM_PREVIEW_KEY = 'dynamic-react-component.stream-preview'

const createMessageId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const getStoredMessages = () => {
  const savedMessages = window.localStorage.getItem(STORAGE_KEY)

  if (!savedMessages) {
    return []
  }
  const parsedMessages = JSON.parse(savedMessages)
  return parsedMessages
    .map((message, index) => {
      if (typeof message === 'string') {
        const prompt = message.trim()

        if (!prompt) {
          return null
        }

        return {
          id: `legacy-${index}`,
          prompt,
          response: '',
        }
      }

      if (typeof message !== 'object' || message === null) {
        return null
      }

      const prompt =
        typeof message.prompt === 'string'
          ? message.prompt.trim()
          : typeof message.message === 'string'
            ? message.message.trim()
            : ''

      return {
        id:
          typeof message.id === 'string' && message.id.trim().length > 0
            ? message.id
            : `legacy-${index}`,
        prompt,
        response: typeof message.response === 'string' ? message.response : '',
      }
    })
    .filter(Boolean)
}

const getStoredStreamPreview = () => {
  const savedPreview = window.localStorage.getItem(STREAM_PREVIEW_KEY)
  return typeof savedPreview === 'string' ? savedPreview : ''
}

const getThreadId = () => {
  const existingThreadId = window.localStorage.getItem(THREAD_KEY)

  if (existingThreadId) {
    return existingThreadId
  }

  const newThreadId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `thread-${Date.now()}`

  window.localStorage.setItem(THREAD_KEY, newThreadId)
  return newThreadId
}

function App() {
  const [messages, setMessages] = useState(() => getStoredMessages())
  const [selectedMessageId, setSelectedMessageId] = useState(null)
  const [draft, setDraft] = useState('')
  const [streamPreview, setStreamPreview] = useState(() => getStoredStreamPreview())
  const [reasoningPreview, setReasoningPreview] = useState('')
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const renderedPreviewRef = useRef(getStoredStreamPreview())
  const htmlBalancerWriterRef = useRef(null)
  const htmlBalancerPumpRef = useRef(null)
  const reasoningHideTimerRef = useRef(null)

  const setPreviewAndPersist = (messageId, nextPreview) => {
    renderedPreviewRef.current = nextPreview
    setMessages((currentMessages) =>
      currentMessages.map((currentMessage) =>
        currentMessage.id === messageId
          ? { ...currentMessage, response: nextPreview }
          : currentMessage,
      ),
    )

    setStreamPreview(nextPreview)
  }

  const initializeHtmlBalancer = (messageId) => {
    const stream = new HtmlBalancerStream({ buffer: true })
    const writer = stream.writable.getWriter()
    const reader = stream.readable.getReader()
    let bufferedOutput = ''

    htmlBalancerWriterRef.current = writer
    htmlBalancerPumpRef.current = (async () => {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        if (typeof value !== 'string' || value.length === 0) {
          continue
        }

        bufferedOutput += value
        setPreviewAndPersist(messageId, bufferedOutput)
      }
    })().finally(() => {
      reader.releaseLock()
    })
  }

  const closeHtmlBalancer = async () => {
    const writer = htmlBalancerWriterRef.current
    htmlBalancerWriterRef.current = null
    if (writer) {
      await writer.close()
    }

    const pump = htmlBalancerPumpRef.current
    htmlBalancerPumpRef.current = null
    if (pump) {
      await pump
    }
  }

  const appendStreamContent = async (messageId, chunk) => {
    if (typeof chunk !== 'string' || chunk.length === 0) {
      return
    }

    const writer = htmlBalancerWriterRef.current
    if (writer) {
      await writer.write(chunk)
      return
    }

    setPreviewAndPersist(messageId, `${renderedPreviewRef.current}${chunk}`)
  }

  const pushReasoningChunk = (chunk) => {
    if (typeof chunk !== 'string' || chunk.length === 0) {
      return
    }

    setReasoningPreview((current) => `${current}${chunk}`)

    if (reasoningHideTimerRef.current) {
      window.clearTimeout(reasoningHideTimerRef.current)
    }

    reasoningHideTimerRef.current = window.setTimeout(() => {
      setReasoningPreview('')
      reasoningHideTimerRef.current = null
    }, 1600)
  }

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    if (selectedMessageId || messages.length === 0) {
      return
    }

    setSelectedMessageId(messages[messages.length - 1].id)
  }, [messages, selectedMessageId])

  useEffect(() => {
    if (streamPreview.trim().length === 0) {
      window.localStorage.removeItem(STREAM_PREVIEW_KEY)
    } else {
      window.localStorage.setItem(STREAM_PREVIEW_KEY, streamPreview)
    }
  }, [streamPreview])

  useEffect(() => {
    return () => {
      if (reasoningHideTimerRef.current) {
        window.clearTimeout(reasoningHideTimerRef.current)
      }
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const message = draft.trim()

    if (!message) {
      return
    }

    const messageId = createMessageId()

    setMessages((currentMessages) => [
      ...currentMessages,
      { id: messageId, prompt: message, response: '' },
    ])
    setSelectedMessageId(messageId)
    setDraft('')

    setIsLoadingPreview(true)
    setPreviewError('')
    renderedPreviewRef.current = ''
    setStreamPreview('')
    setReasoningPreview('')
    initializeHtmlBalancer(messageId)

    const finishStreaming = async () => {
      await closeHtmlBalancer()
      setIsLoadingPreview(false)
    }

    const failStreaming = async () => {
      setPreviewError('Could not load streamed response from backend endpoint.')
      renderedPreviewRef.current = ''
      setStreamPreview('')
      await finishStreaming()
    }

    const response = await fetch('/invokes/generation/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        thread_id: getThreadId(),
        messages: [{ role: 'user', content: message }],
      }),
    })

    if (!response.ok || !response.body) {
      await failStreaming()
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    const processRawEvent = async (rawEvent) => {
      const dataLine = rawEvent
        .split('\n')
        .find((line) => line.startsWith('data:'))

      if (!dataLine) {
        return
      }

      const payloadText = dataLine.slice(5).trim()

      if (!payloadText) {
        return
      }

      const isJsonPayload = payloadText.startsWith('{') && payloadText.endsWith('}')
      const payload = isJsonPayload
        ? JSON.parse(payloadText)
        : { type: 'text', content: payloadText }

      if (payload?.type === 'done') {
        return
      }

      if (payload?.type === 'token') {
        if (typeof payload?.content === 'string' && payload.content.length > 0) {
          await appendStreamContent(messageId, payload.content)
        }
        return
      }

      if (payload?.type === 'reasoning') {
        const reasoningChunk =
          typeof payload?.reasoning === 'string'
            ? payload.reasoning
            : typeof payload?.content === 'string'
              ? payload.content
              : ''

        pushReasoningChunk(reasoningChunk)
        return
      }

      if (payload?.type === 'error') {
        const errorMessage =
          typeof payload?.content === 'string' && payload.content.trim().length > 0
            ? payload.content
            : 'Unknown backend error.'

        await appendStreamContent(messageId, renderedPreviewRef.current ? `\n\nError: ${errorMessage}` : `Error: ${errorMessage}`)
        return
      }

      if (typeof payload?.content === 'string' && payload.content.trim().length > 0) {
        await appendStreamContent(
          messageId,
          renderedPreviewRef.current ? `\n${payload.content}` : payload.content,
        )
      }
    }

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split('\n\n')
      buffer = events.pop() ?? ''

      for (const rawEvent of events) {
        await processRawEvent(rawEvent)
      }
    }

    if (buffer.trim().length > 0) {
      await processRawEvent(buffer)
    }

    await finishStreaming()
  }

  const handleMessageClick = (message) => {
    setSelectedMessageId(message.id)
    setPreviewError('')
    renderedPreviewRef.current = message.response
    setStreamPreview(message.response)
  }

  return (
    <main className="app-shell">
      <aside className="messages-panel">
        <header className="panel-header">
          <h1>Messages</h1>
          <p>Saved locally in your browser.</p>
        </header>

        <ul className="messages-list">
          {messages.length === 0 ? (
            <li className="empty-state">No messages yet.</li>
          ) : (
            messages.map((message) => (
              <li key={message.id} className="message-card">
                <button
                  type="button"
                  className={`message-button${selectedMessageId === message.id ? ' is-active' : ''}`}
                  onClick={() => handleMessageClick(message)}
                  disabled={isLoadingPreview}
                >
                  <span className="message-title">{message.prompt}</span>
                  <span className="message-meta">
                    {message.response.trim().length > 0 ? 'Has answer' : 'Waiting for answer'}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </aside>

      <section className="workspace-panel">
        <div className="preview-box" aria-live="polite" aria-label="stream preview area">
          {previewError ? (
            <p className="preview-error">{previewError}</p>
          ) : (
            <>
              {reasoningPreview && <p className="preview-reasoning"><em>{reasoningPreview}</em></p>}

              {streamPreview ? (
                <ClothingRenderer markdown={streamPreview} />
              ) : isLoadingPreview ? (
                <p className="preview-hint">Streaming response...</p>
              ) : (
                <p className="preview-hint">Send a message to stream backend events.</p>
              )}
            </>
          )}
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          <label className="composer-field" htmlFor="message-input">
            <span className="sr-only">Message</span>
            <input
              id="message-input"
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type a message..."
              autoComplete="off"
            />
          </label>

          <button type="submit">Send</button>
        </form>
      </section>
    </main>
  )
}

export default App
