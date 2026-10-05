import { createContext, useContext, useEffect, useRef, useState } from 'react'
import profile from './profile.json'

export const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.bondarewicz.com/v1'
const MAX_HISTORY = 20
const JD_THRESHOLD = 400
const STORE_KEY = 'lb-agent-conversation'

const titles = Object.fromEntries([
  ...profile.projects.map((p) => [p.id, p.name]),
  ...profile.experience.map((e) => [e.id, `${e.company}, ${e.start.slice(0, 4)}–${e.end ? e.end.slice(0, 4) : 'now'}`]),
])

const AgentContext = createContext(null)
export const useAgent = () => useContext(AgentContext)

function load() {
  try { return JSON.parse(sessionStorage.getItem(STORE_KEY)) || [] } catch { return [] }
}

const ID_KEY = 'lb-agent-conversation-id'
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
  const parts = [reply.answer]
  if (reply.fit?.strong?.length) parts.push('Strong matches: ' + reply.fit.strong.join('; '))
  if (reply.fit?.discuss?.length) parts.push('Worth discussing: ' + reply.fit.discuss.join('; '))
  return parts.filter(Boolean).join('\n')
}

export function AgentProvider({ children }) {
  const [messages, setMessages] = useState(load)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [remaining, setRemaining] = useState(null)
  const [contactOpen, setContactOpen] = useState(false)

  useEffect(() => {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(messages)) } catch {}
  }, [messages])

  const lastReply = [...messages].reverse().find((m) => m.role === 'assistant' && m.reply)?.reply
  const cited = new Set(lastReply?.sources || [])

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
      if (!r.ok) {
        // failures stay on screen but out of the history sent back to the model
        setMessages((m) => [...m.slice(0, -1), { role: 'user', content: question, local: true },
          { role: 'assistant', local: true, reply: { answer: data.answer || data.error || 'Something went wrong.', sources: [], followups: [] } }])
        if (data.offer_contact) setContactOpen((c) => c || 'offer')
        return
      }
      setMessages((m) => [...m, { role: 'assistant', content: asText(data), reply: data }])
      if (data.contact_saved) setContactOpen(false)
      else if (data.offer_contact) setContactOpen((c) => c || 'offer')
    } catch {
      setMessages((m) => [...m.slice(0, -1), { role: 'user', content: question, local: true },
        { role: 'assistant', local: true, reply: { answer: `The assistant is offline. You can still leave your email, or write to ${profile.contact.email}.`, sources: [], followups: [] } }])
      setContactOpen((c) => c || 'offer')
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    conversationId(true)
    setMessages([])
    setContactOpen(false)
  }

  const value = { messages, open, setOpen, busy, ask, reset, remaining, cited, contactOpen, setContactOpen }
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

function Icon({ d, label }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden={label ? undefined : true}>
      {d.map((p) => <path key={p} d={p} />)}
    </svg>
  )
}
export const ArrowUp = () => <Icon d={['M12 19V5', 'M6 11l6-6 6 6']} />
const Close = () => <Icon d={['M6 6l12 12', 'M18 6L6 18']} />
const Restart = () => <Icon d={['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5']} />
const Chat = () => <Icon d={['M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z']} />

function UserBubble({ text }) {
  const [expanded, setExpanded] = useState(false)
  const isJd = text.length > JD_THRESHOLD
  return (
    <div className="bubble-user">
      {isJd && <div className="bubble-label">Job description · {text.length.toLocaleString()} chars</div>}
      {isJd && !expanded ? <>{text.slice(0, 180)}… <button type="button" className="linkish" onClick={() => setExpanded(true)}>show all</button></> : text}
    </div>
  )
}

function Reply({ reply, onFollowup, isLast }) {
  const fit = reply.fit || { strong: [], discuss: [] }
  const hasFit = fit.strong?.length || fit.discuss?.length
  return (
    <div className="reply">
      {reply.answer && <p>{reply.answer}</p>}
      {hasFit ? (
        <div className="fit">
          <div className="fit-title">Fit report</div>
          {fit.strong.map((s) => <div className="fit-row" key={s}><span className="dot good" aria-label="Strong match" />{s}</div>)}
          {fit.discuss.map((s) => <div className="fit-row" key={s}><span className="dot ask" aria-label="Worth discussing" />{s}</div>)}
        </div>
      ) : null}
      {reply.contact_saved && <div className="saved" role="status">✓ Contact details passed to Łukasz</div>}
      {reply.sources?.length ? (
        <div className="chips-src">
          {reply.sources.map((id) => (
            <button type="button" key={id} className="src" onClick={() => scrollToSource(id)}>{titles[id] || id}</button>
          ))}
        </div>
      ) : null}
      {isLast && reply.followups?.length ? (
        <div className="followups">
          {reply.followups.map((q) => <button type="button" key={q} onClick={() => onFollowup(q)}>{q}</button>)}
        </div>
      ) : null}
    </div>
  )
}

