import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { ROUTES, useLang, useT } from './i18n.js'

export const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.bondarewicz.com/v1'
const MAX_HISTORY = 20
const JD_THRESHOLD = 400
const STORE_KEY = 'lb-agent-conversation'
const ID_KEY = 'lb-agent-conversation-id'

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

export function AgentProvider({ children, autoOpen = true }) {
  const lang = useLang()
  const t = useT()
  // start empty so the pre-rendered HTML and the first browser render match,
  // then restore this tab's conversation
  const [messages, setMessages] = useState([])
  const restored = useRef(false)
  const [busy, setBusy] = useState(false)
  const [remaining, setRemaining] = useState(null)
  const [contactOpen, setContactOpen] = useState(false)
  // the full-screen conversation view
  const [open, setOpen] = useState(false)
  // whether the agent can answer: null until the first check
  const [online, setOnline] = useState(null)

  // check now, every minute while the page is visible, and whenever the visitor comes back to it
  useEffect(() => {
    const check = () => {
      if (document.visibilityState !== 'visible') return
      fetch(`${API_BASE}/agent/status`, { cache: 'no-store' })
        .then((r) => r.json().catch(() => ({})).then((d) => setOnline(r.ok && d.online === true)))
        .catch(() => setOnline(false))
    }
    check()
    const timer = setInterval(check, 60000)
    document.addEventListener('visibilitychange', check)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', check) }
  }, [])

  useEffect(() => {
    const saved = load()
    setMessages(saved)
    // a visitor with a conversation goes straight back to it, until they start a new one
    if (saved.length && autoOpen) setOpen(true)
    restored.current = true
  }, [])

  useEffect(() => {
    if (!restored.current) return
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(messages)) } catch {}
  }, [messages])

  function fail(question, answer, offer = true) {
    setMessages((m) => [...m.slice(0, -1), { role: 'user', content: question, local: true },
      { role: 'assistant', local: true, reply: { answer, followups: [] } }])
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
        body: JSON.stringify({ conversationId: conversationId(), lang, meta: visitMeta(), messages: history.map((m) => ({ role: m.role, content: m.content })) }),
      })
      const data = await r.json().catch(() => ({}))
      // an answer proves the agent is up; a server error or resting reply means it isn't
      if (r.ok) setOnline(true)
      else if (r.status >= 500) setOnline(false)
      if (typeof data.remaining === 'number') setRemaining(data.remaining)
      // failures stay on screen but out of the history sent back to the model
      if (!r.ok) return fail(question, data.answer || data.error || t.agent.failed, data.offer_contact)
      setMessages((m) => [...m, { role: 'assistant', content: asText(data), reply: data }])
      if (data.contact_saved) setContactOpen(false)
      else if (data.offer_contact) setContactOpen((c) => c || 'offer')
    } catch {
      setOnline(false)
      fail(question, t.agent.offline)
    } finally {
      setBusy(false)
    }
  }

  // "Contact me": open the conversation with the assistant asking for their details.
  // Shown only, never sent: whatever they type next starts the conversation, and the API
  // turns an email address in it into a lead.
  function contact() {
    setOpen(true)
    setMessages((m) => (m[m.length - 1]?.contactPrompt ? m : [...m, { role: 'assistant', local: true, contactPrompt: true, reply: { answer: t.agent.contactPrompt } }]))
  }

  function reset() {
    conversationId(true)
    setMessages([])
    setContactOpen(false)
  }

  const value = { messages, busy, ask, contact, reset, remaining, contactOpen, setContactOpen, open, setOpen, online }
  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
}

function Question({ text }) {
  const t = useT()
  const [expanded, setExpanded] = useState(false)
  if (text.length <= JD_THRESHOLD) return <p className="ex-q">{text}</p>
  return (
    <p className="ex-q">
      {t.agent.jobDescription(text.length.toLocaleString())}{' '}
      {expanded ? <span className="ex-jd">{text}</span> : <button type="button" className="inline" onClick={() => setExpanded(true)}>{t.agent.showIt}</button>}
    </p>
  )
}

function Answer({ reply }) {
  const t = useT()
  const fit = reply.fit || { strong: [], discuss: [] }
  return (
    <div className="ex-a">
      {reply.answer && <p className="answer">{reply.answer}</p>}
      {(fit.strong?.length > 0 || fit.discuss?.length > 0) && (
        <div className="fit">
          {fit.strong.length > 0 && <div><h4>{t.agent.matches}</h4><ul>{fit.strong.map((s) => <li key={s}>{s}</li>)}</ul></div>}
          {fit.discuss.length > 0 && <div><h4>{t.agent.discuss}</h4><ul>{fit.discuss.map((s) => <li key={s}>{s}</li>)}</ul></div>}
        </div>
      )}
      {reply.ask && <p className="ask-who">{reply.ask}</p>}
      {reply.contact_saved && <p className="saved" role="status">{t.agent.saved}</p>}
    </div>
  )
}

