// @ts-nocheck
import * as THREE from 'three'
import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { ConvexHullCollider, RigidBody } from '@react-three/rapier'
import { SVG_SHAPES } from './constants'
import SvgModel, { useSvgColliderVertices } from './SvgModel'
import type { SceneMode } from './constants'

export default function Connector({
  position,
  children,
  vec = new THREE.Vector3(),
  scale,
  r = THREE.MathUtils.randFloatSpread,
  index,
  onScreenUpdate,
  onHover,
  onDragChange,
  onClick,
  ready,
  anyDragging,
  muted,
  sceneMode,
  targetPosition,
  ...props
}: any) {
  const api = useRef<any>(null)
  const pos = useMemo(() => {
    if (position) return position
    const minDist = 5
    let x: number, y: number
    do {
      x = r(25)
      y = r(25)
    } while (Math.abs(x) < minDist && Math.abs(y) < minDist)
    return [x, y, r(10)]
  }, [])
  const [hovered, setHovered] = useState(false)
  const clickSound = useMemo(() => {
    if (typeof window === 'undefined') return null
    const audio = new Audio('/click.mp3')
    audio.volume = 0.5
    return audio
  }, [])
  const dragging = useRef(false)
  const dragStart = useRef(new THREE.Vector2())
  const wasDragged = useRef(false)
  const velocity = useRef(new THREE.Vector2())
  const worldPos = useMemo(() => new THREE.Vector3(), [])
  const prevMode = useRef<SceneMode | null>(null)
  // Target rotation for column mode — slightly tilted so the face is visible
  const columnRotation = useMemo(() => new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, 0.2, 0)), [])

  // Handle mode transitions
  useFrame(({ mouse, viewport, camera, size }) => {
    if (!api.current) return

    // Set body type on first frame or when mode changes
    if (prevMode.current !== sceneMode) {
      api.current.wakeUp()
      if (sceneMode === 'column') {
        api.current.setBodyType(2) // kinematic
      } else {
        api.current.setBodyType(0) // dynamic
      }
      prevMode.current = sceneMode
    }

    if (sceneMode === 'column') {
      // Lerp toward target position
      if (targetPosition) {
        const t = api.current.translation()
        if (t) {
          const lerpFactor = 0.08
          const nx = t.x + (targetPosition[0] - t.x) * lerpFactor
          const ny = t.y + (targetPosition[1] - t.y) * lerpFactor
          const nz = t.z + (targetPosition[2] - t.z) * lerpFactor
          api.current.setNextKinematicTranslation({ x: nx, y: ny, z: nz })
        }
        // Lerp rotation toward face-forward orientation
        const r = api.current.rotation()
        if (r) {
          const current = new THREE.Quaternion(r.x, r.y, r.z, r.w)
          current.slerp(columnRotation, 0.08)
          api.current.setNextKinematicRotation({ x: current.x, y: current.y, z: current.z, w: current.w })
        }
      }
    } else {
      // Magnetic mode — attract toward center
      if (!dragging.current && ready) {
        const t = api.current.translation()
        if (t) {
          const dist = Math.sqrt(t.x * t.x + t.y * t.y + t.z * t.z)
          if (dist > 2.5) {
            const strength = Math.min(dist * 0.15, 1.0)
            api.current.applyImpulse(vec.set(-t.x * strength, -t.y * strength, -t.z * strength))
          } else if (dist > 1.0) {
            // Gentle pull close to center — avoid overshoot
            const strength = dist * 0.05
            api.current.applyImpulse(vec.set(-t.x * strength, -t.y * strength, -t.z * strength))
          }
        }
      }

      // Drag follow
      if (dragging.current) {
        const translation = api.current.translation()
        if (translation) {
          const targetX = (mouse.x * viewport.width) / 2
          const targetY = (mouse.y * viewport.height) / 2
          const springFactor = 0.12
          const newX = translation.x + (targetX - translation.x) * springFactor
          const newY = translation.y + (targetY - translation.y) * springFactor
          velocity.current.set(newX - translation.x, newY - translation.y)
          api.current.setNextKinematicTranslation({ x: newX, y: newY, z: translation.z })
        }
      }
    }

    // Project world position to screen for label overlay
    const translation = api.current.translation()
    if (translation && onScreenUpdate) {
      worldPos.set(translation.x, translation.y, translation.z)
      worldPos.project(camera)
      const x = (worldPos.x * 0.5 + 0.5) * size.width
      const y = (-worldPos.y * 0.5 + 0.5) * size.height
      onScreenUpdate(index, x, y)
    }
  })

  const onPointerDown = (e: any) => {
    if (sceneMode === 'column') return
    e.stopPropagation()
    ;(e.target as HTMLElement)?.setPointerCapture?.(e.pointerId)
    dragging.current = true
    wasDragged.current = false
    dragStart.current.set(e.clientX, e.clientY)
    api.current?.wakeUp()
    api.current?.setBodyType(2)
    onDragChange?.(index, true)
  }

  const onPointerUp = (e: any) => {
    if (sceneMode === 'column') {
      onClick?.(index)
      return
    }
    if (!dragging.current) return
    dragging.current = false
    api.current?.setBodyType(0)
    api.current?.wakeUp()
    onDragChange?.(index, false)

    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < 5) {
      onClick?.(index)
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

  const svgFile = props.svgFile || SVG_SHAPES[0]
  const svgVertices = useSvgColliderVertices(svgFile)

  return (
    <RigidBody linearDamping={12} angularDamping={4} friction={0.5} restitution={0.1} position={pos} ref={api} colliders={false}>
      {svgVertices && <ConvexHullCollider args={[svgVertices]} />}
      <group
        onPointerOver={(e) => {
          e.stopPropagation()
          if (anyDragging?.current !== null) return
          setHovered(true)
          onHover?.(index, true)
          if (clickSound && !muted) {
            clickSound.currentTime = 0
            clickSound.play()
          }
        }}
        onPointerOut={() => {
          if (anyDragging?.current !== null && !dragging.current) return
          setHovered(false)
          onHover?.(index, false)
        }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {children ? children : <SvgModel hovered={hovered} svgFile={svgFile} coverUrl={props.coverUrl} />}
      </group>
    </RigidBody>
  )
}
