import { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Text } from '@react-three/drei'
import * as THREE from 'three'

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
const keyMat     = new THREE.MeshStandardMaterial({ color: '#EAE0C8',      roughness: 0.7,  metalness: 0.05 })
const keyDark    = new THREE.MeshStandardMaterial({ color: COLOR.creamDim, roughness: 0.7,  metalness: 0.05 })
const ledRed     = new THREE.MeshStandardMaterial({ color: '#FF3A2E', emissive: '#FF1A14', emissiveIntensity: 1.5, roughness: 0.4 })

/* ───── Keyboard grid ───────────────────────────────────────── */
function Keyboard({ rows = 4, cols = 11 }) {
  const keys = []
  const kw = 0.22, kh = 0.18, kd = 0.12, gap = 0.02
  const totalW = cols * (kw + gap) - gap
  const totalH = rows * (kh + gap) - gap
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * (kw + gap) - totalW / 2 + kw / 2 + (r === 1 ? 0.05 : 0) + (r === 2 ? 0.1 : 0)
      const z = r * (kh + gap) - totalH / 2 + kh / 2
      const isLight  = (r === 3 && c === 0)
      keys.push(
        <RoundedBox
          key={`${r}-${c}`}
          args={[kw, kd, kh]}
          radius={0.018}
          smoothness={3}
          position={[x, kd / 2, z]}
          material={isLight ? keyDark : keyMat}
          castShadow
          receiveShadow
        />
      )
    }
  }
  return <group>{keys}</group>
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

const PHOSPHOR = '#9bff5e'
const CHARS_PER_LINE = 46
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

