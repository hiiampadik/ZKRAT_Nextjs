// @ts-nocheck
import * as THREE from 'three'
import { useRef, useMemo, useState, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture, Environment, Lightformer } from '@react-three/drei'
import { CapsuleCollider, Physics, RigidBody } from '@react-three/rapier'
import { EffectComposer, N8AO } from '@react-three/postprocessing'
import styles from '../styles/Home.module.scss'

const CONNECTOR_SCALE = 7
const CONNECTOR_COUNT = 7

const connectorStyle = { color: '#111', roughness: 0.85 }
const shuffle = () => Array.from({ length: CONNECTOR_COUNT }, () => ({ ...connectorStyle }))

function Connector({
  position,
  children,
  vec = new THREE.Vector3(),
  scale,
  r = THREE.MathUtils.randFloatSpread,
  index,
  onScreenUpdate,
  onHover,
  onDragChange,
  ...props
}: any) {
  const api = useRef<any>(null)
  const pos = useMemo(() => position || [r(10), r(10), r(10)], [])
  const [hovered, setHovered] = useState(false)
  const dragging = useRef(false)
  const dragStart = useRef(new THREE.Vector2())
  const wasDragged = useRef(false)
  const velocity = useRef(new THREE.Vector2())
  const worldPos = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ mouse, viewport, camera, size }) => {
    // Attract toward center — weaken force when close to avoid jitter
    const t = api.current?.translation()
    if (t) {
      const dist = Math.sqrt(t.x * t.x + t.y * t.y + t.z * t.z)
      const strength = dist > 1 ? 0.2 : dist * 0.1
      api.current.applyImpulse(vec.set(-t.x * strength, -t.y * strength, -t.z * strength))
    }

    // Project world position to screen for label overlay
    const translation = api.current?.translation()
    if (translation && onScreenUpdate) {
      worldPos.set(translation.x, translation.y, translation.z)
      worldPos.project(camera)
      const x = (worldPos.x * 0.5 + 0.5) * size.width
      const y = (-worldPos.y * 0.5 + 0.5) * size.height
      onScreenUpdate(index, x, y)
    }

    if (dragging.current && translation) {
      const targetX = (mouse.x * viewport.width) / 2
      const targetY = (mouse.y * viewport.height) / 2
      const springFactor = 0.12
      const newX = translation.x + (targetX - translation.x) * springFactor
      const newY = translation.y + (targetY - translation.y) * springFactor
      velocity.current.set(newX - translation.x, newY - translation.y)
      api.current.setNextKinematicTranslation({ x: newX, y: newY, z: translation.z })
    }
  })

  const onPointerDown = (e: any) => {
    e.stopPropagation()
    ;(e.target as HTMLElement)?.setPointerCapture?.(e.pointerId)
    dragging.current = true
    wasDragged.current = false
    dragStart.current.set(e.clientX, e.clientY)
    api.current?.setBodyType(2)
    onDragChange?.(index, true)
  }

  const onPointerUp = (e: any) => {
    if (!dragging.current) return
    dragging.current = false
    api.current?.setBodyType(0)
    api.current?.wakeUp()
    onDragChange?.(index, false)

    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < 5) {
      console.log(index)
    } else {
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
    <RigidBody linearDamping={6} angularDamping={4} friction={0.5} restitution={0.1} position={pos} ref={api} colliders={false}>
      <CapsuleCollider args={[0.06 * CONNECTOR_SCALE, 0.05 * CONNECTOR_SCALE]} />
      <group
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          onHover?.(index, true)
        }}
        onPointerOut={() => {
          setHovered(false)
          onHover?.(index, false)
        }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {children ? children : <Model hovered={hovered} {...props} />}
      </group>
    </RigidBody>
  )
}

function Model({ hovered = false }: any): any {
  const texture = useTexture('/screen.jpg')
  return (
    <mesh castShadow receiveShadow>
      <capsuleGeometry args={[0.05 * CONNECTOR_SCALE, 0.12 * CONNECTOR_SCALE, 16, 32]} />
      <meshStandardMaterial color={hovered ? '#fff' : '#999'}  metalness={hovered ? 0.7 : 0.2} roughness={hovered ? 0.6 : 0.4} map={texture} />
    </mesh>
  )
}

export default function Scene() {
  const connectors = useMemo(() => shuffle(), [])
  const [labels, setLabels] = useState<Record<number, { x: number; y: number }>>({})
  const [hoveredSet, setHoveredSet] = useState<Set<number>>(new Set())

  const onScreenUpdate = useCallback((index: number, x: number, y: number) => {
    setLabels((prev) => {
      const old = prev[index]
      if (old && Math.abs(old.x - x) < 0.5 && Math.abs(old.y - y) < 0.5) return prev
      return { ...prev, [index]: { x, y } }
    })
  }, [])

  const onHover = useCallback((index: number, hovered: boolean) => {
    setHoveredSet((prev) => {
      const next = new Set(prev)
      if (hovered) next.add(index)
      else next.delete(index)
      return next
    })
  }, [])

  const draggedRef = useRef<number | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const onDragChange = useCallback((index: number, isDragging: boolean) => {
    draggedRef.current = isDragging ? index : null
    setDraggedIndex(isDragging ? index : null)
  }, [])

  return (
    <>
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
            <Connector key={i} index={i + 1} onScreenUpdate={onScreenUpdate} onHover={onHover} onDragChange={onDragChange} {...props} />
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
      {/* DOM overlay — labels always top-right of object center, unaffected by 3D rotation */}
      <div className={styles.labelOverlay}>
        {Object.entries(labels).map(([idx, pos]) => {
          const i = Number(idx)
          // When dragging, only show label for the dragged object
          if (draggedIndex !== null) {
            if (i !== draggedIndex) return null
          } else {
            if (!hoveredSet.has(i)) return null
          }
          return (
              <div
                  key={i}
                  className={styles.label}
                  style={{
                    left: pos.x + 15,
                    top: pos.y - 25,
                    backdropFilter: 'blur(5px)',
                    WebkitBackdropFilter: 'blur(5px)',
                  }}
              >
                <p>Lorem Ipsum</p>
                <p>2025</p>
                <p>{i}</p>
              </div>
          )
        })}
      </div>
    </>
  )
}
