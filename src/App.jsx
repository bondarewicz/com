import { useEffect, useState } from 'react'
import profile from './profile.json'
import { AgentProvider, AskAbout, Composer, ConversationView, useAgent } from './Agent.jsx'
import { LangContext, ROUTES, useLang, useT } from './i18n.js'
import { LEGAL } from './legal.js'

const { contact } = profile
// hidden until a real profile URL is set in profile.json
const linkedin = contact.linkedin && !contact.linkedin.includes('[') ? contact.linkedin : null

// remembers an explicit choice, so the browser-language default doesn't override it
function rememberLang(lang) {
  try { localStorage.setItem('lang', lang) } catch {}
}

/**
 * The question box types example questions until the visitor clicks in.
 * It's the one piece of motion on the page.
 */
function useTypedPlaceholder(examples, paused) {
  const [text, setText] = useState(examples[0])
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let i = 0, n = examples[0].length, deleting = true, timer
    const tick = () => {
      const phrase = examples[i]
      n += deleting ? -2 : 1
      setText(phrase.slice(0, Math.max(n, 0)))
      let delay = deleting ? 16 : 45
      if (!deleting && n >= phrase.length) { deleting = true; delay = 2200 }
      else if (deleting && n <= 0) { deleting = false; n = 0; i = (i + 1) % examples.length; delay = 260 }
      timer = setTimeout(tick, delay)
    }
    timer = setTimeout(tick, 2600)
    return () => clearTimeout(timer)
  }, [examples, paused])
  return text
}

function Hero() {
  const { ask, busy, messages, setOpen, online } = useAgent()
  const t = useT()
  const [paused, setPaused] = useState(false)
  const typed = useTypedPlaceholder(t.hero.examples, paused)

  return (
    <section className="hero">
      <div className="hero-stack">
        <p className="greeting">{t.hero.greeting}</p>
        <h1>{t.hero.headline}</h1>

        <aside className="assistant" id="ask" aria-label={t.hero.ask}>
          <h2><span className={`presence ${online ? 'on' : ''}`} title={online ? t.hero.online : t.hero.offline} />{t.hero.ask}</h2>
          {messages.length === 0 ? (
            <>
              <Composer placeholder={paused ? t.hero.askAboutWork : typed} onActiveChange={setPaused} />
              <p className="starters">
                {t.hero.try}{' '}
                {t.starters.map((s, i) => (
                  <span key={s.label}>
                    {i === t.starters.length - 1 ? t.hero.or : i > 0 ? ', ' : ''}
                    <button type="button" className="inline" onClick={() => ask(s.question)} disabled={busy}>{s.label}</button>
                  </span>
                ))}.
              </p>
            </>
          ) : (
            // with a conversation going, the box is the way back into it
            <div onFocusCapture={() => setOpen(true)} onClickCapture={() => setOpen(true)}>
              <Composer placeholder={t.hero.followUp} />
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}

function About() {
  const t = useT()
  return (
    <section className="section about" id="about">
      <h2>{t.about.heading}</h2>
      <div className="about-body">
        {t.about.paragraphs.map((p) => <p key={p}>{p}</p>)}
        <AskAbout label={t.about.ask} question={t.about.question} />
      </div>
    </section>
  )
}

function Work() {
  const t = useT()
  return (
    <section className="section" id="work">
      <h2>{t.work.heading}</h2>
      <div className="capabilities">
        {profile.capabilities.map((c) => {
          const text = t.capabilities?.[c.id] || c
          return (
            <article key={c.id} className="capability">
              <h3>{text.title}</h3>
              <p>{text.text}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function Legal({ page }) {
  const lang = useLang()
  const { title, html } = LEGAL[page][lang]
  return (
    <section className="section legal">
      <h2>{title}</h2>
      <div className="legal-body" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  )
}

function Footer() {
  const { contact: openContact } = useAgent()
  const lang = useLang()
  const t = useT()
  // pre-rendered with the build year, then the visitor's current year, so it never goes stale
  const [year, setYear] = useState(__BUILD_YEAR__)
  useEffect(() => setYear(new Date().getFullYear()), [])
  return (
    <footer className="foot">
      <div className="wrap foot-in">
        <p>{t.footer.curious}</p>
        <button type="button" className="pill" onClick={openContact}>{t.footer.contact}</button>
      </div>
      <div className="wrap">
        <p className="rights">{t.footer.rights} © Łukasz Bondarewicz {year} · <a href={ROUTES.privacy[lang]}>{t.footer.privacy}</a> · <a href={ROUTES.terms[lang]}>{t.footer.terms}</a></p>
      </div>
    </footer>
  )
}

function LangSwitch({ page }) {
  const lang = useLang()
  const t = useT()
  return (
    <span className="lang" role="group" aria-label={t.nav.language}>
      {['en', 'pl'].map((l, i) => (
        <span key={l}>
          {i > 0 && <span className="lang-sep" aria-hidden="true">|</span>}
          {l === lang
            ? <a aria-current="page" lang={l}>{l.toUpperCase()}</a>
            : <a href={ROUTES[page][l]} hrefLang={l} lang={l} onClick={() => rememberLang(l)}>{l.toUpperCase()}</a>}
        </span>
      ))}
    </span>
  )
}

function Page({ page }) {
  const lang = useLang()
  const t = useT()
  const home = ROUTES.home[lang]
  return (
    <>
      <div className="night">
        <div className="wrap">
          <header className="top">
            <a href={home} className="logo" aria-label={t.nav.home}>bondarewicz<span>.com</span></a>
            <nav aria-label={t.nav.sections}>
              <a href={page === 'home' ? '#work' : `${home}#work`}>{t.nav.work}</a>
              <a href={contact.github} target="_blank" rel="noreferrer">GitHub</a>
              {linkedin && <a href={linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
              <LangSwitch page={page} />
            </nav>
          </header>
          {page === 'home' && <Hero />}
        </div>
      </div>
      <main className="wrap">
        {page === 'home' ? <><About /><Work /></> : <Legal page={page} />}
      </main>
      <Footer />
      <ConversationView />
    </>
  )
}

export default function App({ page = 'home', lang = 'en', ask = null }) {
  return (
    <LangContext.Provider value={lang}>
      {/* only the home page takes a returning visitor straight back to their conversation */}
      <AgentProvider autoOpen={page === 'home'} askSlug={ask}>
        <Page page={page} />
      </AgentProvider>
    </LangContext.Provider>
  )
}