const ASYNC_COMMANDS = {
  ip:      { url: `${API_BASE}/ip` },
  weather: { url: `${API_BASE}/weather` },
  visits: {
    url: `${API_BASE}/visits`,
    format: (d) => [`visit #${d?.count ?? '?'}`],
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
function Screen({ width, height, boot, lines, input, hint }) {
  const flickerRef = useRef()
  const cursorRef  = useRef()
  const sweepRef   = useRef()
  const contentGroupRef = useRef()

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
    // Boot sweep — bright bar travels top → bottom during 0..0.7 of boot
    if (sweepRef.current) {
      if (boot > 0 && boot < 0.85) {
        const p = Math.min(1, boot / 0.7)
        sweepRef.current.visible = true
        sweepRef.current.position.y = height / 2 - p * height
        sweepRef.current.material.opacity = 0.9 * (1 - Math.max(0, (boot - 0.7) / 0.15))
      } else {
        sweepRef.current.visible = false
      }
    }
  })

  const padX  = -width / 2 + 0.10
  const halfH = height / 2

  const contentVisible = boot > 0.6
  const contentOpacity = THREE.MathUtils.smoothstep(boot, 0.6, 1.0)

  // Text sizing
  const fontSize = 0.048
  const lineHeight = 0.072
  const topY = halfH - 0.18
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

      {/* Warm-up glow when booting */}
      {boot > 0 && boot < 1 && (
        <mesh position={[0, 0, 0.001]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial color={PHOSPHOR} transparent opacity={Math.max(0, 0.06 * (1 - Math.abs(boot - 0.5) * 2))} depthWrite={false} />
        </mesh>
      )}

      {/* Boot scan sweep */}
      <mesh ref={sweepRef} position={[0, halfH, 0.0025]} visible={false}>
        <planeGeometry args={[width, 0.04]} />
        <meshBasicMaterial color={PHOSPHOR} transparent opacity={0.9} depthWrite={false} />
      </mesh>

      {contentVisible && (
        <group ref={contentGroupRef}>
          {/* Header */}
          <Text
            position={[padX, halfH - 0.08, 0.003]}
            fontSize={0.038}
            font={MONO_FONT_BOLD}
            color={PHOSPHOR}
            anchorX="left"
            anchorY="top"
            letterSpacing={0.10}
            fillOpacity={contentOpacity}
          >
            ◉ LB MARK I · ONLINE
          </Text>

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

          {/* Prompt + live input */}
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
            {`$ ${input}`}
          </Text>

          {/* Blinking cursor block — placed at end of input */}
          <mesh
            ref={cursorRef}
            position={[
              padX + (2 + input.length) * charW + charW * 0.5,
              promptY - fontSize * 0.5,
              0.003,
            ]}
          >
            <planeGeometry args={[charW * 0.8, fontSize * 0.9]} />
            <meshBasicMaterial color={PHOSPHOR} transparent opacity={contentOpacity * 0.85} />
          </mesh>

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
  const [powerState, setPowerState] = useState('on') // 'off' | 'booting' | 'on' | 'shutting'
  const stateChangedAt = useRef(performance.now() / 1000)
  const [boot, setBoot] = useState(1)
  const [lines, setLines] = useState([
    '__pending_hello__',
    "type 'help' to begin.",
  ])

  useEffect(() => {
    let cancelled = false
    fetchLines('https://api.bondarewicz.com/v1/hello').then((out) => {
      if (cancelled) return
      setLines((prev) => {
        const idx = prev.indexOf('__pending_hello__')
        if (idx === -1) return prev
        return [...prev.slice(0, idx), ...out, ...prev.slice(idx + 1)]
      })
    })
    return () => { cancelled = true }
  }, [])
  const [input, setInput] = useState('')
  const inputRef = useRef(null)
  const [focused, setFocused] = useState(false)
  const isTouch = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.('(pointer: coarse)').matches ?? 'ontouchstart' in window
  }, [])

  const powered = powerState === 'on' || powerState === 'booting'

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

  // Keyboard handler — only when terminal is on
  useEffect(() => {
    if (powerState !== 'on') return
    const onKey = (e) => {
      // Ctrl+C — cancel current input line (echo `^C`, fresh prompt) — unless text is selected
      if (e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'c' || e.key === 'C')) {
        const hasSelection = (window.getSelection?.()?.toString() ?? '').length > 0
        if (!hasSelection) {
          e.preventDefault()
          setLines((prev) => [...prev, `$ ${input}^C`])
          setInput('')
          return
        }
      }
      // Let other modifier combos pass through (copy/paste/devtools)
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Enter') {
        e.preventDefault()
        const entered = input
        setInput('')
        const res = runCommand(entered)
        if (res.clear) { setLines([]); return }
        if (res.powerOff) {
          setLines((prev) => [...prev, `$ ${entered}`, 'shutting down...'])
          setTimeout(() => setPower('off'), 0)
          return
        }
        if (res.async) {
          const marker = `__pending_${Date.now()}_${Math.random().toString(36).slice(2, 6)}__`
          setLines((prev) => [...prev, `$ ${entered}`, marker])
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
          ? [...prev, `$ ${entered}`, ...res.lines]
          : [...prev, `$ ${entered}`])
        return
      }
      if (e.key === 'Backspace') {
        e.preventDefault()
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
        setInput((s) => (s.length < 48 ? s + e.key : s))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [powerState, input, setPower])

  // Shared command runner used by the touch (soft-keyboard) path
  const submit = useCallback((entered) => {
    const res = runCommand(entered)
    if (res.clear) { setLines([]); return }
    if (res.powerOff) {
      setLines((prev) => [...prev, `$ ${entered}`, 'shutting down...'])
      setTimeout(() => setPower('off'), 0)
      return
    }
    if (res.async) {
      const marker = `__pending_${Date.now()}_${Math.random().toString(36).slice(2, 6)}__`
      setLines((prev) => [...prev, `$ ${entered}`, marker])
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
      ? [...prev, `$ ${entered}`, ...res.lines]
      : [...prev, `$ ${entered}`])
  }, [setPower])

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
    // Gentle idle sway
    root.current.rotation.y = Math.sin(t * 0.18) * 0.18 - 0.05
    root.current.rotation.x = Math.sin(t * 0.22) * 0.05 - 0.18
    root.current.position.y = Math.sin(t * 0.6) * 0.04
  })

  // Body dimensions
  const W = 4.8, H = 0.55, D = 3.0

  return (
    <group ref={root} position={[0, 0, 0]}>
      {/* ── Main body (rounded chunky box) ── */}
      <RoundedBox args={[W, H, D]} radius={0.12} smoothness={6} material={cream} castShadow receiveShadow />


      {/* ── Screen recess + bezel ── */}
      <RoundedBox args={[2.1, 0.06, 1.5]} radius={0.04} smoothness={4}
        position={[0.95, H / 2 + 0.001, -0.4]} material={bezel} receiveShadow />
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
          hint={isTouch && !focused && powerState === 'on'}
        />
      </group>
      {/* Phosphor screen spill light — scales with boot */}
      <pointLight position={[0.95, H / 2 + 0.45, -0.4]} intensity={boot * 0.9} color="#7cff5a" distance={2.4} decay={2} />



      {/* ── Power button (red, top of left cluster) ── */}
      <group
        position={[-W / 2 + 0.55, H / 2 + 0.03 + (powered ? 0 : -0.012), -0.62]}
        onClick={togglePower}
        onPointerOver={(e) => { e.stopPropagation(); setCursor('pointer')() }}
        onPointerOut={setCursor('auto')}
      >
        <RoundedBox
          args={[0.22, 0.06, 0.18]}
          radius={0.018}
          smoothness={3}
          material={powered ? powerOnMat : powerOffMat}
          castShadow
        />
      </group>

      {/* ── Cluster buttons under the power key (cream / teal / mustard mix) ── */}
      {[creamDark, tealMat, creamDark, mustardMat].map((mat, i) => (
        <RoundedBox
          key={`lbtn-${i}`}
          args={[0.22, 0.06, 0.18]}
          radius={0.018}
          smoothness={3}
          position={[-W / 2 + 0.55, H / 2 + 0.03, -0.38 + i * 0.24]}
          material={mat}
          castShadow
        />
      ))}

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


      {/* ── Keyboard ── */}
      <group position={[0.4, H / 2 + 0.001, 0.95]}>
        <Keyboard />
      </group>




      {/* ── Stenciled labels ── */}
      <Label position={[-W / 2 + 0.45, H / 2 + 0.01, -1.0]} rotation={[-Math.PI / 2, 0, 0]} size={0.04}>
        {`MODEL · LB MARK I\nSER · 0401 MMXXVI\nMADE IN PL`}
      </Label>
      <Label position={[W / 2 - 1.5, H / 2 + 0.01, 0.55]} rotation={[-Math.PI / 2, 0, 0]} size={0.025}>
        TX/RX · CH-04
      </Label>
      <Label position={[-W / 2 + 0.50, H / 2 + 0.01, -1.20]} rotation={[-Math.PI / 2, 0, 0]} size={0.028} anchorY="middle">
        POWER
      </Label>
    </group>
  )
}
