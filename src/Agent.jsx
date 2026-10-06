import { createContext, useContext, useEffect, useRef, useState } from 'react'
import profile from './profile.json'

export const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.bondarewicz.com/v1'
const MAX_HISTORY = 20
const JD_THRESHOLD = 400
const STORE_KEY = 'lb-agent-conversation'
const ID_KEY = 'lb-agent-conversation-id'

const titles = Object.fromEntries([
  ...profile.projects.map((p) => [p.id, p.name]),
  ...profile.experience.map((e) => [e.id, `${e.company}, ${e.start.slice(0, 4)} to ${e.end ? e.end.slice(0, 4) : 'today'}`]),
])

const AgentContext = createContext(null)
export const useAgent = () => useContext(AgentContext)

function load() {
  try { return JSON.parse(sessionStorage.getItem(STORE_KEY)) || [] } catch { return [] }
}

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`)

// One id per conversation, so the API can keep the whole thread together.
function conversationId(fresh = false) {
  try {
    let id = sessionStorage.getItem(ID_KEY)
    if (!id || fresh) { id = newId(); sessionStorage.setItem(ID_KEY, id) }
    return id
  } catch { return newId() }
}

// Where the visitor came from; the API stores it with the first question.
function visitMeta() {
  return {
    referrer: document.referrer,
    landing: location.href,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${screen.width}x${screen.height}`,
  }
}

// What the model sees of its own earlier turns: the answer plus any fit report.
function asText(reply) {
  const parts = [reply.answer, reply.ask]
  if (reply.fit?.strong?.length) parts.push('Strong matches: ' + reply.fit.strong.join('; '))
  if (reply.fit?.discuss?.length) parts.push('Worth discussing: ' + reply.fit.discuss.join('; '))
  return parts.filter(Boolean).join('\n')
}

