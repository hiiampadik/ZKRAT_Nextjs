// @ts-nocheck
import * as THREE from 'three'
import { useRef, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useTexture, Environment, Lightformer, Html } from '@react-three/drei'
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier'
import { EffectComposer, N8AO } from '@react-three/postprocessing'

const connectorStyle = { color: '#111', roughness: 0.85 }
const shuffle = () => [
  connectorStyle,
  connectorStyle,
  connectorStyle,
]

function Connector({
  position,
  children,
  vec = new THREE.Vector3(),
  scale,
  r = THREE.MathUtils.randFloatSpread,
  index,
  ...props
}: any) {
  const api = useRef<any>(null)
  const pos = useMemo(() => position || [r(10), r(10), r(10)], [])
  const [hovered, setHovered] = useState(false)
  const dragging = useRef(false)
  const dragStart = useRef(new THREE.Vector2())
  const wasDragged = useRef(false)
  const velocity = useRef(new THREE.Vector2())

  useFrame(({ mouse, viewport, clock }) => {
    const delta = Math.min(0.1, clock.getDelta())
    // Attract toward center
    api.current?.applyImpulse(vec.copy(api.current.translation()).negate().multiplyScalar(0.2))

    if (dragging.current) {
      const targetX = (mouse.x * viewport.width) / 2
      const targetY = (mouse.y * viewport.height) / 2
      const translation = api.current?.translation()
      if (translation) {
        // Lerp toward mouse — lower = softer spring
        const springFactor = 0.12
        const newX = translation.x + (targetX - translation.x) * springFactor
        const newY = translation.y + (targetY - translation.y) * springFactor
        // Track velocity from actual movement for release impulse
        velocity.current.set(newX - translation.x, newY - translation.y)
        api.current.setNextKinematicTranslation({ x: newX, y: newY, z: translation.z })
      }
    }
  })

  const onPointerDown = (e: any) => {
    e.stopPropagation()
    ;(e.target as HTMLElement)?.setPointerCapture?.(e.pointerId)
    dragging.current = true
    wasDragged.current = false
    dragStart.current.set(e.clientX, e.clientY)
    // Switch to kinematic so we can move it directly
    api.current?.setBodyType(2) // kinematicPosition
  }

  const onPointerUp = (e: any) => {
    if (!dragging.current) return
    dragging.current = false
    // Switch back to dynamic
    api.current?.setBodyType(0) // dynamic
    // Wake up the body
    api.current?.wakeUp()

    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < 5) {
      // It was a click, not a drag
      console.log(index)
    } else {
      // Apply velocity impulse based on drag movement
      const impulseStrength = 15
      api.current?.applyImpulse({
        x: velocity.current.x * impulseStrength,
        y: velocity.current.y * impulseStrength,
        z: 0,
      }, true)
    }
    velocity.current.set(0, 0)
  }

  return (
    <RigidBody linearDamping={4} angularDamping={1} friction={0.1} position={pos} ref={api} colliders={false}>
      <CuboidCollider args={[0.38, 1.27, 0.38]} />
      <CuboidCollider args={[1.27, 0.38, 0.38]} />
      <CuboidCollider args={[0.38, 0.38, 1.27]} />
      <group
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {children ? children : <Model {...props} />}
      </group>
      {hovered && index !== undefined && (
        <Html
          position={[0.8, 0.8, 0]}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
          zIndexRange={[1000, 1001]}
        >
          <div
            style={{
              color: 'white',
              fontSize: '32px',
              fontFamily: 'Rader, sans-serif',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
                mixBlendMode: 'difference',

            }}
          >
            {index}
          </div>
        </Html>
      )}
    </RigidBody>
  )
}

function Model({ children, color = '#111', roughness = 0.85 }: any) {
  const ref = useRef<any>(null)
  const { nodes } = useGLTF('/c-transformed.glb') as any
  const texture = useTexture('/screen.jpg')
  return (
    <mesh ref={ref} castShadow receiveShadow scale={10} geometry={nodes.connector.geometry}>
      <meshStandardMaterial color="#ffffff" metalness={0.9} roughness={0.4} map={texture} />
      {children}
    </mesh>
  )
}

export default function Scene() {
  const connectors = useMemo(() => shuffle(), [])

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true }}
      camera={{ position: [0, 0, 15], fov: 17.5, near: 1, far: 20 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 2,
        background: 'transparent',
      }}
    >
      <ambientLight intensity={2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={3} castShadow />
      <spotLight position={[-10, -10, 10]} angle={0.3} penumbra={1} intensity={2} />
      <Physics gravity={[0, 0, 0]}>
        {connectors.map((props, i) => (
          <Connector key={i} index={i + 1} {...props} />
        ))}
      </Physics>
      <EffectComposer disableNormalPass multisampling={8}>
        <N8AO distanceFalloff={1} aoRadius={1} intensity={4} />
      </EffectComposer>
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer form="circle" intensity={8} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
          <Lightformer form="circle" intensity={4} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
          <Lightformer form="circle" intensity={4} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={2} />
          <Lightformer form="circle" intensity={4} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={8} />
        </group>
      </Environment>
    </Canvas>
  )
}

useGLTF.preload('/c-transformed.glb')
