import { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Text } from '@react-three/drei'
import * as THREE from 'three'
import { GIT_SHA } from './version.js'

const MONO_FONT = 'https://cdn.jsdelivr.net/gh/JetBrains/JetBrainsMono@v2.304/fonts/ttf/JetBrainsMono-Regular.ttf'
const MONO_FONT_BOLD = 'https://cdn.jsdelivr.net/gh/JetBrains/JetBrainsMono@v2.304/fonts/ttf/JetBrainsMono-Bold.ttf'

/* ───── Palette ──────────────────────────────────────────── */
const COLOR = {
  cream:    '#E8DFC4',
  creamDim: '#D6CBA9',
  navy:     '#2A3445',
  mustard:  '#E29B1D',
  teal:     '#7AB5A0',
  red:      '#C7472B',
}

/* ───── Materials (reusable refs) ───────────────────────────── */
const cream      = new THREE.MeshStandardMaterial({ color: COLOR.cream,    roughness: 0.55, metalness: 0.05 })
const creamDark  = new THREE.MeshStandardMaterial({ color: COLOR.creamDim, roughness: 0.65, metalness: 0.04 })
const bezel      = new THREE.MeshStandardMaterial({ color: COLOR.cream,    roughness: 0.55, metalness: 0.05 })
const tealMat    = new THREE.MeshStandardMaterial({ color: COLOR.teal,     roughness: 0.55, metalness: 0.05 })
const mustardMat = new THREE.MeshStandardMaterial({ color: COLOR.mustard,  roughness: 0.5,  metalness: 0.05, emissive: '#5a3a08', emissiveIntensity: 0.15 })
const keyMat     = new THREE.MeshStandardMaterial({ color: '#F6EFD4',      roughness: 0.55, metalness: 0.04 })
const keyDark    = new THREE.MeshStandardMaterial({ color: '#D6CBA9',      roughness: 0.6,  metalness: 0.04 })
const trayMat    = new THREE.MeshStandardMaterial({ color: '#C9BFA0',      roughness: 0.78, metalness: 0.03 })
const ledRed     = new THREE.MeshStandardMaterial({ color: '#FF3A2E', emissive: '#FF1A14', emissiveIntensity: 1.5, roughness: 0.4 })

/* ───── Keyboard — QWERTY with labels, clickable, press animation ─── */
const KB_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P', { id: 'ENTER', label: 'enter', w: 1.8 }],
  ['A','S','D','F','G','H','J','K','L', { id: 'BACKSPACE', label: 'backspace', w: 2.4 }],
  ['Z','X','C','V','B','N','M', { id: '@', label: '@', w: 1 }],
  [{ id: 'SPACE', label: '', w: 7 }],
]