function ContactForm({ messages, onDone, initial }) {
  const t = useT()
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
      if (!r.ok) return setState({ status: 'error', message: data.error || t.agent.sendFailedEmail })
      setState({ status: 'sent' })
    } catch {
      setState({ status: 'error', message: t.agent.sendFailed })
    }
  }

  if (state.status === 'sent') {
    return <div className="contact sent" role="status">{t.agent.sent(email)} <button type="button" className="inline" onClick={onDone}>{t.agent.close}</button></div>
  }
  if (!expanded) {
    return (
      <div className="contact offer">
        <span>{t.agent.wantReply}</span>
        <button type="button" className="btn-quiet" onClick={() => setExpanded(true)}>{t.agent.leaveDetails}</button>
      </div>
    )
  }
  return (
    <form className="contact" onSubmit={send}>
      <p className="contact-lead">{t.agent.formLead}</p>
      <div className="contact-row">
        <label>{t.agent.name}<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={120} /></label>
        <label>{t.agent.email}<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={254} /></label>
      </div>
      <label>{t.agent.about} <span className="opt">{t.agent.optional}</span><textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} /></label>
      {state.status === 'error' && <p className="error" role="alert">{state.message}</p>}
      <div className="contact-actions">
        <button type="submit" className="btn-quiet" disabled={state.status === 'sending'}>{state.status === 'sending' ? t.agent.sending : t.agent.send}</button>
        <button type="button" className="inline" onClick={onDone}>{t.agent.cancel}</button>
      </div>
    </form>
  )
}

/**
 * The conversation, laid out like a printed interview: the visitor's question small,
 * the agent's answer in the serif.
 */
export function Thread() {
  const t = useT()
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
    // an answer with no question before it (the contact prompt) gets an exchange of its own
    else if (!exchanges.length || exchanges[exchanges.length - 1].a) exchanges.push({ q: null, a: m.reply || { answer: m.content } })
    else exchanges[exchanges.length - 1].a = m.reply || { answer: m.content }
  })
  const last = exchanges[exchanges.length - 1]
  const followups = !busy && last?.a?.followups?.length ? last.a.followups : []

  return (
    <div className="thread" aria-live="polite">
      {exchanges.map((ex, i) => (
        <article className="exchange" key={i}>
          {ex.q && <Question text={ex.q} />}
          {ex.a ? <Answer reply={ex.a} /> : <p className="thinking" aria-label={t.agent.thinking}><span /><span /><span /></p>}
        </article>
      ))}
      {followups.length > 0 && (
        <p className="next">
          {t.agent.askNext}{' '}
          {followups.map((q, i) => (
            <span key={q}>{i > 0 && t.agent.orNext}<button type="button" className="inline" onClick={() => ask(q)}>{q.replace(/\?$/, '')}</button></span>
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
export function AskAbout({ question, label }) {
  const { ask, busy } = useAgent()
  const t = useT()
  return (
    <button type="button" className="arrow-action" onClick={() => ask(question)} disabled={busy}>
      {label || t.agent.walkthrough}<span className="arrow-circle"><ArrowRight /></span>
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
  const t = useT()
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
      <label htmlFor={autoFocus ? 'followup' : 'question'} className="sr-only">{t.agent.askQuestion}</label>
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
      <button type="submit" className="send" aria-label={t.agent.askButton} disabled={busy}><ArrowUp /></button>
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
export function ConversationView() {
  const { open, setOpen, messages, reset, busy, ask, online } = useAgent()
  const lang = useLang()
  const t = useT()
  const starters = t.starters

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
    <div className="convo" role="dialog" aria-modal="true" aria-label={t.agent.conversation}>
      <header className="convo-bar">
        <span className="convo-title"><span className={`presence ${online ? 'on' : ''}`} title={online ? t.hero.online : t.hero.offline} />{t.hero.ask}</span>
        <div className="convo-actions">
          {messages.length > 0 && <button type="button" className="inline muted" onClick={reset} disabled={busy}>{t.agent.newConversation}</button>}
          <button type="button" className="icon-btn" aria-label={t.agent.closeConversation} onClick={() => setOpen(false)}><Close /></button>
        </div>
      </header>
      <div className="convo-scroll">
        <div className="convo-column">
          {messages.length === 0 && (
            <div className="convo-empty">
              <h2>{t.agent.emptyHeading}</h2>
              <p className="starters">
                {t.hero.try}{' '}
                {starters.map((s, i) => (
                  <span key={s.label}>
                    {i === starters.length - 1 ? t.hero.or : i > 0 ? ', ' : ''}
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
          <Composer placeholder={messages[messages.length - 1]?.contactPrompt ? t.agent.contactPlaceholder : messages.length ? t.hero.followUp : t.hero.askAboutWork} autoFocus />
          <p className="saved-note">{t.agent.notice} <a href={ROUTES.privacy[lang]}>{t.agent.savedNotice}</a></p>
        </div>
      </div>
    </div>
  )
}
