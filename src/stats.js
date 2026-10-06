// Visit stats on my own Matomo (stats.bondarewicz.com): cookieless, IPs anonymised, nothing shared.
// Only runs on the live site, and never for visitors who opted out or ask not to be tracked.
const MATOMO = 'https://stats.bondarewicz.com/'
const SITE_ID = '1'
const OPT_OUT = 'stats-opt-out'

export function statsOptedOut() {
  try {
    return localStorage.getItem(OPT_OUT) === '1'
  } catch {
    return false
  }
}

export function setStatsOptOut(out) {
  try {
    if (out) localStorage.setItem(OPT_OUT, '1')
    else localStorage.removeItem(OPT_OUT)
  } catch {
    // storage blocked: nothing loads on the next visit either way
  }
  if (out && window._paq) window._paq.push(['optUserOut'])
}

export function startStats() {
  if (!/(^|\.)bondarewicz\.com$/.test(location.hostname)) return
  if (statsOptedOut() || navigator.doNotTrack === '1' || window.globalPrivacyControl) return
  const _paq = (window._paq = window._paq || [])
  _paq.push(['disableCookies'])
  _paq.push(['setDoNotTrack', true])
  _paq.push(['trackPageView'])
  _paq.push(['enableLinkTracking'])
  _paq.push(['setTrackerUrl', MATOMO + 'matomo.php'])
  _paq.push(['setSiteId', SITE_ID])
  const s = document.createElement('script')
  s.async = true
  s.src = MATOMO + 'matomo.js'
  document.head.appendChild(s)
}