function Keyboard({ pressedAtRef, onChar, onAction }) {
  const kw = 0.180, kh = 0.150, kd = 0.07, gap = 0.024
  const baseY = kd / 2
  const keyRefs = useRef({})

  const sized = useMemo(() => KB_ROWS.map((row) =>
    row.map((k) => typeof k === 'string' ? { id: k, label: k, w: 1 } : k)
  ), [])

  const rowWidth = (row) => row.reduce((acc, k) => acc + k.w * kw, 0) + (row.length - 1) * gap
  const maxRowW = Math.max(...sized.map(rowWidth))
  const rows = sized.length
  const totalH = rows * (kh + gap) - gap

  // Press animation — read pressed timestamps every frame and depress keys briefly
  useFrame(() => {
    if (!pressedAtRef?.current) return
    const now = performance.now()
    for (const id in keyRefs.current) {
      const ref = keyRefs.current[id]
      if (!ref) continue
      const t = pressedAtRef.current[id]
      const elapsed = t == null ? Infinity : now - t
      const k = elapsed < 140 ? (1 - elapsed / 140) : 0
      ref.position.y = baseY - k * 0.035
    }
  })

  const handleClick = (k) => (e) => {
    e?.stopPropagation?.()
    pressedAtRef.current[k.id] = performance.now()
    if (k.id === 'ENTER') onAction?.('enter')
    else if (k.id === 'BACKSPACE') onAction?.('backspace')
    else if (k.id === 'SPACE') onChar?.(' ')
    else if (k.id === '@') onChar?.('@')
    else onChar?.(k.id.toLowerCase())
  }

  const setCur = (c) => (e) => { e?.stopPropagation?.(); document.body.style.cursor = c }

  const items = []
  sized.forEach((row, r) => {
    // Center each row inside the keyboard footprint
    const rw = rowWidth(row)
    let cursorX = -rw / 2
    const z = r * (kh + gap) - totalH / 2 + kh / 2
    row.forEach((k, c) => {
      const w = k.w * kw
      const x = cursorX + w / 2
      items.push(
        <group
          key={`g-${r}-${c}`}
          position={[x, 0, z]}
          onClick={handleClick(k)}
          onPointerOver={setCur('pointer')}
          onPointerOut={setCur('auto')}
        >
          <RoundedBox
            ref={(el) => { if (el) keyRefs.current[k.id] = el }}
            args={[w, kd, kh]}
            radius={0.018}
            smoothness={3}
            position={[0, baseY, 0]}
            material={keyDark}
            castShadow
            receiveShadow
          />
          {k.label && (
            <Text
              position={[0, kd + 0.003, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={k.id === 'ENTER' || k.id === 'BACKSPACE' ? 0.045 : 0.075}
              font={MONO_FONT_BOLD}
              color="#3a3320"
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.04}
            >
              {k.label}
            </Text>
          )}
        </group>
      )
      cursorX += w + gap
    })
  })

  return <group>{items}</group>
}

/* ───── Scanline texture (procedural) ───────────────────────── */
function makeScanlineTexture() {
  const c = document.createElement('canvas')
  c.width = 2; c.height = 4
  const ctx = c.getContext('2d')
  ctx.fillStyle = 'rgba(0,0,0,0)';   ctx.fillRect(0, 0, 2, 2)
  ctx.fillStyle = 'rgba(0,0,0,0.55)';ctx.fillRect(0, 2, 2, 2)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.magFilter = THREE.NearestFilter
  return tex
}

/* ───── Boot stages ─────────────────────────────────────────
   off → booting (~1.4s) → on
   on  → shutting (~0.5s) → off
   `boot` is a 0..1 progress (off = 0, on = 1, in-between values during transition).
*/

const PHOSPHOR = '#E8DDB8'
const CHARS_PER_LINE = 54

// Creative shell prompt — embeds today's weekday so "happy friday" surfaces in the prompt itself
const PROMPT_PREFIX = (() => {
  const day = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()
  return `lb@mk1·${day} ❯ `
})()
// Matches lines made of QR block characters + spaces (▀ ▄ █  )
const QR_RE = /^[ ▀▄█]+$/

function wrapLine(s, width) {
  if (!s) return ['']
  const words = String(s).split(' ')
  const out = []
  let cur = ''
  for (const w of words) {
    if (!cur) { cur = w; continue }
    if ((cur + ' ' + w).length <= width) cur = cur + ' ' + w
    else { out.push(cur); cur = w }
  }
  if (cur) out.push(cur)
  // Hard-wrap any over-long single token (e.g. URLs)
  return out.flatMap((line) => {
    if (line.length <= width) return [line]
    const chunks = []
    for (let i = 0; i < line.length; i += width) chunks.push(line.slice(i, i + width))
    return chunks
  })
}

const COMMANDS = {
  help: () => [
    'available commands:',
    '  help       this list',
    '  whoami     about me',
    '  contact    email + socials',
    '  links      external links',
    '  ip         your public ip + geo',
    '  ua         your user agent',
    '  weather    local weather',
    '  visits     site visit counter',
    '  qr         render qr code',
    '  clear      clear screen',
    '  poweroff   shut it down',
  ],
  whoami: () => [
    'lukasz bondarewicz · pl',
    'first engineering hire, grew through an acquisition,',
    'now setting technical direction with AI at the center',
    'of how the team builds and ships.',
    '',
    'currently shipping a multi-agent framework for',
    'agentic workloads and eval testing.',
  ],
  contact: () => [
    'hello@bondarewicz.com',
    'github.com/bondarewicz',
  ],
  links: () => [
    'github   github.com/bondarewicz',
    'site     bondarewicz.com',
  ],
  ls: () => ['whoami  contact  links'],
}
COMMANDS.about = COMMANDS.whoami
COMMANDS.email = COMMANDS.contact
COMMANDS.cls = null  // handled inline as clear
COMMANDS.clear = null

const API_BASE = 'https://api.bondarewicz.com/v1'
const VISITS_URL = `${API_BASE}/visits`

const ASYNC_COMMANDS = {
  ip: {
    url: `${API_BASE}/ip`,
    format: (d) => {
      const pick = (...keys) => {
        for (const k of keys) {
          const v = k.split('.').reduce((o, p) => (o == null ? o : o[p]), d)
          if (v != null && v !== '') return v
        }
        return null
      }
      const ip      = pick('ip', 'query', 'addr')
      const city    = pick('city', 'location.city')
      const region  = pick('region', 'region_name', 'subdivision', 'state')
      const country = pick('country_name', 'country', 'country_code', 'cc')
      const isp     = pick('isp', 'org', 'organization', 'asn_org')
      const where = [city, region, country].filter(Boolean).join(', ')
      const tail = isp ? ` via ${isp}` : ''
      if (!ip) return ['no IP returned.']
      if (!where) return [`Your IP is ${ip}${tail}.`]
      return [`Your IP is ${ip}, coming from ${where}${tail}.`]
    },
  },
  weather: { url: `${API_BASE}/weather` },
  visits: {
    url: VISITS_URL,
    format: (d) => {
      const n = Number(d?.count ?? d?.value)
      return Number.isFinite(n) ? [`${n} visits`] : ['no count returned.']
    },
  },
  qr: { url: `${API_BASE}/qr` },
  ua: {
    url: `${API_BASE}/ua`,
    format: (d) => {
      const pick = (...keys) => {
        for (const k of keys) {
          const v = k.split('.').reduce((o, p) => (o == null ? o : o[p]), d)
          if (v) return v
        }
        return null
      }
      const browser = pick('browser.name', 'browser', 'name') || '?'
      const bv      = pick('browser.version', 'version')
      const os      = pick('os.name', 'os', 'platform') || '?'
      const ov      = pick('os.version', 'osversion', 'platformVersion')
      const b = bv ? `${browser} ${bv}` : browser
      const o = ov ? `${os} ${ov}` : os
      return [`You are using ${b} on ${o}.`]
    },
  },
}

async function fetchLines(url, formatter) {
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } })
    const text = (await r.text()).trim()
    if (!r.ok) return [`http ${r.status}: ${text || r.statusText}`]
    let parsed
    try { parsed = JSON.parse(text) } catch { parsed = text }
    if (formatter) {
      try { return formatter(parsed) }
      catch (e) { return [`format error: ${e.message}`] }
    }
    if (parsed === null) return ['null']
    if (typeof parsed === 'string') return parsed.split('\n')
    if (typeof parsed === 'number' || typeof parsed === 'boolean') return [String(parsed)]
    return JSON.stringify(parsed, null, 2).split('\n')
  } catch (e) {
    return [`error: ${e.message || 'request failed'}`]
  }
}