export function AgentProvider({ children }) {
  // start empty so the pre-rendered HTML and the first browser render match,
  // then restore this tab's conversation
  const [messages, setMessages] = useState([])
  const restored = useRef(false)
  const [busy, setBusy] = useState(false)
  const [remaining, setRemaining] = useState(null)
  const [contactOpen, setContactOpen] = useState(false)
  // the full-screen conversation view
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setMessages(load())
    restored.current = true
  }, [])

  useEffect(() => {
    if (!restored.current) return
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(messages)) } catch {}
  }, [messages])

  const lastReply = [...messages].reverse().find((m) => m.role === 'assistant' && m.reply)?.reply
  const cited = new Set(lastReply?.sources || [])

  function fail(question, answer, offer = true) {
    setMessages((m) => [...m.slice(0, -1), { role: 'user', content: question, local: true },
      { role: 'assistant', local: true, reply: { answer, sources: [], followups: [] } }])
    if (offer) setContactOpen((c) => c || 'offer')
  }

  async function ask(text) {
    const question = text.trim()
    if (!question || busy) return
    setOpen(true)
    const next = [...messages, { role: 'user', content: question }]
    setMessages(next)
    setBusy(true)

    let history = next.filter((m) => !m.local).slice(-MAX_HISTORY)
    while (history.length && history[0].role !== 'user') history = history.slice(1)

    try {
      const r = await fetch(`${API_BASE}/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: conversationId(), meta: visitMeta(), messages: history.map((m) => ({ role: m.role, content: m.content })) }),
      })
      const data = await r.json().catch(() => ({}))
      if (typeof data.remaining === 'number') setRemaining(data.remaining)
      // failures stay on screen but out of the history sent back to the model
      if (!r.ok) return fail(question, data.answer || data.error || 'That didn\'t go through. Try again in a moment.', data.offer_contact)
      setMessages((m) => [...m, { role: 'assistant', content: asText(data), reply: data }])
      if (data.contact_saved) setContactOpen(false)
      else if (data.offer_contact) setContactOpen((c) => c || 'offer')
    } catch {
      fail(question, 'The assistant is offline right now. Leave your details below and Łukasz will get back to you.')
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    conversationId(true)
    setMessages([])
    setContactOpen(false)
  }

  const value = { messages, busy, ask, reset, remaining, cited, contactOpen, setContactOpen, open, setOpen }
  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
}

function scrollToSource(id) {
  const el = document.querySelector(`[data-source="${id}"]`)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.classList.remove('flash')
  void el.offsetWidth
  el.classList.add('flash')
}

function Question({ text }) {
  const [expanded, setExpanded] = useState(false)
  if (text.length <= JD_THRESHOLD) return <p className="ex-q">{text}</p>
  return (
    <p className="ex-q">
      Job description, {text.length.toLocaleString()} characters.{' '}
      {expanded ? <span className="ex-jd">{text}</span> : <button type="button" className="inline" onClick={() => setExpanded(true)}>Show it</button>}
    </p>
  )
}

function Answer({ reply }) {
  const fit = reply.fit || { strong: [], discuss: [] }
  const sources = reply.sources || []
  return (
    <div className="ex-a">
      <p className="speaker">My assistant</p>
      {reply.answer && <p className="answer">{reply.answer}</p>}
      {(fit.strong?.length > 0 || fit.discuss?.length > 0) && (
        <div className="fit">
          {fit.strong.length > 0 && <div><h4>Where he matches</h4><ul>{fit.strong.map((s) => <li key={s}>{s}</li>)}</ul></div>}
          {fit.discuss.length > 0 && <div><h4>Worth discussing</h4><ul>{fit.discuss.map((s) => <li key={s}>{s}</li>)}</ul></div>}
        </div>
      )}
      {sources.length > 0 && (
        <p className="sources">
          Sources:{' '}
          {sources.map((id, i) => (
            <span key={id}>{i > 0 && ', '}<button type="button" className="inline" onClick={() => scrollToSource(id)}>{titles[id] || id}</button></span>
          ))}
        </p>
      )}
      {reply.ask && <p className="ask-who">{reply.ask}</p>}
      {reply.contact_saved && <p className="saved" role="status">Your details are with Łukasz. He'll reply by email.</p>}
    </div>
  )
}

function ContactForm({ messages, onDone, initial }) {
  const [expanded, setExpanded] = useState(initial === 'form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [state, setState] = useState({ status: 'idle' })

  async function send(e) {
    e.preventDefault()
    setState({ status: 'sending' })
    try {
      const r = await fetch(`${API_BASE}/agent/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: conversationId(), name, email, note, transcript: messages.filter((m) => !m.local).map((m) => ({ role: m.role, content: m.content })) }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) return setState({ status: 'error', message: data.error || 'That didn\'t send. Check the email address and try again.' })
      setState({ status: 'sent' })
    } catch {
      setState({ status: 'error', message: 'That didn\'t send. Try again in a minute.' })
    }
  }

  if (state.status === 'sent') {
    return <div className="contact sent" role="status">Sent. I'll reply to {email}. <button type="button" className="inline" onClick={onDone}>Close</button></div>
  }
  if (!expanded) {
    return (
      <div className="contact offer">
        <span>Want me to get back to you?</span>
        <button type="button" className="btn-quiet" onClick={() => setExpanded(true)}>Leave your details</button>
      </div>
    )
  }
  return (
    <form className="contact" onSubmit={send}>
      <p className="contact-lead">Leave your details and I'll reply by email. This conversation is included.</p>
      <div className="contact-row">
        <label>Name<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={120} /></label>
        <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={254} /></label>
      </div>
      <label>What it's about <span className="opt">(optional)</span><textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} /></label>
      {state.status === 'error' && <p className="error" role="alert">{state.message}</p>}
      <div className="contact-actions">
        <button type="submit" className="btn-quiet" disabled={state.status === 'sending'}>{state.status === 'sending' ? 'Sending' : 'Send details'}</button>
        <button type="button" className="inline" onClick={onDone}>Cancel</button>
      </div>
    </form>
  )
}

/**
 * The conversation, laid out like a printed interview: the visitor's question small,
 * the agent's answer in the serif, its sources on one quiet line beneath.
 */