function ContactForm({ messages, onDone, initial }) {
  const [expanded, setExpanded] = useState(initial === 'form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [attach, setAttach] = useState(true)
  const [state, setState] = useState({ status: 'idle' })
  const transcript = messages.filter((m) => !m.local).map((m) => ({ role: m.role, content: m.content }))

  async function send(e) {
    e.preventDefault()
    setState({ status: 'sending' })
    try {
      const r = await fetch(`${API_BASE}/agent/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: conversationId(), name, email, note, transcript: attach ? transcript : [] }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) return setState({ status: 'error', message: data.error || 'Could not send.' })
      setState({ status: 'sent', notified: data.notified })
    } catch {
      setState({ status: 'error', message: `Could not send. Please email ${profile.contact.email}.` })
    }
  }

  if (state.status === 'sent') {
    return (
      <div className="contact sent" role="status">
        <strong>{state.notified ? 'Sent.' : 'Saved.'}</strong> {state.notified ? 'Łukasz just got a notification' : 'Łukasz will see it'} and will reply to {email}.
        <button type="button" className="linkish" onClick={onDone}>Close</button>
      </div>
    )
  }

  if (!expanded) {
    return (
      <div className="contact offer">
        <span>Want Łukasz to reply?</span>
        <button type="button" className="btn accent" onClick={() => setExpanded(true)}>Leave your email</button>
      </div>
    )
  }

  return (
    <form className="contact" onSubmit={send}>
      <div className="contact-title">Want Łukasz to reply?</div>
      <div className="contact-row">
        <label>Name<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={120} /></label>
        <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@company.com" maxLength={254} /></label>
      </div>
      <label>Note (optional)<textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="Role, project, timing…" /></label>
      {transcript.length > 0 && (
        <label className="check"><input type="checkbox" checked={attach} onChange={(e) => setAttach(e.target.checked)} /> Include this conversation</label>
      )}
      {state.status === 'error' && <div className="error" role="alert">{state.message}</div>}
      <button type="submit" className="btn accent" disabled={state.status === 'sending'}>{state.status === 'sending' ? 'Sending…' : 'Send'}</button>
    </form>
  )
}

export function AgentDrawer() {
  const { messages, open, setOpen, busy, ask, reset, remaining, contactOpen, setContactOpen } = useAgent()
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)
  const endRef = useRef(null)

  // on phones, focusing would pop the keyboard over the answer
  useEffect(() => { if (open && window.matchMedia('(min-width: 721px)').matches) inputRef.current?.focus() }, [open])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages.length, busy, contactOpen])
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  function submit(e) {
    e?.preventDefault()
    ask(draft)
    setDraft('')
  }

  const lastAssistant = messages.map((m, i) => (m.role === 'assistant' ? i : -1)).filter((i) => i >= 0).pop()

  if (!open) {
    return messages.length ? (
      <button type="button" className="resume" onClick={() => setOpen(true)}>
        <Chat /> Continue conversation <span className="count">{messages.filter((m) => m.role === 'user').length}</span>
      </button>
    ) : null
  }

  return (
    <aside className="drawer" aria-label="Conversation with Łukasz's agent">
      <div className="drawer-head">
        <div>
          <div className="drawer-title">Ask Łukasz's agent</div>
          <div className="drawer-sub">answers only from his profile and GitHub{remaining != null ? ` · ${remaining} left this hour` : ''}</div>
        </div>
        <div className="drawer-actions">
          <button type="button" aria-label="New conversation" title="New conversation" onClick={reset} disabled={busy || !messages.length}><Restart /></button>
          <button type="button" aria-label="Close" title="Close (Esc)" onClick={() => setOpen(false)}><Close /></button>
        </div>
      </div>

      <div className="drawer-body" aria-live="polite">
        {messages.length === 0 && !contactOpen && (
          <div className="empty">
            <p>Ask about his projects, the roles he fits, or paste a job description for an honest fit report.</p>
          </div>
        )}
        {messages.map((m, i) => m.role === 'user'
          ? <UserBubble key={i} text={m.content} />
          : <Reply key={i} reply={m.reply || { answer: m.content }} isLast={i === lastAssistant && !busy} onFollowup={ask} />)}
        {busy && <div className="thinking">Thinking<span>.</span><span>.</span><span>.</span></div>}
        {contactOpen && <ContactForm key={contactOpen} initial={contactOpen} messages={messages} onDone={() => setContactOpen(false)} />}
        <div ref={endRef} />
      </div>

      <form className="composer" onSubmit={submit}>
        <div className="composer-box">
          <label htmlFor="composer" className="sr-only">Message</label>
          <textarea
            id="composer"
            ref={inputRef}
            rows={1}
            value={draft}
            maxLength={6000}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(e) }}
            placeholder="Ask a follow-up, or paste a job description"
          />
          <button type="submit" aria-label="Send" disabled={busy || !draft.trim()}><ArrowUp /></button>
        </div>
        <div className="composer-foot">
          <span>Conversations are saved so Łukasz can follow up.</span>
          {!contactOpen && <button type="button" className="linkish" onClick={() => setContactOpen('form')}>Leave your email</button>}
        </div>
      </form>
    </aside>
  )
}

export function AskAbout({ question, label = 'Ask about this', className = '' }) {
  const { ask, busy } = useAgent()
  return <button type="button" className={`ask-about ${className}`} onClick={() => ask(question)} disabled={busy}>{label}</button>
}
