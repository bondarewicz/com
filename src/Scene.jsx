import { Canvas } from '@react-three/fiber'
import { Environment, ContactShadows, OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import Device from './Device.jsx'

export default function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [0.3, 8.5, 2.2], fov: 22 }}
      gl={{ antialias: true }}
      style={{ background: 'transparent' }}
    >
      <color attach="background" args={['#E6E0CE']} />
      <fog attach="fog" args={['#E6E0CE', 12, 22]} />

      <ambientLight intensity={0.65} />
      <hemisphereLight args={['#fff4dc', '#a89870', 0.55]} />
      <directionalLight
        position={[5, 9, 4]}
        intensity={1.05}
        color="#fff2d8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <directionalLight position={[-5, 4, -2]} intensity={0.30} color="#c8d6e6" />
      <pointLight position={[2, 1.6, 1.4]} intensity={0.20} color="#f6e4b4" distance={4} />

      <Suspense fallback={null}>
        <Device />
        <Environment preset="apartment" />
      </Suspense>

      <ContactShadows
        position={[0, -0.32, 0]}
        opacity={0.55}
        scale={14}
        blur={2.4}
        far={3}
        resolution={1024}
        color="#3a3528"
      />

      <OrbitControls
        enablePan
        enableZoom
        minDistance={4}
        maxDistance={10}
        zoomSpeed={0.6}
        panSpeed={0.6}
        screenSpacePanning
        minPolarAngle={Math.PI * 0.05}
        maxPolarAngle={Math.PI * 0.30}
        minAzimuthAngle={-Math.PI * 0.25}
        maxAzimuthAngle={Math.PI * 0.25}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.4}
        touches={{ ONE: 0, TWO: 2 }}
      />
    </Canvas>
  )
}
