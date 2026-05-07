import { useRef, useMemo, useState } from 'react'
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

/* ───── The CRT screen ──────────────────────────────────────── */
function Screen({ width, height, powered }) {
  const flickerRef = useRef()
  const cursorRef  = useRef()

  const scanTex = useMemo(() => {
    const tex = makeScanlineTexture()
    tex.repeat.set(1, height * 180)
    return tex
  }, [height])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (cursorRef.current) cursorRef.current.visible = powered && Math.floor(t * 2) % 2 === 0
    if (flickerRef.current) {
      const r = Math.random()
      flickerRef.current.material.opacity = (powered && r > 0.992) ? 0.15 : 0
    }
  })

  const PHOSPHOR = '#9bff5e'

  const padX  = -width / 2 + 0.10
  const halfH = height / 2

  return (
    <group>
      {/* Pitch-black CRT background */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#040705" />
      </mesh>

      {powered && (
        <>
          {/* Tiny header line */}
          <Text
            position={[padX, halfH - 0.08, 0.003]}
            fontSize={0.038}
            font={MONO_FONT_BOLD}
            color={PHOSPHOR}
            anchorX="left"
            anchorY="top"
            letterSpacing={0.10}
          >
            ◉ LB MARK I · ONLINE
          </Text>

          {/* Paragraph 1 */}
          <Text
            position={[padX, halfH - 0.22, 0.003]}
            fontSize={0.062}
            font={MONO_FONT}
            color={PHOSPHOR}
            anchorX="left"
            anchorY="top"
            maxWidth={width - 0.20}
            lineHeight={1.5}
            letterSpacing={0.015}
          >
            First engineering hire, grew through an acquisition, now setting the technical direction with AI at the center of how the team builds and ships.
          </Text>

          {/* Paragraph 2 */}
          <Text
            position={[padX, -0.08, 0.003]}
            fontSize={0.062}
            font={MONO_FONT}
            color={PHOSPHOR}
            anchorX="left"
            anchorY="top"
            maxWidth={width - 0.20}
            lineHeight={1.5}
            letterSpacing={0.015}
          >
            Currently shipping multi-agent framework that helps with agentic workloads and eval testing.
          </Text>

          {/* Tiny prompt at bottom */}
          <Text
            position={[padX, -halfH + 0.12, 0.003]}
            fontSize={0.038}
            font={MONO_FONT_BOLD}
            color={PHOSPHOR}
            anchorX="left"
            anchorY="top"
            letterSpacing={0.10}
          >
            $ hello@bondarewicz.com
          </Text>

          {/* Blinking cursor block */}
          <mesh ref={cursorRef} position={[padX + 0.66, -halfH + 0.103, 0.003]}>
            <planeGeometry args={[0.020, 0.038]} />
            <meshBasicMaterial color={PHOSPHOR} />
          </mesh>

          {/* Scanlines */}
          <mesh position={[0, 0, 0.005]}>
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial map={scanTex} transparent opacity={0.18} depthWrite={false} />
          </mesh>

          {/* Soft vignette (only at extreme edges) */}
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

          {/* Flicker */}
          <mesh ref={flickerRef} position={[0, 0, 0.007]}>
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial color={PHOSPHOR} transparent opacity={0} depthWrite={false} />
          </mesh>
        </>
      )}
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
  const [powered, setPowered] = useState(true)
  const togglePower = (e) => { e.stopPropagation(); setPowered((p) => !p) }
  const setCursor = (c) => () => { document.body.style.cursor = c }

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
    // Idle floating rotation
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
      <group position={[0.95, H / 2 + 0.07, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <Screen width={1.85} height={1.3} powered={powered} />
      </group>
      {/* Phosphor screen spill light — only when powered */}
      <pointLight position={[0.95, H / 2 + 0.45, -0.4]} intensity={powered ? 0.9 : 0} color="#7cff5a" distance={2.4} decay={2} />



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
