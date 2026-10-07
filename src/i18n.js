import { createContext, useContext } from 'react'

/**
 * Every piece of interface text, in English and Polish. The page is in Łukasz's voice;
 * the assistant's own answers come from the API, in the visitor's language.
 */
export const LANGS = ['en', 'pl']

// The same page in each language, so the switch always lands on the counterpart.
export const ROUTES = {
  home: { en: '/', pl: '/pl/' },
  privacy: { en: '/privacy/', pl: '/pl/prywatnosc/' },
  terms: { en: '/terms/', pl: '/pl/regulamin/' },
}

export function routeFor(pathname) {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`
  for (const [page, paths] of Object.entries(ROUTES)) {
    for (const lang of LANGS) if (paths[lang] === path) return { page, lang }
  }
  return { page: 'home', lang: path.startsWith('/pl/') ? 'pl' : 'en' }
}

export const STRINGS = {
  en: {
    meta: {
      home: { title: 'Łukasz Bondarewicz · Technical Lead', description: 'Łukasz Bondarewicz helps teams ship better software, with AI where it actually helps. Technical Lead with nearly two decades of turning first ideas into reliable software, twice as a company\'s first engineer.' },
      privacy: { title: 'Privacy · bondarewicz.com', description: 'How bondarewicz.com and its AI assistant handle your data.' },
      terms: { title: 'Terms · bondarewicz.com', description: 'Terms of use for the AI assistant on bondarewicz.com.' },
    },
    nav: { sections: 'Sections', work: 'What I do', language: 'Language', home: 'bondarewicz.com, home' },
    hero: {
      greeting: 'Hi, I\'m Łukasz.',
      headline: 'I\'ve spent nearly two decades helping teams ship better software, and now I bring in AI where it actually helps.',
      ask: 'Ask me anything',
      online: 'Online',
      offline: 'Offline',
      examples: ['What did you build?', 'Are you a fit for us?', 'What are you building?', 'What role do you want?'],
      askAboutWork: 'Ask about my work',
      followUp: 'Ask a follow-up',
      try: 'Try',
      or: ' or ',
    },
    starters: [
      { label: 'what I built as engineer #1', question: 'What has Łukasz built in the past?' },
      { label: 'what I\'m building now', question: 'What is Łukasz building now?' },
      { label: 'what I\'m looking for next', question: 'What is Łukasz looking for next?' },
    ],
    about: {
      heading: 'I help teams turn a first idea into software they can rely on.',
      paragraphs: [
        'Twice, I\'ve been the first engineer a company hired. Both times it meant listening closely to what the business needed, building the pipelines and infrastructure a growing team could rely on, and helping new engineers find their feet as the team grew.',
        'Most recently, I helped set the technical direction of a logistics platform I\'d built from its foundations, and brought AI into one of its core parts.',
        'If your team is starting something new, or wants to ship with more confidence, I\'d love to hear about it.',
      ],
      ask: 'Ask about my background',
      question: 'Tell me about Łukasz\'s background and how he works.',
    },
    work: { heading: 'What teams bring me in for.' },
    capabilities: null, // English comes from profile.json
    footer: { curious: 'Still curious?', contact: 'Contact me', rights: 'All rights reserved', privacy: 'Privacy', terms: 'Terms' },
    agent: {
      contactPrompt: 'Happy to pass a message to Łukasz. What\'s your name, the best email to reach you, and what would you like to talk about?',
      failed: 'That didn\'t go through. Try again in a moment.',
      offline: 'The assistant is offline right now. Leave your details below and Łukasz will get back to you.',
      jobDescription: (n) => `Job description, ${n} characters.`,
      showIt: 'Show it',
      matches: 'Where he matches',
      discuss: 'Worth discussing',
      saved: 'Your details are with Łukasz. He\'ll reply by email.',
      sendFailedEmail: 'That didn\'t send. Check the email address and try again.',
      sendFailed: 'That didn\'t send. Try again in a minute.',
      sent: (email) => `Sent. I'll reply to ${email}.`,
      close: 'Close',
      wantReply: 'Want me to get back to you?',
      leaveDetails: 'Leave your details',
      formLead: 'Leave your details and I\'ll reply by email. This conversation is included.',
      name: 'Name',
      email: 'Email',
      about: 'What it\'s about',
      optional: '(optional)',
      sending: 'Sending',
      send: 'Send details',
      cancel: 'Cancel',
      thinking: 'Thinking',
      askNext: 'Ask next:',
      orNext: ', or ',
      walkthrough: 'Ask for a walkthrough',
      askQuestion: 'Ask me anything about my work',
      askButton: 'Ask',
      conversation: 'Conversation',
      newConversation: 'New conversation',
      closeConversation: 'Close the conversation',
      emptyHeading: 'Ask me anything about my work.',
      contactPlaceholder: 'Your name, email and what it\'s about',
      notice: 'You\'re chatting with an AI assistant that can make mistakes.',
      savedNotice: 'Conversations are saved.',
    },
  },

  pl: {
    meta: {
      home: { title: 'Łukasz Bondarewicz · Technical Lead', description: 'Łukasz Bondarewicz pomaga zespołom dostarczać lepsze oprogramowanie, z AI tam, gdzie naprawdę pomaga. Technical Lead z prawie dwudziestoletnim doświadczeniem w zamienianiu pierwszych pomysłów w niezawodne oprogramowanie, dwukrotnie jako pierwszy inżynier w firmie.' },
      privacy: { title: 'Prywatność · bondarewicz.com', description: 'Jak bondarewicz.com i asystent AI przetwarzają Twoje dane.' },
      terms: { title: 'Regulamin · bondarewicz.com', description: 'Regulamin korzystania z asystenta AI na bondarewicz.com.' },
    },
    nav: { sections: 'Sekcje', work: 'Czym się zajmuję', language: 'Język', home: 'bondarewicz.com, strona główna' },
    hero: {
      greeting: 'Cześć, jestem Łukasz.',
      headline: 'Od prawie dwudziestu lat pomagam zespołom dostarczać lepsze oprogramowanie, a dziś wprowadzam AI tam, gdzie naprawdę pomaga.',
      ask: 'Zapytaj mnie o cokolwiek',
      online: 'Dostępny',
      offline: 'Niedostępny',
      examples: ['Co zbudowałeś?', 'Czy pasujesz do nas?', 'Nad czym pracujesz?', 'Jakiej roli szukasz?'],
      askAboutWork: 'Zapytaj o moją pracę',
      followUp: 'Zadaj kolejne pytanie',
      try: 'Zapytaj na przykład,',
      or: ' lub ',
    },
    starters: [
      { label: 'co zbudowałem jako pierwszy inżynier', question: 'Co Łukasz zbudował w przeszłości?' },
      { label: 'nad czym teraz pracuję', question: 'Nad czym Łukasz teraz pracuje?' },
      { label: 'czego szukam dalej', question: 'Czego Łukasz szuka dalej?' },
    ],
    about: {
      heading: 'Pomagam zespołom zamienić pierwszy pomysł w oprogramowanie, na którym mogą polegać.',
      paragraphs: [
        'Dwa razy byłem pierwszym inżynierem zatrudnionym przez firmę. Za każdym razem oznaczało to uważne słuchanie, czego potrzebuje biznes, budowanie pipeline\'ów i infrastruktury, na których rosnący zespół mógł polegać, oraz pomaganie nowym inżynierom odnaleźć się, gdy zespół się powiększał.',
        'Ostatnio pomagałem wyznaczać kierunek techniczny platformy logistycznej, którą zbudowałem od podstaw, i wprowadziłem AI do jednej z jej kluczowych części.',
        'Jeśli Twój zespół zaczyna coś nowego albo chce dostarczać z większą pewnością, chętnie o tym usłyszę.',
      ],
      ask: 'Zapytaj o moje doświadczenie',
      question: 'Opowiedz o doświadczeniu Łukasza i o tym, jak pracuje.',
    },
    work: { heading: 'W czym pomagam zespołom.' },
    capabilities: {
      'zero-to-one': { title: 'Buduję platformy od zera', text: 'Stawiałem pipeline\'y dostarczania i infrastrukturę chmurową, których potrzebują nowe produkty, przenosiłem monolity na mikroserwisy i rozwijałem prototypy w linie produktów z prawdziwymi użytkownikami.' },
      'ai-in-production': { title: 'Wdrażam agentów AI', text: 'Wdrożyłem na produkcję agentów i embeddingi, wsparte obserwowalnością i eksperymentami na prawdziwych zbiorach danych, które pomagają w prompt engineeringu.' },
      modernise: { title: 'Modernizuję infrastrukturę', text: 'Prowadziłem przeniesienie platformy na Kubernetes, pomagałem w migracji z GCP do Azure, a ostatnio pracowałem ze stosem .NET.' },
      direction: { title: 'Pomagam wyznaczać kierunek techniczny', text: 'Projektowałem systemy rozproszone, które działają stabilnie i skalują się, gdy trzeba, oraz promowałem dobre praktyki, które utrzymują ich niezawodność.' },
    },
    footer: { curious: 'Chcesz wiedzieć więcej?', contact: 'Napisz do mnie', rights: 'Wszelkie prawa zastrzeżone', privacy: 'Prywatność', terms: 'Regulamin' },
    agent: {
      contactPrompt: 'Chętnie przekażę wiadomość Łukaszowi. Jak masz na imię, na jaki adres e-mail najlepiej odpisać i o czym chcesz porozmawiać?',
      failed: 'Nie udało się wysłać. Spróbuj za chwilę.',
      offline: 'Asystent jest teraz niedostępny. Zostaw swoje dane poniżej, a Łukasz się odezwie.',
      jobDescription: (n) => `Opis stanowiska, ${n} znaków.`,
      showIt: 'Pokaż',
      matches: 'W czym pasuje',
      discuss: 'Do omówienia',
      saved: 'Łukasz ma już Twoje dane. Odpowie e-mailem.',
      sendFailedEmail: 'Nie udało się wysłać. Sprawdź adres e-mail i spróbuj ponownie.',
      sendFailed: 'Nie udało się wysłać. Spróbuj za minutę.',
      sent: (email) => `Wysłane. Odpowiem na ${email}.`,
      close: 'Zamknij',
      wantReply: 'Chcesz, żebym się odezwał?',
      leaveDetails: 'Zostaw swoje dane',
      formLead: 'Zostaw swoje dane, a odpowiem e-mailem. Ta rozmowa zostanie dołączona.',
      name: 'Imię',
      email: 'E-mail',
      about: 'W jakiej sprawie',
      optional: '(opcjonalnie)',
      sending: 'Wysyłanie',
      send: 'Wyślij',
      cancel: 'Anuluj',
      thinking: 'Myślę',
      askNext: 'Zapytaj dalej:',
      orNext: ' lub ',
      walkthrough: 'Poproś o omówienie',
      askQuestion: 'Zapytaj mnie o moją pracę',
      askButton: 'Zapytaj',
      conversation: 'Rozmowa',
      newConversation: 'Nowa rozmowa',
      closeConversation: 'Zamknij rozmowę',
      emptyHeading: 'Zapytaj mnie o moją pracę.',
      contactPlaceholder: 'Imię, e-mail i w jakiej sprawie',
      notice: 'Rozmawiasz z asystentem AI, który może popełniać błędy.',
      savedNotice: 'Rozmowy są zapisywane.',
    },
  },
}

export const LangContext = createContext('en')
export const useLang = () => useContext(LangContext)
export const useT = () => STRINGS[useLang()]