function runCommand(raw) {
  const trimmed = raw.trim()
  if (!trimmed) return { lines: [] }
  const parts = trimmed.split(/\s+/)
  const head = parts[0].toLowerCase()
  const rest = parts.slice(1).join(' ')

  if (head === 'clear' || head === 'cls') return { clear: true }
  if (head === 'poweroff' || head === 'shutdown') return { powerOff: true }
  if (head === 'sudo') {
    // xkcd #149
    if (trimmed.toLowerCase() === 'sudo make me a sandwich') return { lines: ['okay.'] }
    return { lines: [
      'sudo: you are not in the sudoers file.',
      'this incident will be reported.',
    ] }
  }
  if (ASYNC_COMMANDS[head]) {
    const entry = ASYNC_COMMANDS[head]
    const url = typeof entry.url === 'function' ? entry.url(rest) : entry.url
    return { async: { url, format: entry.format } }
  }
  const fn = COMMANDS[head]
  if (typeof fn === 'function') return { lines: fn() }
  return { lines: [`command not found: ${head}  (try 'help')`] }
}

/* ───── The CRT screen ──────────────────────────────────────── */
function Screen({ width, height, boot, lines, input, hint, ready }) {
  const flickerRef = useRef()
  const cursorRef  = useRef()
  const scanlineRef = useRef()
  const topMaskRef = useRef()
  const bottomMaskRef = useRef()
  const contentGroupRef = useRef()

  const promptPrefix = PROMPT_PREFIX

  const scanTex = useMemo(() => {
    const tex = makeScanlineTexture()
    tex.repeat.set(1, height * 180)
    return tex
  }, [height])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (cursorRef.current) cursorRef.current.visible = boot > 0.95 && Math.floor(t * 2) % 2 === 0
    if (flickerRef.current) {
      const r = Math.random()
      flickerRef.current.material.opacity = (boot > 0.95 && r > 0.992) ? 0.12 : 0
    }
    // Authentic CRT power-on sequence:
    //   ~0.00–0.22: filament/phosphor warm-up glow rising
    //   ~0.20–0.55: bright horizontal scan line forms at center (electron beam starts)
    //   ~0.40–0.65: vertical deflection "opens" the screen — top/bottom masks retract
    //   ~0.65–1.00: full image stabilizes, content fades in, micro-flicker on top
    if (scanlineRef.current) {
      // Gaussian-ish intensity centered at boot=0.32, sigma=0.10
      const dx = (boot - 0.32) / 0.10
      const intensity = Math.exp(-dx * dx)
      const visible = intensity > 0.04 && boot < 0.62
      scanlineRef.current.visible = visible
      if (visible) {
        scanlineRef.current.material.opacity = intensity * 0.95
        // line grows thicker as the beam stabilizes, then snaps thin again
        const thickness = 0.012 + intensity * 0.024
        scanlineRef.current.scale.y = thickness / 0.02
      }
    }
    if (topMaskRef.current && bottomMaskRef.current) {
      // Masks fully cover (scale 1) until boot 0.40, retract to 0 by 0.62
      const s = boot < 0.40 ? 1 : Math.max(0, 1 - (boot - 0.40) / 0.22)
      topMaskRef.current.scale.y = s
      bottomMaskRef.current.scale.y = s
    }
  })

  const padX  = -width / 2 + 0.10
  const halfH = height / 2

  const contentVisible = boot > 0.6
  const contentOpacity = THREE.MathUtils.smoothstep(boot, 0.6, 1.0)

  // Text sizing
  const fontSize = 0.048
  const lineHeight = 0.072
  const topY = halfH - 0.10
  const charW = fontSize * 0.62

  // QR sizing — small + tight so a typical QR fits the screen
  const qrFontSize = 0.030
  const qrLineHeight = 0.030

  // Classify each buffered line into items with their kind + row height
  const items = useMemo(() => {
    const out = []
    for (const ln of lines) {
      const display = typeof ln === 'string' && ln.startsWith('__pending_') ? '...' : ln
      const str = typeof display === 'string' ? display : String(display)
      if (str && QR_RE.test(str)) {
        out.push({ text: str, kind: 'qr' })
      } else {
        for (const w of wrapLine(str, CHARS_PER_LINE)) out.push({ text: w, kind: 'text' })
      }
    }
    return out
  }, [lines])

  // Vertical capacity (top edge → bottom edge, minus padding for prompt)
  const bottomLimit = -halfH + 0.14
  const promptH = lineHeight + 0.01
  const cap = topY - bottomLimit - promptH

  // Pack items from the end backwards until we'd overflow
  const visible = useMemo(() => {
    let used = 0
    const out = []
    for (let i = items.length - 1; i >= 0; i--) {
      const h = items[i].kind === 'qr' ? qrLineHeight : lineHeight
      if (used + h > cap) break
      used += h
      out.unshift(items[i])
    }
    return out
  }, [items, cap])

  // Lay out: assign each item a Y position; promptY follows the last
  let y = topY
  const placed = visible.map((item) => {
    const at = y
    y -= item.kind === 'qr' ? qrLineHeight : lineHeight
    return { ...item, y: at }
  })
  const promptY = y - 0.01

  return (
    <group>
      {/* Pitch-black CRT background */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#040705" />
      </mesh>

      {/* Cathode warm-up glow — soft phosphor wash that builds and fades */}
      {boot > 0 && boot < 0.7 && (
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial
            color={PHOSPHOR}
            transparent
            opacity={Math.max(0, 0.12 * Math.exp(-Math.pow((boot - 0.28) / 0.18, 2)))}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Center "first scan" line — the electron beam striking the phosphor before vertical deflection kicks in */}
      <mesh ref={scanlineRef} position={[0, 0, 0.0035]} visible={false}>
        <planeGeometry args={[width, 0.02]} />
        <meshBasicMaterial color={PHOSPHOR} transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Top occlusion mask — retracts toward the top edge as the screen "opens" vertically */}
      {boot < 0.65 && (
        <group ref={topMaskRef} position={[0, halfH, 0.004]}>
          <mesh position={[0, -halfH / 2, 0]}>
            <planeGeometry args={[width, halfH]} />
            <meshBasicMaterial color="#040705" />
          </mesh>
        </group>
      )}

      {/* Bottom occlusion mask */}
      {boot < 0.65 && (
        <group ref={bottomMaskRef} position={[0, -halfH, 0.004]}>
          <mesh position={[0, halfH / 2, 0]}>
            <planeGeometry args={[width, halfH]} />
            <meshBasicMaterial color="#040705" />
          </mesh>
        </group>
      )}

      {contentVisible && (
        <group ref={contentGroupRef}>
          {/* Buffered lines — text rows are word-wrapped, QR rows render tight + small */}
          {placed.map((item, i) => (
            <Text
              key={`ln-${i}-${item.text}`}
              position={[padX, item.y, 0.003]}
              fontSize={item.kind === 'qr' ? qrFontSize : fontSize}
              font={MONO_FONT}
              color={PHOSPHOR}
              anchorX="left"
              anchorY="top"
              letterSpacing={item.kind === 'qr' ? 0 : 0.015}
              fillOpacity={contentOpacity}
            >
              {item.text}
            </Text>
          ))}

          {/* Prompt + live input — only after boot completes */}
          {ready && (
            <>
              <Text
                position={[padX, promptY, 0.003]}
                fontSize={fontSize}
                font={MONO_FONT_BOLD}
                color={PHOSPHOR}
                anchorX="left"
                anchorY="top"
                letterSpacing={0.015}
                fillOpacity={contentOpacity}
              >
                {`${promptPrefix}${input}`}
              </Text>

              {(() => {
                const cursorH = fontSize * 0.85
                // Baseline of the prompt text — adjust this factor up (down on screen) / down (up) to tweak.
                const baselineY = promptY - fontSize * 0.98
                const cursorY = baselineY + cursorH / 2
                return (
                  <mesh
                    ref={cursorRef}
                    position={[
                      padX + (promptPrefix.length + input.length) * charW + charW * 0.5,
                      cursorY,
                      0.003,
                    ]}
                  >
                    <planeGeometry args={[charW * 0.75, cursorH]} />
                    <meshBasicMaterial color={PHOSPHOR} transparent opacity={contentOpacity} />
                  </mesh>
                )
              })()}
            </>
          )}

          {hint && (
            <Text
              position={[padX, promptY - lineHeight - 0.01, 0.003]}
              fontSize={fontSize * 0.75}
              font={MONO_FONT}
              color={PHOSPHOR}
              anchorX="left"
              anchorY="top"
              letterSpacing={0.015}
              fillOpacity={contentOpacity * 0.55}
            >
              [tap screen to type]
            </Text>
          )}
        </group>
      )}

      {/* Scanlines (only when on) */}
      {boot > 0.5 && (
        <mesh position={[0, 0, 0.005]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={scanTex} transparent opacity={0.18 * contentOpacity} depthWrite={false} />
        </mesh>
      )}

      {/* Vignette */}
      {boot > 0.5 && (
        <mesh position={[0, 0, 0.006]}>
          <planeGeometry args={[width, height]} />
          <shaderMaterial
            transparent
            depthWrite={false}
            vertexShader={`
              varying vec2 vUv;
              void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
            `}
            fragmentShader={`
              varying vec2 vUv;
              void main() {
                vec2 c = vUv - 0.5;
                float d = length(c);
                float v = smoothstep(0.55, 0.95, d);
                gl_FragColor = vec4(0.0, 0.0, 0.0, v * 0.55);
              }
            `}
          />
        </mesh>
      )}

      {/* Flicker */}
      <mesh ref={flickerRef} position={[0, 0, 0.007]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color={PHOSPHOR} transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

/* ───── Stencilled label (printed on the body) ──────────────── */
function Label({ position, rotation, children, size = 0.04, color = '#5a533c', anchorY = 'top' }) {
  return (
    <Text
      position={position}
      rotation={rotation}
      fontSize={size}
      color={color}
      anchorX="left"
      anchorY={anchorY}
      letterSpacing={0.06}
      maxWidth={1.3}
      lineHeight={1.4}
    >
      {children}
    </Text>
  )
}

/* ───── The whole device ────────────────────────────────────── */
export default function Device() {
  const root = useRef()
  const [powerState, setPowerState] = useState('off') // 'off' | 'booting' | 'on' | 'shutting'
  const stateChangedAt = useRef(performance.now() / 1000)
  const [boot, setBoot] = useState(0)
  const [lines, setLines] = useState([])
  const [bootComplete, setBootComplete] = useState(false)

  // Country code derived from the visitor's IP — surfaced in the boot AUTH line
  const countryRef = useRef('??')
  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE}/ip`, { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return
        const cc = d.country || d.country_code || d.countryCode || d.cc
        if (cc) countryRef.current = String(cc).toLowerCase()
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])


  // Boot sequence — each step prints its label, dots grow incrementally, then the result reveals.
  // Token-based cancellation: incrementing the token invalidates any in-progress run.
  // We only invalidate when the user powers off / starts shutting down — NOT when the CRT
  // finishes warming up ('booting' → 'on'), so the diagnostic stream completes naturally.
  const bootTokenRef = useRef(0)
  useEffect(() => {
    if (powerState === 'off') {
      bootTokenRef.current++
      setLines([])
      setBootComplete(false)
      return
    }
    if (powerState === 'shutting') {
      bootTokenRef.current++
      setBootComplete(false)
      return
    }
    if (powerState !== 'booting') return

    bootTokenRef.current++
    const myToken = bootTokenRef.current
    const alive = () => bootTokenRef.current === myToken
    setLines([])
    setBootComplete(false)

    const delay = (ms) => new Promise((res) => setTimeout(res, ms))
    const push = (line) => {
      if (!alive()) return
      setLines((prev) => [...prev, line])
    }
    const replaceLast = (line) => {
      if (!alive()) return
      setLines((prev) => {
        if (prev.length === 0) return prev
        const next = prev.slice()
        next[next.length - 1] = line
        return next
      })
    }
    const stepDots = async (label, dotCount, result) => {
      if (!alive()) return
      push(`${label}   `)
      for (let i = 1; i <= dotCount; i++) {
        await delay(28)
        if (!alive()) return
        replaceLast(`${label}   ${'.'.repeat(i)}`)
      }
      await delay(70)
      if (!alive()) return
      replaceLast(`${label}   ${'.'.repeat(dotCount)} ${result}`)
    }

    ;(async () => {
      await delay(220)
      push('lb-mk1 · rom 0401.MMXXVI')
      await delay(160)
      await stepDots('post', 18, 'ok')
      await delay(90)
      await stepDots('ram',  9,  '64K verified')
      await delay(90)
      await stepDots('crt',  6,  'phosphor warm-up · ok')
      await delay(90)
      await stepDots('net',  12, 'link up')
      await delay(90)
      await stepDots('auth', 8,  `guest ${countryRef.current}`)
      await delay(140)
      push('sys: ready')
      if (alive()) setBootComplete(true)
    })()
  }, [powerState])
  const [input, setInput] = useState('')
  const inputRef = useRef(null)
  const [focused, setFocused] = useState(false)
  const isTouch = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(pointer: coarse)').matches ?? 'ontouchstart' in window
  }, [])

  // Shared press timestamps — animate any 3D key/button that's been hit recently
  const pressedAtRef = useRef({})
  const fbtnRefs = useRef({})
  const pressKey = useCallback((id) => {
    pressedAtRef.current[id] = performance.now()
  }, [])

  // F1–F5 mapped to commands
  const F_KEYS = useMemo(() => [
    { id: 'F1', label: 'POWER',  cmd: 'poweroff', tint: 'coral' },
    { id: 'F2', label: 'HELP',   cmd: 'help',     tint: 'cream' },
    { id: 'F3', label: 'IP',     cmd: 'ip',       tint: 'teal' },
    { id: 'F4', label: 'UA',     cmd: 'ua',       tint: 'cream' },
    { id: 'F5', label: 'VISITS', cmd: 'visits',   tint: 'mustard' },
  ], [])

  const powered = powerState === 'on' || powerState === 'booting'

  // Swap the favicon to reflect the device's power LED — coral glow when on, dim when off
  useEffect(() => {
    if (typeof document === 'undefined') return
    const on = powerState === 'on' || powerState === 'booting'
    const svg = on
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
           <defs>
             <radialGradient id="h" cx="50%" cy="50%" r="50%">
               <stop offset="0%" stop-color="#ff7a64" stop-opacity="0.95"/>
               <stop offset="40%" stop-color="#ff3a2e" stop-opacity="0.55"/>
               <stop offset="100%" stop-color="#ff1a14" stop-opacity="0"/>
             </radialGradient>
             <radialGradient id="c" cx="50%" cy="50%" r="50%">
               <stop offset="0%" stop-color="#ffd6cc" stop-opacity="1"/>
               <stop offset="60%" stop-color="#ff3a2e" stop-opacity="1"/>
               <stop offset="100%" stop-color="#c7472b" stop-opacity="1"/>
             </radialGradient>
           </defs>
           <circle cx="32" cy="32" r="28" fill="url(#h)"/>
           <circle cx="32" cy="32" r="12" fill="url(#c)"/>
         </svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
           <circle cx="32" cy="32" r="12" fill="#3a1614"/>
         </svg>`
    const href = `data:image/svg+xml,${encodeURIComponent(svg)}`
    document.querySelectorAll('link[rel="icon"],link[rel="shortcut icon"],link[rel="alternate icon"]').forEach((el) => el.remove())
    const link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/svg+xml'
    link.href = href
    document.head.appendChild(link)
  }, [powerState])

  const setPower = useCallback((next) => {
    setPowerState((cur) => {
      if (cur === next) return cur
      if (next === 'on' && (cur === 'off' || cur === 'shutting')) {
        stateChangedAt.current = performance.now() / 1000
        return 'booting'
      }
      if (next === 'off' && (cur === 'on' || cur === 'booting')) {
        stateChangedAt.current = performance.now() / 1000
        return 'shutting'
      }
      return cur
    })
  }, [])

  const togglePower = useCallback((e) => {
    e?.stopPropagation?.()
    setPower(powerState === 'on' || powerState === 'booting' ? 'off' : 'on')
  }, [powerState, setPower])

  const setCursor = (c) => () => { document.body.style.cursor = c }

  // Drive boot/shutdown progress
  useFrame(() => {
    const now = performance.now() / 1000
    const elapsed = now - stateChangedAt.current
    if (powerState === 'booting') {
      const p = Math.min(1, elapsed / 1.4)
      setBoot(p)
      if (p >= 1) setPowerState('on')
    } else if (powerState === 'shutting') {
      const p = Math.max(0, 1 - elapsed / 0.5)
      setBoot(p)
      if (p <= 0) setPowerState('off')
    }
  })

  // F-button press animation — drive Y offset from pressedAtRef
  useFrame(() => {
    const now = performance.now()
    for (const id in fbtnRefs.current) {
      const ref = fbtnRefs.current[id]
      if (!ref) continue
      const t = pressedAtRef.current[id]
      const elapsed = t == null ? Infinity : now - t
      const k = elapsed < 160 ? (1 - elapsed / 160) : 0
      ref.position.y = -k * 0.025
    }
  })

  // Shared command runner — used by F-keys, physical Enter, on-screen keyboard
  const submit = useCallback((entered) => {
    const res = runCommand(entered)
    if (res.clear) { setLines([]); return }
    if (res.powerOff) {
      setLines((prev) => [...prev, `${PROMPT_PREFIX}${entered}`, 'shutting down...'])
      setTimeout(() => setPower('off'), 0)
      return
    }
    if (res.async) {
      const marker = `__pending_${Date.now()}_${Math.random().toString(36).slice(2, 6)}__`
      setLines((prev) => [...prev, `${PROMPT_PREFIX}${entered}`, marker])
      fetchLines(res.async.url, res.async.format).then((out) => {
        setLines((prev) => {
          const idx = prev.indexOf(marker)
          if (idx === -1) return [...prev, ...out]
          return [...prev.slice(0, idx), ...out, ...prev.slice(idx + 1)]
        })
      })
      return
    }
    setLines((prev) => res.lines?.length
      ? [...prev, `${PROMPT_PREFIX}${entered}`, ...res.lines]
      : [...prev, `${PROMPT_PREFIX}${entered}`])
  }, [setPower])

  // Keyboard handler
  useEffect(() => {
    const onKey = (e) => {
      // F1 always toggles power — works whether terminal is on or off
      if (e.key === 'F1') {
        e.preventDefault()
        pressKey('F1')
        togglePower()
        return
      }
      // Terminal off: nothing else does anything
      if (powerState !== 'on') return
      // F2–F5 → run the bound command + animate the on-screen button
      if (/^F[2-5]$/.test(e.key)) {
        e.preventDefault()
        const fk = F_KEYS[parseInt(e.key.slice(1), 10) - 1]
        if (fk) {
          pressKey(fk.id)
          submit(fk.cmd)
        }
        return
      }
      // Ctrl+C — cancel current input line (echo `^C`, fresh prompt) — unless text is selected
      if (e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'c' || e.key === 'C')) {
        const hasSelection = (window.getSelection?.()?.toString() ?? '').length > 0
        if (!hasSelection) {
          e.preventDefault()
          setLines((prev) => [...prev, `${PROMPT_PREFIX}${input}^C`])
          setInput('')
          return
        }
      }
      // Let other modifier combos pass through (copy/paste/devtools)
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Enter') {
        e.preventDefault()
        pressKey('ENTER')
        const entered = input
        setInput('')
        const res = runCommand(entered)
        if (res.clear) { setLines([]); return }
        if (res.powerOff) {
          setLines((prev) => [...prev, `${PROMPT_PREFIX}${entered}`, 'shutting down...'])
          setTimeout(() => setPower('off'), 0)
          return
        }
        if (res.async) {
          const marker = `__pending_${Date.now()}_${Math.random().toString(36).slice(2, 6)}__`
          setLines((prev) => [...prev, `${PROMPT_PREFIX}${entered}`, marker])
          fetchLines(res.async.url, res.async.format).then((out) => {
            setLines((prev) => {
              const idx = prev.indexOf(marker)
              if (idx === -1) return [...prev, ...out]
              return [...prev.slice(0, idx), ...out, ...prev.slice(idx + 1)]
            })
          })
          return
        }
        setLines((prev) => res.lines?.length
          ? [...prev, `${PROMPT_PREFIX}${entered}`, ...res.lines]
          : [...prev, `${PROMPT_PREFIX}${entered}`])
        return
      }
      if (e.key === 'Backspace') {
        e.preventDefault()
        pressKey('BACKSPACE')
        setInput((s) => s.slice(0, -1))
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setInput('')
        return
      }
      // Printable single-char keys
      if (e.key.length === 1) {
        e.preventDefault()
        const ch = e.key
        // Animate the matching 3D key — letters by upper, space → SPACE, '@' → @
        if (ch === ' ') pressKey('SPACE')
        else if (ch === '@') pressKey('@')
        else if (/^[a-zA-Z]$/.test(ch)) pressKey(ch.toUpperCase())
        setInput((s) => (s.length < 48 ? s + ch : s))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [powerState, input, setPower, submit, pressKey, F_KEYS])

  // Live handler refs so the imperative DOM input always sees latest state
  const touchHandlersRef = useRef({})
  touchHandlersRef.current.onInput = (e) => {
    if (powerState !== 'on') return
    const v = e.target.value
    setInput(v.length > 48 ? v.slice(0, 48) : v)
  }
  touchHandlersRef.current.onKeyDown = (e) => {
    if (powerState !== 'on') return
    if (e.key === 'Enter') {
      e.preventDefault()
      const entered = inputRef.current?.value ?? ''
      setInput('')
      if (inputRef.current) inputRef.current.value = ''
      submit(entered)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setInput('')
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  // On touch devices, mount a real <input> on document.body so iOS/Android
  // can surface the soft keyboard. The input is minimally visible (iOS
  // refuses to focus inputs that look hidden) but off-screen.
  useEffect(() => {
    if (!isTouch || typeof document === 'undefined') return
    const el = document.createElement('input')
    el.type = 'text'
    el.setAttribute('autocomplete', 'off')
    el.setAttribute('autocorrect', 'off')
    el.setAttribute('autocapitalize', 'off')
    el.setAttribute('spellcheck', 'false')
    el.setAttribute('inputmode', 'text')
    el.setAttribute('enterkeyhint', 'send')
    el.setAttribute('aria-label', 'terminal input')
    Object.assign(el.style, {
      position: 'fixed',
      top: '50%',
      left: '0',
      width: '1px',
      height: '1px',
      fontSize: '16px',
      opacity: '0.01',
      color: 'transparent',
      caretColor: 'transparent',
      background: 'transparent',
      border: '0',
      outline: 'none',
      padding: '0',
      margin: '0',
    })
    const onInput = (e) => touchHandlersRef.current.onInput?.(e)
    const onKey = (e) => touchHandlersRef.current.onKeyDown?.(e)
    const onFocusEvt = () => setFocused(true)
    const onBlurEvt = () => setFocused(false)
    el.addEventListener('input', onInput)
    el.addEventListener('keydown', onKey)
    el.addEventListener('focus', onFocusEvt)
    el.addEventListener('blur', onBlurEvt)
    document.body.appendChild(el)
    inputRef.current = el
    return () => {
      el.removeEventListener('input', onInput)
      el.removeEventListener('keydown', onKey)
      el.removeEventListener('focus', onFocusEvt)
      el.removeEventListener('blur', onBlurEvt)
      el.remove()
      inputRef.current = null
    }
  }, [isTouch])

  // Native click on the canvas focuses the input. iOS Safari surfaces the
  // soft keyboard most reliably when focus() is called synchronously from a
  // real DOM click event (not R3F synthetic touchend).
  useEffect(() => {
    if (!isTouch) return
    const canvas = document.querySelector('canvas')
    if (!canvas) return
    const onClickEvt = () => inputRef.current?.focus()
    canvas.addEventListener('click', onClickEvt)
    return () => canvas.removeEventListener('click', onClickEvt)
  }, [isTouch])

  const focusTerminal = useCallback((e) => {
    e?.stopPropagation?.()
    inputRef.current?.focus()
  }, [])

  const ledOnMat  = ledRed
  const ledOffMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#3a1614', roughness: 0.6, metalness: 0.1, emissive: '#000000', emissiveIntensity: 0,
  }), [])
  const powerOnMat  = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#C7472B', roughness: 0.5, metalness: 0.05,
    emissive: '#3a0e08', emissiveIntensity: 0.35,
  }), [])
  const powerOffMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#5e2a1b', roughness: 0.55, metalness: 0.05,
  }), [])

  useFrame((state, delta) => {
    if (!root.current) return
    const t = state.clock.getElapsedTime()
    // Gentle idle sway — small amounts since the camera is near top-down
    root.current.rotation.y = Math.sin(t * 0.18) * 0.04
    root.current.rotation.x = Math.sin(t * 0.22) * 0.02
    root.current.position.y = Math.sin(t * 0.6) * 0.015
  })

  // Body dimensions
  const W = 4.8, H = 0.55, D = 3.0

  return (
    <group ref={root} position={[0, 0, 0]}>
      {/* ── Main body (rounded chunky box) ── */}
      <RoundedBox args={[W, H, D]} radius={0.12} smoothness={6} material={cream} castShadow receiveShadow />


      {/* ── Screen recess + bezel ── */}
      <RoundedBox args={[2.2, 0.06, 1.6]} radius={0.04} smoothness={4}
        position={[0.95, H / 2 + 0.001, -0.4]} material={bezel} receiveShadow />

      {/* Bezel corner screws */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh
          key={`screw-${i}`}
          position={[0.95 + sx * 0.98, H / 2 + 0.04, -0.4 + sz * 0.68]}
          material={keyDark}
          castShadow
        >
          <cylinderGeometry args={[0.022, 0.022, 0.014, 12]} />
        </mesh>
      ))}

      {/* LB-CRT serial label below screen */}
      <Label
        position={[-0.05, H / 2 + 0.01, 0.42]}
        rotation={[-Math.PI / 2, 0, 0]}
        size={0.030}
        anchorY="middle"
      >
        {'LB-CRT · 9" · P/N 0401-MMXXVI'}
      </Label>
      {/* Screen — face up, slightly raised above bezel */}
      <group
        position={[0.95, H / 2 + 0.07, -0.4]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={powered ? focusTerminal : undefined}
        onPointerOver={powered ? (e) => { e.stopPropagation(); setCursor('text')() } : undefined}
        onPointerOut={powered ? setCursor('auto') : undefined}
      >
        <Screen
          width={1.85}
          height={1.3}
          boot={boot}
          lines={lines}
          input={input}
          hint={isTouch && !focused && powerState === 'on' && bootComplete}
          ready={bootComplete}
        />
      </group>
      {/* Phosphor screen spill light — scales with boot */}
      <pointLight position={[0.95, H / 2 + 0.45, -0.4]} intensity={boot * 0.5} color="#e8ddb8" distance={2.0} decay={2} />



      {/* ── F1–F5 button cluster + labels ── */}
      {F_KEYS.map((fk, i) => {
        const z = -0.42 + i * 0.22
        const mat = fk.tint === 'coral' ? powerOnMat
                  : fk.tint === 'teal' ? tealMat
                  : fk.tint === 'mustard' ? mustardMat
                  : creamDark
        const handleFClick = (e) => {
          e?.stopPropagation?.()
          pressKey(fk.id)
          if (fk.id === 'F1') togglePower()
          else if (powerState === 'on') submit(fk.cmd)
        }
        return (
          <group key={fk.id}>
            {/* Button cap — flat slab on body */}
            <group
              position={[-W / 2 + 0.55, H / 2 + 0.03, z]}
              onClick={handleFClick}
              onPointerOver={(e) => { e.stopPropagation(); setCursor('pointer')() }}
              onPointerOut={setCursor('auto')}
            >
              <RoundedBox
                ref={(el) => { if (el) fbtnRefs.current[fk.id] = el }}
                args={[0.32, 0.07, 0.17]}
                radius={0.022}
                smoothness={3}
                material={mat}
                castShadow
              />
            </group>
            {/* Label next to button — stencilled on body */}
            <Label
              position={[-W / 2 + 0.85, H / 2 + 0.01, z]}
              rotation={[-Math.PI / 2, 0, 0]}
              size={0.038}
              anchorY="middle"
            >
              {`${fk.id} · ${fk.label}`}
            </Label>
          </group>
        )
      })}

      {/* ── Tiny power LED next to the stencil POWER label ── */}
      <mesh
        position={[-W / 2 + 0.45, H / 2 + 0.018, -1.20]}
        material={powered ? ledOnMat : ledOffMat}
      >
        <sphereGeometry args={[0.014, 18, 18]} />
      </mesh>
      <pointLight
        position={[-W / 2 + 0.45, H / 2 + 0.06, -1.20]}
        intensity={powered ? 0.14 : 0}
        color="#ff3a2e"
        distance={0.5}
      />


      {/* ── Keyboard — flat keys sit directly on the body ── */}
      <group position={[0.55, H / 2 + 0.025, 0.85]}>
        <Keyboard
          pressedAtRef={pressedAtRef}
          onChar={(ch) => {
            if (powerState !== 'on') return
            setInput((s) => (s.length < 48 ? s + ch : s))
          }}
          onAction={(action) => {
            if (powerState !== 'on') return
            if (action === 'enter') {
              const entered = input
              setInput('')
              submit(entered)
            } else if (action === 'backspace') {
              setInput((s) => s.slice(0, -1))
            }
          }}
        />
      </group>




      {/* ── Stenciled labels ── */}
      {/* POWER (top-left, next to LED) */}
      <Label position={[-W / 2 + 0.50, H / 2 + 0.01, -1.20]} rotation={[-Math.PI / 2, 0, 0]} size={0.035} anchorY="middle">
        POWER
      </Label>
      {/* Compact serial-number style label */}
      <Label position={[-W / 2 + 0.45, H / 2 + 0.01, -0.85]} rotation={[-Math.PI / 2, 0, 0]} size={0.028} anchorY="middle">
        {'S/N · LB-MK1-0401-MMXXVI-PL'}
      </Label>
      {/* DO NOT REMOVE warning bottom-left */}
      <Label position={[-W / 2 + 0.45, H / 2 + 0.01, D / 2 - 0.18]} rotation={[-Math.PI / 2, 0, 0]} size={0.028} anchorY="middle">
        {'△ DO NOT REMOVE — SERVICE BY AUTHORISED TECH ONLY'}
      </Label>
      {/* Version stamp bottom-right — clickable, links to the commit on GitHub */}
      <group
        onClick={(e) => {
          e.stopPropagation()
          window.open(`https://github.com/bondarewicz/com/commit/${GIT_SHA}`, '_blank', 'noopener,noreferrer')
        }}
        onPointerOver={(e) => { e.stopPropagation(); setCursor('pointer')() }}
        onPointerOut={setCursor('auto')}
      >
        <Label position={[W / 2 - 1.05, H / 2 + 0.01, D / 2 - 0.18]} rotation={[-Math.PI / 2, 0, 0]} size={0.028} anchorY="middle">
          {`${GIT_SHA.toUpperCase()} · CE · 2026`}
        </Label>
      </group>
    </group>
  )
}
