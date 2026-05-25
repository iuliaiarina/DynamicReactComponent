import './App.css'
import { useEffect, useState } from 'react'
import { ClothingRenderer } from './components/ClothingRenderer'

const STORAGE_KEY = 'dynamic-react-component.messages'
const THREAD_KEY = 'dynamic-react-component.thread-id'

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
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [streamPreview, setStreamPreview] = useState('')
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [previewError, setPreviewError] = useState('')

  useEffect(() => {
    const savedMessages = window.localStorage.getItem(STORAGE_KEY)

    if (!savedMessages) {
      return
    }

    try {
      const parsedMessages = JSON.parse(savedMessages)

      if (Array.isArray(parsedMessages)) {
        setMessages(
          parsedMessages.filter(
            (message) => typeof message === 'string' && message.trim().length > 0,
          ),
        )
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const message = draft.trim()

    if (!message) {
      return
    }

    setMessages((currentMessages) => [...currentMessages, message])
    setDraft('')

    setIsLoadingPreview(true)
    setPreviewError('')
    setStreamPreview('')

    try {
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

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body for event stream')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''

        for (const rawEvent of events) {
          const dataLine = rawEvent
            .split('\n')
            .find((line) => line.startsWith('data:'))

          if (!dataLine) {
            continue
          }

          const payloadText = dataLine.slice(5).trim()

          if (!payloadText) {
            continue
          }

          let payload

          try {
            payload = JSON.parse(payloadText)
          } catch {
            payload = { type: 'text', content: payloadText }
          }

          if (payload?.type === 'done') {
            continue
          }

          if (payload?.type === 'token') {
            if (typeof payload?.content === 'string' && payload.content.length > 0) {
              setStreamPreview((current) => `${current}${payload.content}`)
            }
            continue
          }

          if (payload?.type === 'error') {
            const errorMessage =
              typeof payload?.content === 'string' && payload.content.trim().length > 0
                ? payload.content
                : 'Unknown backend error.'

            setStreamPreview((current) =>
              current ? `${current}\n\nError: ${errorMessage}` : `Error: ${errorMessage}`,
            )
            continue
          }

          if (typeof payload?.content === 'string' && payload.content.trim().length > 0) {
            setStreamPreview((current) =>
              current ? `${current}\n${payload.content}` : payload.content,
            )
          }
        }
      }
    } catch {
      setPreviewError('Could not load streamed response from backend endpoint.')
      setStreamPreview('')
    } finally {
      setIsLoadingPreview(false)
    }
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
            messages.map((message, index) => (
              <li key={`${message}-${index}`} className="message-card">
                {message}
              </li>
            ))
          )}
        </ul>
      </aside>

      <section className="workspace-panel">
        <div className="preview-box" aria-live="polite" aria-label="stream preview area">
          {isLoadingPreview ? (
            <p className="preview-hint">Streaming response...</p>
          ) : previewError ? (
            <p className="preview-error">{previewError}</p>
          ) : streamPreview ? (
            <ClothingRenderer markdown={streamPreview} />
          ) : (
            <p className="preview-hint">Send a message to stream backend events.</p>
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
