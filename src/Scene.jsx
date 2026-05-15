import { Canvas } from '@react-three/fiber'
import { Environment, ContactShadows, OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import Device from './Device.jsx'

export default function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [3.6, 3.2, 5.0], fov: 32 }}
      gl={{ antialias: true }}
      style={{ background: 'transparent' }}
    >
      <color attach="background" args={['#E6E2D5']} />
      <fog attach="fog" args={['#E6E2D5', 12, 22]} />

      <ambientLight intensity={0.55} />
      <directionalLight
        position={[6, 8, 5]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <directionalLight position={[-5, 3, -2]} intensity={0.5} color="#cdd9e8" />
      <pointLight position={[2, 1.6, 1.4]} intensity={0.4} color="#bff58a" distance={4} />

      <Suspense fallback={null}>
        <Device />
        <Environment preset="studio" />
      </Suspense>

      <ContactShadows
        position={[0, -0.62, 0]}
        opacity={0.55}
        scale={14}
        blur={2.6}
        far={4}
        resolution={1024}
        color="#3a3528"
      />

      <OrbitControls
        enablePan
        enableZoom
        minDistance={3.5}
        maxDistance={9}
        zoomSpeed={0.6}
        panSpeed={0.6}
        screenSpacePanning
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.48}
        minAzimuthAngle={-Math.PI * 0.4}
        maxAzimuthAngle={Math.PI * 0.4}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.5}
        touches={{ ONE: 0, TWO: 2 }}
      />
    </Canvas>
  )
}