export function Thread() {
  const { messages, busy, ask, contactOpen, setContactOpen } = useAgent()
  const endRef = useRef(null)
  const count = useRef(messages.length)

  useEffect(() => {
    if (messages.length !== count.current || busy) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    count.current = messages.length
  }, [messages.length, busy, contactOpen])

  const exchanges = []
  messages.forEach((m) => {
    if (m.role === 'user') exchanges.push({ q: m.content, a: null })
    else if (exchanges.length) exchanges[exchanges.length - 1].a = m.reply || { answer: m.content }
  })
  const last = exchanges[exchanges.length - 1]
  const followups = !busy && last?.a?.followups?.length ? last.a.followups : []

  return (
    <div className="thread" aria-live="polite">
      {exchanges.map((ex, i) => (
        <article className="exchange" key={i}>
          <Question text={ex.q} />
          {ex.a ? <Answer reply={ex.a} /> : <p className="thinking" aria-label="Thinking"><span /><span /><span /></p>}
        </article>
      ))}
      {followups.length > 0 && (
        <p className="next">
          Ask next:{' '}
          {followups.map((q, i) => (
            <span key={q}>{i > 0 && ', or '}<button type="button" className="inline" onClick={() => ask(q)}>{q.replace(/\?$/, '')}</button></span>
          ))}
          ?
        </p>
      )}
      {contactOpen && <ContactForm key={contactOpen} initial={contactOpen} messages={messages} onDone={() => setContactOpen(false)} />}
      <div ref={endRef} />
    </div>
  )
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

// an action with a round arrow beside it: the button reads as "go there"
export function AskAbout({ question, label = 'Ask for a walkthrough' }) {
  const { ask, busy } = useAgent()
  return (
    <button type="button" className="arrow-action" onClick={() => ask(question)} disabled={busy}>
      {label}<span className="arrow-circle"><ArrowRight /></span>
    </button>
  )
}

function ArrowUp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  )
}

/**
 * The question box: used in the hero panel and pinned to the bottom of the conversation view.
 */
export function Composer({ placeholder, autoFocus, onActiveChange }) {
  const { ask, busy } = useAgent()
  const [draft, setDraft] = useState('')
  const [focused, setFocused] = useState(false)
  const ref = useRef(null)

  useEffect(() => { if (autoFocus && window.matchMedia('(min-width: 721px)').matches) ref.current?.focus() }, [autoFocus])
  // lets the hero stop its typing animation while the visitor is using the box
  useEffect(() => { onActiveChange?.(focused || draft.length > 0) }, [focused, draft, onActiveChange])

  function submit(e) {
    e?.preventDefault()
    if (!draft.trim()) return ref.current?.focus()
    ask(draft)
    setDraft('')
  }

  return (
    <form className="askbox" onSubmit={submit}>
      <label htmlFor={autoFocus ? 'followup' : 'question'} className="sr-only">Ask me anything about my work</label>
      <textarea
        id={autoFocus ? 'followup' : 'question'}
        ref={ref}
        rows={1}
        value={draft}
        maxLength={6000}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(e) }}
        placeholder={placeholder}
      />
      <button type="submit" className="send" aria-label="Ask" disabled={busy}><ArrowUp /></button>
    </form>
  )
}

function Close() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

/**
 * Once someone asks, the conversation takes the whole screen: a slim bar on top,
 * the thread in a reading column, the question box pinned to the bottom.
 */
export function ConversationView({ starters }) {
  const { open, setOpen, messages, reset, busy, ask } = useAgent()

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', onKey) }
  }, [open, setOpen])

  if (!open) return null
  return (
    <div className="convo" role="dialog" aria-modal="true" aria-label="Conversation with my assistant">
      <header className="convo-bar">
        <span className="convo-title"><span className="presence on" />My assistant</span>
        <div className="convo-actions">
          {messages.length > 0 && <button type="button" className="inline muted" onClick={reset} disabled={busy}>New conversation</button>}
          <button type="button" className="icon-btn" aria-label="Close the conversation" onClick={() => setOpen(false)}><Close /></button>
        </div>
      </header>
      <div className="convo-scroll">
        <div className="convo-column">
          {messages.length === 0 && (
            <div className="convo-empty">
              <h2>Ask me anything about my work.</h2>
              <p className="starters">
                Try{' '}
                {starters.map((s, i) => (
                  <span key={s.label}>
                    {i === starters.length - 1 ? ' or ' : i > 0 ? ', ' : ''}
                    <button type="button" className="inline" onClick={() => ask(s.question)} disabled={busy}>{s.label}</button>
                  </span>
                ))}.
              </p>
            </div>
          )}
          <Thread />
        </div>
      </div>
      <div className="convo-compose">
        <div className="convo-column">
          <Composer placeholder={messages.length ? 'Ask a follow-up' : 'Ask about my work'} autoFocus />
          <p className="saved-note">Conversations are saved.</p>
        </div>
      </div>
    </div>
  )
}
